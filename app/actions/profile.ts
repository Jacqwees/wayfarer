'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: {
  display_name: string
  phone: string | null
  bio: string | null
  home_city: string | null
  phone_visibility: 'trip' | 'friend' | 'private'
  bio_visibility: 'trip' | 'friend' | 'private'
  home_city_visibility: 'trip' | 'friend' | 'private'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { phone_visibility, bio_visibility, home_city_visibility, ...profileData } = data

  await supabase.from('users').update(profileData).eq('id', user.id)
  await supabase.from('privacy_settings').update({ phone_visibility, bio_visibility, home_city_visibility }).eq('user_id', user.id)

  revalidatePath('/profile')
  return { success: true }
}

export async function updateAvatar(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id)
  revalidatePath('/profile')
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
