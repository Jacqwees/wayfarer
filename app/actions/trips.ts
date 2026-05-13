'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function updateTrip(tripId: string, data: {
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

  const db = createServiceClient()
  const { data: membership } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
  if (!membership) return { error: 'Not a member' }

  if (membership.role !== 'owner') {
    const { data: perms } = await db.from('trip_permissions').select('members_can_edit_info').eq('trip_id', tripId).single()
    if (!perms?.members_can_edit_info) return { error: 'No permission to edit trip' }
  }

  const { error } = await db.from('trips').update(data).eq('id', tripId)
  if (error) return { error: error.message }

  revalidatePath(`/trips/${tripId}`)
  revalidatePath(`/trips/${tripId}/settings`)
  revalidatePath('/trips')
  return { success: true }
}

export async function deleteTrip(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  const { data: membership } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
  if (membership?.role !== 'owner') return { error: 'Only the owner can delete this trip' }

  await db.from('trips').delete().eq('id', tripId)
  revalidatePath('/trips')
  redirect('/trips')
}

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
  if (!user) return { error: 'Not authenticated' as string, data: null }
  const db = createServiceClient()
  const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path)
  if (error || !data) return { error: error?.message ?? 'Could not create upload URL', data: null }
  return { error: null, data }
}
