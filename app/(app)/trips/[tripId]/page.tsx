import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import TripDashboard from '@/components/trips/TripDashboard'

export default async function TripPage({ params }: { params: { tripId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', params.tripId)
    .single()

  if (!trip) notFound()

  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', params.tripId)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()

  const { data: members } = await supabase
    .from('trip_members')
    .select('role, users(id, display_name, avatar_url)')
    .eq('trip_id', params.tripId)

  const { data: permissions } = await supabase
    .from('trip_permissions')
    .select('*')
    .eq('trip_id', params.tripId)
    .single()

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return (
    <TripDashboard
      trip={trip}
      role={membership.role}
      members={(members ?? []).map((m) => ({ ...(m.users as any), role: m.role }))}
      permissions={permissions}
      unreadCount={unreadCount ?? 0}
      userId={user.id}
    />
  )
}
