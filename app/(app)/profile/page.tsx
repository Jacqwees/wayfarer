import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileView from '@/components/profile/ProfileView'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: privacy }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('privacy_settings').select('*').eq('user_id', user.id).single(),
  ])

  // All trips this user is on
  const { data: myTripRows } = await supabase
    .from('trip_members')
    .select('trip_id, trips(destination_name, start_date, end_date)')
    .eq('user_id', user.id)

  const myTrips = (myTripRows ?? []).map(r => r.trips as any).filter(Boolean)
  const tripIds = (myTripRows ?? []).map(r => r.trip_id)

  // Days away + countries
  let daysAway = 0
  const countrySet = new Set<string>()
  for (const t of myTrips) {
    if (t.start_date && t.end_date) {
      daysAway += Math.max(0, Math.round(
        (new Date(t.end_date + 'T12:00:00').getTime() - new Date(t.start_date + 'T12:00:00').getTime()) / 86400000
      ))
    }
    if (t.destination_name) {
      const parts = (t.destination_name as string).split(',')
      const country = parts[parts.length - 1]?.trim()
      if (country) countrySet.add(country)
    }
  }

  // Squad (distinct co-travellers)
  let squadCount = 0
  if (tripIds.length > 0) {
    const { data: squadRows } = await supabase
      .from('trip_members').select('user_id').in('trip_id', tripIds).neq('user_id', user.id)
    squadCount = new Set((squadRows ?? []).map(r => r.user_id)).size
  }

  // Cross-trip spend (expenses paid by this user)
  let totalSpent = 0
  if (tripIds.length > 0) {
    const { data: expRows } = await supabase
      .from('expenses').select('amount_gbp').eq('paid_by', user.id).in('trip_id', tripIds)
    totalSpent = (expRows ?? []).reduce((s, e) => s + (e.amount_gbp ?? 0), 0)
  }

  return (
    <ProfileView
      profile={profile}
      privacy={privacy}
      stats={{
        trips: myTrips.length,
        countries: countrySet.size,
        daysAway,
        squad: squadCount,
        totalSpent,
      }}
    />
  )
}
