'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import { sendPushToUser } from './push'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvitation(tripId: string, email: string, role: 'member' | 'viewer') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()

  // Check inviter is owner or has invite permission
  const { data: membership } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
  if (!membership) return { error: 'Not a trip member' }

  if (membership.role !== 'owner') {
    const { data: perms } = await db.from('trip_permissions').select('members_can_invite').eq('trip_id', tripId).single()
    if (!perms?.members_can_invite) return { error: 'You do not have permission to invite' }
  }

  // Check not already a member
  const { data: existing } = await db.from('invitations').select('id, status').eq('trip_id', tripId).eq('invited_email', email.toLowerCase()).eq('status', 'pending').maybeSingle()
  if (existing) return { error: 'An invitation is already pending for this email' }

  let existingUserId: string | null = null
  const { data: alreadyMember } = await db.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle()
  if (alreadyMember) {
    const { data: isMember } = await db.from('trip_members').select('id').eq('trip_id', tripId).eq('user_id', alreadyMember.id).maybeSingle()
    if (isMember) return { error: 'This person is already on the trip' }
    existingUserId = alreadyMember.id
  }

  const { data: trip } = await db.from('trips').select('name, destination_name, start_date, end_date').eq('id', tripId).single()
  const { data: inviter } = await db.from('users').select('display_name').eq('id', user.id).single()

  // Create invitation record
  const { data: invitation, error: invErr } = await db.from('invitations').insert({
    trip_id: tripId,
    invited_email: email.toLowerCase(),
    invited_role: role,
    invited_by: user.id,
    status: 'pending',
  }).select('id').single()

  if (invErr || !invitation) return { error: invErr?.message ?? 'Failed to create invitation' }

  // If the invited person already has an account, notify them directly in-app
  if (existingUserId) {
    await db.from('notifications').insert({
      user_id: existingUserId,
      type: 'trip_invitation',
      trip_id: tripId,
      reference_id: invitation.id,
      message: `${inviter?.display_name ?? 'Someone'} invited you to join ${trip?.name}`,
    })
    sendPushToUser(existingUserId, {
      title: 'Trip invitation! ✈️',
      body: `${inviter?.display_name ?? 'Someone'} invited you to join ${trip?.name ?? 'a trip'}`,
      url: '/notifications',
      tag: 'invitation',
    }).catch(() => {})
  }

  // Send email via Resend
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://squadstay.co.uk'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'SquadStay <onboarding@resend.dev>'
  const loginUrl = `${appUrl}/login?email=${encodeURIComponent(email.toLowerCase())}`

  const tripDates = trip?.start_date && trip?.end_date
    ? (() => {
        const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        return `${fmt(trip.start_date)} – ${fmt(trip.end_date)}`
      })()
    : null

  let emailError: string | null = null
  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `You're invited to ${trip?.name ?? 'a trip'} ✈️`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#F6F1E6;font-family:system-ui,-apple-system,sans-serif;">
          <div style="max-width:420px;margin:0 auto;padding:32px 20px;">

            <div style="background:linear-gradient(135deg,#C5532A,#E89A5C);border-radius:20px;padding:28px 32px;text-align:center;margin-bottom:24px;">
              <div style="font-size:32px;margin-bottom:6px;">✈️</div>
              <h1 style="color:white;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.4px;">SquadStay</h1>
            </div>

            <div style="background:#FFFBF2;border:1px solid #E0D4BC;border-radius:16px;padding:32px;margin-bottom:16px;">
              <p style="color:#C5532A;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">You're invited</p>
              <h2 style="font-size:24px;font-weight:700;color:#15110B;margin:0 0 6px;letter-spacing:-0.4px;">Come join the squad!</h2>
              <p style="color:#6B5E4E;font-size:15px;line-height:1.6;margin:0 0 24px;">
                <strong>${inviter?.display_name ?? 'Someone'}</strong> has invited you to join
                <strong>${trip?.name ?? 'a trip'}</strong>${trip?.destination_name ? ` in <strong>${trip.destination_name}</strong>` : ''}${tripDates ? ` (${tripDates})` : ''}.
              </p>

              <a href="${loginUrl}"
                style="display:block;background:#C5532A;color:white;text-decoration:none;font-weight:600;font-size:16px;padding:16px 32px;border-radius:999px;text-align:center;margin-bottom:20px;">
                View invitation →
              </a>

              <p style="color:#9E8E7A;font-size:13px;text-align:center;margin:0;">
                Sign in to SquadStay — your invitation will be waiting.
              </p>
            </div>

            <p style="text-align:center;color:#9E8E7A;font-size:12px;">If you weren't expecting this, you can ignore it.</p>
          </div>
        </body>
        </html>
      `,
    })
    if ('error' in result && result.error) {
      emailError = (result.error as { message?: string }).message ?? 'Email delivery failed'
    }
  } catch (e: unknown) {
    emailError = e instanceof Error ? e.message : 'Email delivery failed'
  }

  // Notify existing members that an invitation was sent (informational — NOT the accept/decline type)
  const { data: members } = await db.from('trip_members').select('user_id').eq('trip_id', tripId)
  if (members) {
    await db.from('notifications').insert(
      members.map(m => ({
        user_id: m.user_id,
        type: 'invitation_sent',
        trip_id: tripId,
        reference_id: invitation.id,
        message: `${inviter?.display_name ?? 'Someone'} invited ${email} to ${trip?.name}`,
      }))
    )
    for (const m of members) {
      sendPushToUser(m.user_id, { title: 'Invitation sent', body: `${inviter?.display_name ?? 'Someone'} invited ${email} to ${trip?.name}`, url: `/trips/${tripId}/invite`, tag: 'invitation' }).catch(() => {})
    }
  }

  revalidatePath(`/trips/${tripId}/invite`)
  return { success: true, emailError }
}

export async function cancelInvitation(tripId: string, invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  const { data: membership } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
  if (!membership) return { error: 'Not a member' }
  if (membership.role !== 'owner') {
    const { data: perms } = await db.from('trip_permissions').select('members_can_invite').eq('trip_id', tripId).single()
    if (!perms?.members_can_invite) return { error: 'No permission' }
  }

  await db.from('invitations').delete().eq('id', invitationId).eq('trip_id', tripId)
  revalidatePath(`/trips/${tripId}/invite`)
  return { success: true }
}

export async function resendInvitationEmail(tripId: string, invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  const { data: inv } = await db.from('invitations').select('*').eq('id', invitationId).eq('trip_id', tripId).single()
  if (!inv) return { error: 'Invitation not found' }

  const { data: trip } = await db.from('trips').select('name, destination_name, start_date, end_date').eq('id', tripId).single()
  const { data: inviter } = await db.from('users').select('display_name').eq('id', user.id).single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://squadstay.co.uk'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'SquadStay <onboarding@resend.dev>'
  const loginUrl = `${appUrl}/login?email=${encodeURIComponent(inv.invited_email)}`
  try {
    await resend.emails.send({
      from: fromEmail,
      to: inv.invited_email,
      subject: `Reminder: you're invited to ${trip?.name ?? 'a trip'} ✈️`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#F6F1E6;font-family:system-ui,-apple-system,sans-serif;">
          <div style="max-width:420px;margin:0 auto;padding:32px 20px;">
            <div style="background:linear-gradient(135deg,#C5532A,#E89A5C);border-radius:20px;padding:28px 32px;text-align:center;margin-bottom:24px;">
              <div style="font-size:32px;margin-bottom:6px;">✈️</div>
              <h1 style="color:white;font-size:22px;font-weight:700;margin:0;">SquadStay</h1>
            </div>
            <div style="background:#FFFBF2;border:1px solid #E0D4BC;border-radius:16px;padding:32px;margin-bottom:16px;">
              <p style="color:#C5532A;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">Reminder</p>
              <h2 style="font-size:22px;font-weight:700;color:#15110B;margin:0 0 12px;">Still waiting for you!</h2>
              <p style="color:#6B5E4E;font-size:15px;line-height:1.6;margin:0 0 24px;">
                <strong>${inviter?.display_name ?? 'Someone'}</strong> invited you to join <strong>${trip?.name ?? 'a trip'}</strong> on SquadStay. Your spot is still open.
              </p>
              <a href="${loginUrl}"
                style="display:block;background:#C5532A;color:white;text-decoration:none;font-weight:600;font-size:16px;padding:16px 32px;border-radius:999px;text-align:center;margin-bottom:20px;">
                View invitation →
              </a>
              <p style="color:#9E8E7A;font-size:13px;text-align:center;margin:0;">Sign in to SquadStay — your invitation will be waiting.</p>
            </div>
            <p style="text-align:center;color:#9E8E7A;font-size:12px;">If you weren't expecting this, you can ignore it.</p>
          </div>
        </body>
        </html>
      `,
    })
  } catch { return { error: 'Failed to send email' } }

  revalidatePath(`/trips/${tripId}/invite`)
  return { success: true }
}

export async function generateInviteLink(tripId: string, role: 'member' | 'viewer' = 'member') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', url: null }

  const db = createServiceClient()
  const { data: membership } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
  if (!membership) return { error: 'Not a member', url: null }
  if (membership.role !== 'owner') {
    const { data: perms } = await db.from('trip_permissions').select('members_can_invite').eq('trip_id', tripId).single()
    if (!perms?.members_can_invite) return { error: 'No permission to invite', url: null }
  }

  // Reuse the invitations table — sentinel email marks this as a link invite
  await db.from('invitations').delete().eq('trip_id', tripId).eq('invited_email', '__link__')
  const { data: inv, error } = await db.from('invitations').insert({
    trip_id: tripId,
    invited_email: '__link__',
    invited_role: role,
    invited_by: user.id,
    status: 'pending',
  }).select('id').single()
  if (error || !inv) return { error: error?.message ?? 'Failed to generate link', url: null }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://squadstay.co.uk'
  revalidatePath(`/trips/${tripId}/invite`)
  return { error: null, url: `${appUrl}/join/${inv.id}` }
}

export async function revokeInviteLink(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  await db.from('invitations').delete().eq('trip_id', tripId).eq('invited_email', '__link__')
  revalidatePath(`/trips/${tripId}/invite`)
  return { success: true }
}

export async function respondToInvitation(invitationId: string, accept: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  const { data: inv } = await db.from('invitations').select('*').eq('id', invitationId).single()
  if (!inv) return { error: 'Invitation not found' }
  if (inv.invited_email !== user.email?.toLowerCase()) return { error: 'This invitation is not for you' }
  if (inv.status !== 'pending') return { error: 'Invitation already responded to' }

  await db.from('invitations').update({ status: accept ? 'accepted' : 'declined' }).eq('id', invitationId)

  if (accept) {
    await db.from('trip_members').insert({ trip_id: inv.trip_id, user_id: user.id, role: inv.invited_role })

    // Notify all existing members
    const { data: members } = await db.from('trip_members').select('user_id').eq('trip_id', inv.trip_id).neq('user_id', user.id)
    const { data: profile } = await db.from('users').select('display_name').eq('id', user.id).single()
    const { data: trip } = await db.from('trips').select('name').eq('id', inv.trip_id).single()
    if (members) {
      await db.from('notifications').insert(
        members.map(m => ({
          user_id: m.user_id,
          type: 'member_joined',
          trip_id: inv.trip_id,
          message: `${profile?.display_name ?? 'Someone'} joined ${trip?.name}`,
        }))
      )
    }
  }

  if (accept) {
    const { data: members2 } = await db.from('trip_members').select('user_id').eq('trip_id', inv.trip_id).neq('user_id', user.id)
    const { data: profile2 } = await db.from('users').select('display_name').eq('id', user.id).single()
    const { data: trip2 } = await db.from('trips').select('name').eq('id', inv.trip_id).single()
    if (members2) {
      for (const m of members2) {
        sendPushToUser(m.user_id, { title: 'New member joined!', body: `${profile2?.display_name ?? 'Someone'} joined ${trip2?.name}`, url: `/trips/${inv.trip_id}/members` }).catch(() => {})
      }
    }
  }

  revalidatePath('/notifications')
  revalidatePath(`/trips/${inv.trip_id}`)
  return { success: true, tripId: accept ? inv.trip_id : null }
}
