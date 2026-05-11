import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import FlightsView from '@/components/trips/FlightsView'

export default async function FlightsPage({ params }: { params: { tripId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('trip_members').select('role').eq('trip_id', params.tripId).eq('user_id', user.id).single()
  if (!membership) notFound()

  const { data: flights } = await supabase
    .from('flights')
    .select('*')
    .eq('trip_id', params.tripId)
    .order('departure_datetime')

  const canEdit = membership.role === 'owner' || membership.role === 'member'

  return <FlightsView tripId={params.tripId} flights={flights ?? []} canEdit={canEdit} />
}
