import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/trips'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure a users row exists (first sign-in creates it)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, onboarding_complete')
        .eq('id', data.user.id)
        .single()

      if (!existingUser) {
        // New user — create profile and privacy settings rows
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          display_name: data.user.email!.split('@')[0],
          onboarding_complete: false,
        })
        await supabase.from('privacy_settings').insert({
          user_id: data.user.id,
          phone_visibility: 'trip',
          bio_visibility: 'trip',
          home_city_visibility: 'trip',
        })
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
