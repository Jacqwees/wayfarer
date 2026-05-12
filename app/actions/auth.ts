'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function requestOtp(email: string) {
  const db = createServiceClient()
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'SquadStay <onboarding@resend.dev>'

  const { data, error } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email: email.toLowerCase(),
  })

  if (error || !data?.properties?.email_otp) {
    return { error: error?.message ?? 'Failed to generate code' }
  }

  const code = data.properties.email_otp

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `${code} is your SquadStay code`,
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

            <div style="background:#FFFBF2;border:1px solid #E0D4BC;border-radius:16px;padding:32px;text-align:center;margin-bottom:16px;">
              <p style="color:#6B5E4E;font-size:14px;margin:0 0 20px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Your sign-in code</p>
              <div style="background:#F6F1E6;border:2px solid #E0D4BC;border-radius:14px;padding:20px 32px;display:inline-block;margin-bottom:20px;">
                <span style="font-family:monospace;font-size:40px;font-weight:700;color:#15110B;letter-spacing:0.15em;">${code}</span>
              </div>
              <p style="color:#9E8E7A;font-size:13px;margin:0;">Enter this code in SquadStay to sign in.<br>It expires in 10 minutes.</p>
            </div>

            <p style="text-align:center;color:#9E8E7A;font-size:12px;margin:0;">If you didn't request this, you can safely ignore it.</p>
          </div>
        </body>
        </html>
      `,
    })
  } catch {
    return { error: 'Failed to send code — check RESEND_API_KEY and RESEND_FROM_EMAIL' }
  }

  return { success: true }
}

export async function ensureUserSetup() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as string, isNewUser: false, onboardingComplete: false }

  const db = createServiceClient()

  const { data: existingUser } = await db
    .from('users')
    .select('id, onboarding_complete')
    .eq('id', user.id)
    .single()

  if (!existingUser) {
    await db.from('users').insert({
      id: user.id,
      email: user.email!,
      display_name: user.email!.split('@')[0],
      onboarding_complete: false,
    })
    await db.from('privacy_settings').insert({
      user_id: user.id,
      phone_visibility: 'trip',
      bio_visibility: 'trip',
      home_city_visibility: 'trip',
    })

    // Convert any pending invitations for this email into notifications
    const { data: pendingInvites } = await db
      .from('invitations')
      .select('id, trip_id, invited_by')
      .eq('invited_email', user.email!.toLowerCase())
      .eq('status', 'pending')

    if (pendingInvites?.length) {
      await db.from('notifications').insert(
        pendingInvites.map((inv) => ({
          user_id: user.id,
          type: 'trip_invitation',
          trip_id: inv.trip_id,
          reference_id: inv.id,
          message: 'You have a pending invitation to join a trip',
        }))
      )
    }

    return { isNewUser: true, onboardingComplete: false, error: null as null }
  }

  return {
    isNewUser: false,
    onboardingComplete: existingUser.onboarding_complete as boolean,
    error: null as null,
  }
}
