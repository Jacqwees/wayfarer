'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function addPackingItem(tripId: string, label: string, assignedTo: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  const { data: membership } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
  if (!membership) return { error: 'Not a member' }

  const { error } = await db.from('packing_items').insert({
    trip_id: tripId,
    label: label.trim(),
    assigned_to: assignedTo,
    added_by: user.id,
    packed: false,
  })
  if (error) return { error: error.message }

  revalidatePath(`/trips/${tripId}/packing`)
  return { success: true }
}

export async function togglePackingItem(tripId: string, itemId: string, packed: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  await db.from('packing_items').update({ packed, packed_by: packed ? user.id : null }).eq('id', itemId).eq('trip_id', tripId)

  revalidatePath(`/trips/${tripId}/packing`)
  return { success: true }
}

export async function deletePackingItem(tripId: string, itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  const { data: item } = await db.from('packing_items').select('added_by').eq('id', itemId).single()

  const { data: membership } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
  if (item?.added_by !== user.id && membership?.role !== 'owner') return { error: 'Cannot delete this item' }

  await db.from('packing_items').delete().eq('id', itemId)
  revalidatePath(`/trips/${tripId}/packing`)
  return { success: true }
}
