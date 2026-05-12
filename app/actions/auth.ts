'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function requestMagicLink(email: string) {
  const db = createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wayfarer-plum.vercel.app'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'SquadStay <onboarding@resend.dev>'

  const { data, error } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email: email.toLowerCase(),
    options: { redirectTo: `${appUrl}/auth/callback` },
  })

  if (error || !data?.properties?.action_link) {
    return { error: error?.message ?? 'Failed to generate sign-in link' }
  }

  const link = data.properties.action_link

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your SquadStay sign-in link',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#F6F1E6;font-family:system-ui,-apple-system,sans-serif;">
          <div style="max-width:480px;margin:0 auto;padding:32px 20px;">

            <!-- Logo card -->
            <div style="background:linear-gradient(135deg,#C5532A,#E89A5C);border-radius:20px;padding:36px 32px;text-align:center;margin-bottom:28px;">
              <div style="font-size:36px;margin-bottom:8px;">✈️</div>
              <h1 style="color:white;font-size:26px;font-weight:700;margin:0 0 6px;letter-spacing:-0.5px;">SquadStay</h1>
              <p style="color:rgba(255,255,255,0.75);margin:0;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">Group Holiday Planner</p>
            </div>

            <!-- Main card -->
            <div style="background:#FFFBF2;border:1px solid #E0D4BC;border-radius:16px;padding:32px;margin-bottom:20px;">
              <h2 style="font-size:20px;font-weight:600;color:#15110B;margin:0 0 8px;">Sign in to SquadStay</h2>
              <p style="color:#6B5E4E;font-size:15px;line-height:1.6;margin:0 0 28px;">
                Tap the button below to sign in. The link expires in 24 hours.
              </p>

              <a href="${link}"
                style="display:block;background:#C5532A;color:white;text-decoration:none;font-weight:600;font-size:16px;padding:16px 32px;border-radius:999px;text-align:center;margin-bottom:24px;letter-spacing:-0.2px;">
                Sign in to SquadStay →
              </a>

              <!-- Browser tip box -->
              <div style="background:#F6F1E6;border:1px solid #E0D4BC;border-radius:10px;padding:14px 16px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#C5532A;text-transform:uppercase;letter-spacing:0.08em;">Tip — if this opens in Gmail</p>
                <p style="margin:0;font-size:13px;color:#6B5E4E;line-height:1.5;">
                  <strong>iPhone:</strong> Tap the Safari icon (🧭) in the bottom bar.<br>
                  <strong>Android:</strong> Tap ⋮ → <em>Open in Chrome</em>.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <p style="text-align:center;color:#9E8E7A;font-size:12px;line-height:1.5;margin:0;">
              If you didn't request this, you can safely ignore it.<br>
              This link is single-use and expires in 24 hours.
            </p>

          </div>
        </body>
        </html>
      `,
    })
  } catch {
    return { error: 'Failed to send email — check RESEND_API_KEY' }
  }

  return { success: true }
}
