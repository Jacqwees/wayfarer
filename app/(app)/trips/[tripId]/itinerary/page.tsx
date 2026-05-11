import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ItineraryView from '@/components/trips/ItineraryView'

function getDays(start: string, end: string): string[] {
  const days: string[] = []
  const cur = new Date(start + 'T12:00:00')
  const endDate = new Date(end + 'T12:00:00')
  while (cur <= endDate) {
    days.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

export default async function ItineraryPage({ params }: { params: { tripId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('trip_members').select('role').eq('trip_id', params.tripId).eq('user_id', user.id).single()
  if (!membership) notFound()

  const { data: trip } = await supabase
    .from('trips').select('start_date, end_date').eq('id', params.tripId).single()

  const { data: perms } = await supabase
    .from('trip_permissions').select('members_can_add_itinerary, itinerary_visible_to_viewers').eq('trip_id', params.tripId).single()

  if (membership.role === 'viewer' && !perms?.itinerary_visible_to_viewers) {
    redirect(`/trips/${params.tripId}`)
  }

  const { data: items } = await supabase
    .from('itinerary_items').select('*').eq('trip_id', params.tripId).order('time')

  const days = trip ? getDays(trip.start_date, trip.end_date) : []
  const canAdd = membership.role === 'owner' || membership.role === 'member' || !!(perms?.members_can_add_itinerary)
  const canEdit = membership.role === 'owner' || membership.role === 'member'

  return (
    <ItineraryView
      tripId={params.tripId}
      items={items ?? []}
      days={days}
      canAdd={canAdd}
      canEdit={canEdit}
    />
  )
}
