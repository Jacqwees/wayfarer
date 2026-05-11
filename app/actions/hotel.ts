'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function saveHotel(tripId: string, data: {
  id?: string
  name: string
  address: string
  lat?: number | null
  lng?: number | null
  check_in_date: string
  check_out_date: string
  booking_ref?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()

  if (data.id) {
    const { error } = await db.from('hotels').update({
      name: data.name,
      address: data.address,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      booking_ref: data.booking_ref || null,
      notes: data.notes || null,
    }).eq('id', data.id).eq('trip_id', tripId)
    if (error) return { error: error.message }
  } else {
    const { error } = await db.from('hotels').insert({
      trip_id: tripId,
      name: data.name,
      address: data.address,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      booking_ref: data.booking_ref || null,
      notes: data.notes || null,
      added_by: user.id,
    })
    if (error) return { error: error.message }
  }

  revalidatePath(`/trips/${tripId}/hotel`)
  return { success: true }
}

export async function deleteHotel(tripId: string, hotelId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  await db.from('hotels').delete().eq('id', hotelId).eq('trip_id', tripId)
  revalidatePath(`/trips/${tripId}/hotel`)
  return { success: true }
}
