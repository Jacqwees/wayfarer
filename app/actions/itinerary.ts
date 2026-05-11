'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function addItineraryItem(tripId: string, data: {
  date: string
  title: string
  description?: string
  time?: string
  lat?: number | null
  lng?: number | null
  place_id?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()

  const { data: membership } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
  if (!membership) return { error: 'Not a member' }

  if (membership.role === 'viewer') {
    const { data: perms } = await db.from('trip_permissions').select('members_can_add_itinerary').eq('trip_id', tripId).single()
    if (!perms?.members_can_add_itinerary) return { error: 'You do not have permission to add items' }
  }

  const { error } = await db.from('itinerary_items').insert({
    trip_id: tripId,
    date: data.date,
    title: data.title,
    description: data.description || null,
    time: data.time || null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    place_id: data.place_id ?? null,
    added_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/itinerary`)
  return { success: true }
}

export async function updateItineraryItem(tripId: string, itemId: string, data: {
  title: string
  description?: string
  time?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  const { error } = await db.from('itinerary_items').update({
    title: data.title,
    description: data.description || null,
    time: data.time || null,
  }).eq('id', itemId).eq('trip_id', tripId)

  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/itinerary`)
  return { success: true }
}

export async function deleteItineraryItem(tripId: string, itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  await db.from('itinerary_items').delete().eq('id', itemId).eq('trip_id', tripId)
  revalidatePath(`/trips/${tripId}/itinerary`)
  return { success: true }
}
