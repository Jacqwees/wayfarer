'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function saveFlight(tripId: string, data: {
  id?: string
  direction: 'outbound' | 'return'
  departure_airport: string
  arrival_airport: string
  departure_datetime: string
  arrival_datetime: string
  flight_number?: string
  airline?: string
  booking_ref?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()

  if (data.id) {
    const { error } = await db.from('flights').update({
      direction: data.direction,
      departure_airport: data.departure_airport,
      arrival_airport: data.arrival_airport,
      departure_datetime: data.departure_datetime,
      arrival_datetime: data.arrival_datetime,
      flight_number: data.flight_number || null,
      airline: data.airline || null,
      booking_ref: data.booking_ref || null,
      notes: data.notes || null,
    }).eq('id', data.id).eq('trip_id', tripId)
    if (error) return { error: error.message }
  } else {
    const { error } = await db.from('flights').insert({
      trip_id: tripId,
      direction: data.direction,
      departure_airport: data.departure_airport,
      arrival_airport: data.arrival_airport,
      departure_datetime: data.departure_datetime,
      arrival_datetime: data.arrival_datetime,
      flight_number: data.flight_number || null,
      airline: data.airline || null,
      booking_ref: data.booking_ref || null,
      notes: data.notes || null,
      added_by: user.id,
    })
    if (error) return { error: error.message }
  }

  revalidatePath(`/trips/${tripId}/flights`)
  return { success: true }
}

export async function deleteFlight(tripId: string, flightId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  await db.from('flights').delete().eq('id', flightId).eq('trip_id', tripId)
  revalidatePath(`/trips/${tripId}/flights`)
  return { success: true }
}
