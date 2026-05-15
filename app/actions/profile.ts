'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Requires these columns in the `users` table:
//   full_name                    text
//   emergency_contact_name       text
//   emergency_contact_phone      text
//   emergency_contact_relationship text

export async function updateProfile(data: {
  display_name: string
  full_name: string | null
  phone: string | null
  bio: string | null
  home_city: string | null
  travel_tags: string[]
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  phone_visibility: 'trip' | 'friend' | 'private'
  bio_visibility: 'trip' | 'friend' | 'private'
  home_city_visibility: 'trip' | 'friend' | 'private'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  const { phone_visibility, bio_visibility, home_city_visibility, ...profileData } = data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.from('users').update(profileData as any).eq('id', user.id)
  await db.from('privacy_settings').update({ phone_visibility, bio_visibility, home_city_visibility }).eq('user_id', user.id)

  revalidatePath('/profile')
  return { success: true }
}

export async function updateAvatar(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  await db.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id)
  revalidatePath('/profile')
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
