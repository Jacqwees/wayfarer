import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/trips'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const db = createServiceClient()

      // Ensure a users row exists (first sign-in creates it)
      const { data: existingUser } = await db
        .from('users')
        .select('id, onboarding_complete')
        .eq('id', data.user.id)
        .single()

      if (!existingUser) {
        // New user — create profile and privacy settings rows
        await db.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          display_name: data.user.email!.split('@')[0],
          onboarding_complete: false,
        })
        await db.from('privacy_settings').insert({
          user_id: data.user.id,
          phone_visibility: 'trip',
          bio_visibility: 'trip',
          home_city_visibility: 'trip',
        })

        // Convert any pending invitations for this email into notifications
        const { data: pendingInvites } = await db
          .from('invitations')
          .select('id, trip_id, invited_by, trips(name), users!invitations_invited_by_fkey(display_name)')
          .eq('invited_email', data.user.email!.toLowerCase())
          .eq('status', 'pending')

        if (pendingInvites?.length) {
          await db.from('notifications').insert(
            pendingInvites.map((inv) => ({
              user_id: data.user.id,
              type: 'trip_invitation',
              trip_id: inv.trip_id,
              reference_id: inv.id,
              message: `You have a pending invitation to join a trip`,
            }))
          )
        }

        return NextResponse.redirect(`${origin}/onboarding`)
      }

      if (!existingUser.onboarding_complete) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
