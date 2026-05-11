'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'

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

  const { data: alreadyMember } = await db.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle()
  if (alreadyMember) {
    const { data: isMember } = await db.from('trip_members').select('id').eq('trip_id', tripId).eq('user_id', alreadyMember.id).maybeSingle()
    if (isMember) return { error: 'This person is already on the trip' }
  }

  const { data: trip } = await db.from('trips').select('name').eq('id', tripId).single()
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

  // Send email via Resend
  try {
    await resend.emails.send({
      from: 'Wayfarer <onboarding@resend.dev>',
      to: email,
      subject: `You've been invited to ${trip?.name} on Wayfarer`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="background: linear-gradient(135deg, #6366f1, #7c3aed); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
            <h1 style="color: white; font-size: 28px; margin: 0 0 8px;">✈️ Wayfarer</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">Group Holiday Planner</p>
          </div>
          <h2 style="font-size: 20px; margin: 0 0 12px; color: #1a1a2e;">${inviter?.display_name ?? 'Someone'} invited you to join a trip!</h2>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            You've been invited to <strong>${trip?.name}</strong> on Wayfarer as a <strong>${role}</strong>.
          </p>
          <a href="https://wayfarer-plum.vercel.app/login" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 12px; margin-bottom: 24px;">
            View invitation →
          </a>
          <p style="color: #94a3b8; font-size: 13px;">Sign in with this email address to see the invitation in your notifications.</p>
        </div>
      `,
    })
  } catch { /* email failure is non-fatal */ }

  // Notify existing members
  const { data: members } = await db.from('trip_members').select('user_id').eq('trip_id', tripId)
  if (members) {
    await db.from('notifications').insert(
      members.map(m => ({
        user_id: m.user_id,
        type: 'trip_invitation',
        trip_id: tripId,
        reference_id: invitation.id,
        message: `${inviter?.display_name ?? 'Someone'} invited ${email} to ${trip?.name}`,
      }))
    )
  }

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

  revalidatePath('/notifications')
  revalidatePath(`/trips/${inv.trip_id}`)
  return { success: true, tripId: accept ? inv.trip_id : null }
}
