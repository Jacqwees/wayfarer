import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PlacesView from '@/components/trips/PlacesView'

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

export default async function PlacesPage({ params }: { params: { tripId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('trip_members').select('role').eq('trip_id', params.tripId).eq('user_id', user.id).single()
  if (!membership) notFound()

  const [{ data: trip }, { data: savedPlaces }, { data: hotel }] = await Promise.all([
    supabase.from('trips').select('destination_name, destination_lat, destination_lng, start_date, end_date').eq('id', params.tripId).single(),
    supabase.from('places').select('*').eq('trip_id', params.tripId).order('created_at'),
    supabase.from('hotels').select('lat, lng').eq('trip_id', params.tripId).order('check_in_date', { ascending: true }).limit(1).maybeSingle(),
  ])

  const days = trip ? getDays(trip.start_date, trip.end_date) : []

  return (
    <PlacesView
      tripId={params.tripId}
      savedPlaces={savedPlaces ?? []}
      destination={{ name: trip?.destination_name ?? '', lat: trip?.destination_lat ?? null, lng: trip?.destination_lng ?? null }}
      hotelLat={hotel?.lat ?? null}
      hotelLng={hotel?.lng ?? null}
      days={days}
    />
  )
}
