'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function removeMember(tripId: string, targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const db = createServiceClient()
  const { data: me } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
  if (me?.role !== 'owner') return { error: 'Only the owner can remove members' }
  await db.from('trip_members').delete().eq('trip_id', tripId).eq('user_id', targetUserId)
  revalidatePath(`/trips/${tripId}/members`)
  return { success: true }
}

export async function changeRole(tripId: string, targetUserId: string, newRole: 'member' | 'viewer') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const db = createServiceClient()
  const { data: me } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
  if (me?.role !== 'owner') return { error: 'Only the owner can change roles' }
  await db.from('trip_members').update({ role: newRole }).eq('trip_id', tripId).eq('user_id', targetUserId)
  revalidatePath(`/trips/${tripId}/members`)
  return { success: true }
}

export async function transferOwnership(tripId: string, newOwnerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const db = createServiceClient()
  await db.from('trip_members').update({ role: 'member' }).eq('trip_id', tripId).eq('user_id', user.id)
  await db.from('trip_members').update({ role: 'owner' }).eq('trip_id', tripId).eq('user_id', newOwnerId)
  const { data: trip } = await db.from('trips').select('name').eq('id', tripId).single()
  await db.from('notifications').insert({ user_id: newOwnerId, type: 'ownership_transfer', trip_id: tripId, message: `You are now the owner of ${trip?.name}` })
  revalidatePath(`/trips/${tripId}/members`)
  return { success: true }
}

export async function updateTripPermissions(tripId: string, perms: {
  members_can_edit_info: boolean
  members_can_add_itinerary: boolean
  members_can_invite: boolean
  itinerary_visible_to_viewers: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const db = createServiceClient()
  const { data: me } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
  if (me?.role !== 'owner') return { error: 'Only the owner can change permissions' }
  await db.from('trip_permissions').update(perms).eq('trip_id', tripId)
  revalidatePath(`/trips/${tripId}/members`)
  return { success: true }
}
