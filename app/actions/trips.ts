'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
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
  // Verify auth with regular client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Write with service client (bypasses RLS — auth already verified above)
  const db = createServiceClient()

  const { data: trip, error } = await db
    .from('trips')
    .insert({ ...formData, created_by: user.id })
    .select('id')
    .single()

  if (error || !trip) return { error: error?.message ?? 'Failed to create trip' }

  await db.from('trip_members').insert({ trip_id: trip.id, user_id: user.id, role: 'owner' })
  await db.from('trip_permissions').insert({ trip_id: trip.id })

  redirect(`/trips/${trip.id}`)
}

export async function getUploadUrl(bucket: string, path: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const db = createServiceClient()
  const { data } = await db.storage.from(bucket).createSignedUploadUrl(path)
  return data
}
