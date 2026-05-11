import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import TripSettingsView from '@/components/trips/TripSettingsView'

export default async function TripSettingsPage({ params }: { params: { tripId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: membership } = await db.from('trip_members').select('role').eq('trip_id', params.tripId).eq('user_id', user.id).single()
  if (!membership) notFound()

  const { data: perms } = await db.from('trip_permissions').select('members_can_edit_info').eq('trip_id', params.tripId).single()
  const canEdit = membership.role === 'owner' || !!perms?.members_can_edit_info
  if (!canEdit) redirect(`/trips/${params.tripId}`)

  const { data: trip } = await db.from('trips').select('*').eq('id', params.tripId).single()
  if (!trip) notFound()

  return (
    <TripSettingsView
      trip={trip}
      isOwner={membership.role === 'owner'}
    />
  )
}
