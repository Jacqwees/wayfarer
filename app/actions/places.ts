'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function savePlace(tripId: string, data: {
  google_place_id: string
  name: string
  category: 'eat' | 'drink' | 'activity' | 'sight' | 'other'
  lat: number
  lng: number
  price_level?: number | null
  rating?: number | null
  photo_url?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()

  const { data: existing } = await db.from('places')
    .select('id').eq('trip_id', tripId).eq('google_place_id', data.google_place_id).maybeSingle()
  if (existing) return { error: 'Already saved' }

  const { error } = await db.from('places').insert({
    trip_id: tripId,
    google_place_id: data.google_place_id,
    name: data.name,
    category: data.category,
    lat: data.lat,
    lng: data.lng,
    price_level: data.price_level ?? null,
    rating: data.rating ?? null,
    photo_url: data.photo_url ?? null,
    added_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/places`)
  return { success: true }
}

export async function removePlace(tripId: string, placeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  await db.from('places').delete().eq('id', placeId).eq('trip_id', tripId)
  revalidatePath(`/trips/${tripId}/places`)
  return { success: true }
}

export async function addPlaceToItinerary(tripId: string, placeId: string, date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  const { data: place } = await db.from('places').select('*').eq('id', placeId).single()
  if (!place) return { error: 'Place not found' }

  await db.from('itinerary_items').insert({
    trip_id: tripId,
    date,
    title: place.name,
    lat: place.lat,
    lng: place.lng,
    place_id: place.google_place_id,
    added_by: user.id,
  })

  await db.from('places').update({ added_to_itinerary: true }).eq('id', placeId)
  revalidatePath(`/trips/${tripId}/places`)
  revalidatePath(`/trips/${tripId}/itinerary`)
  return { success: true }
}
