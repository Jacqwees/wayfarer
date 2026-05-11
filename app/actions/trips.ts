'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createTrip(formData: {
  name: string
  destination_name: string
  destination_lat: number | null
  destination_lng: number | null
  start_date: string
  end_date: string
  cover_photo_url: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({ ...formData, created_by: user.id })
    .select('id')
    .single()

  if (error || !trip) return { error: error?.message ?? 'Failed to create trip' }

  await supabase.from('trip_members').insert({ trip_id: trip.id, user_id: user.id, role: 'owner' })
  await supabase.from('trip_permissions').insert({ trip_id: trip.id })

  redirect(`/trips/${trip.id}`)
}

export async function getUploadUrl(bucket: string, path: string) {
  const supabase = await createClient()
  const { data } = await supabase.storage.from(bucket).createSignedUploadUrl(path)
  return data
}
