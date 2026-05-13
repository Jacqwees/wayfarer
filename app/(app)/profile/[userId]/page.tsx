import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import PublicProfileView from '@/components/profile/PublicProfileView'

export default async function PublicProfilePage({ params }: { params: { userId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Redirect to own profile
  if (params.userId === user.id) redirect('/profile')

  const db = createServiceClient()

  const [{ data: profile }, { data: privacy }] = await Promise.all([
    db.from('users').select('id, display_name, avatar_url, created_at, travel_tags').eq('id', params.userId).single(),
    db.from('privacy_settings').select('bio_visibility, home_city_visibility').eq('user_id', params.userId).single(),
  ])

  if (!profile) notFound()

  // Check if viewer is a trip-mate (determines what they can see)
  const { data: sharedTrips } = await db
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', params.userId)

  const theirTripIds = (sharedTrips ?? []).map(r => r.trip_id)
  let isCoTraveller = false
  if (theirTripIds.length > 0) {
    const { count } = await supabase
      .from('trip_members')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('trip_id', theirTripIds)
    isCoTraveller = (count ?? 0) > 0
  }

  // Respect privacy settings — 'trip' = visible to co-travellers, 'private' = hidden
  const { data: fullProfile } = await db
    .from('users').select('bio, home_city').eq('id', params.userId).single()

  const visibleBio = (privacy?.bio_visibility === 'trip' && isCoTraveller) || privacy?.bio_visibility === 'friend'
    ? fullProfile?.bio ?? null
    : null
  const visibleHomeCity = (privacy?.home_city_visibility === 'trip' && isCoTraveller) || privacy?.home_city_visibility === 'friend'
    ? fullProfile?.home_city ?? null
    : null

  // Their stats
  const theirTrips = theirTripIds.length

  let daysAway = 0
  const countrySet = new Set<string>()
  if (theirTripIds.length > 0) {
    const { data: tripData } = await db
      .from('trips').select('destination_name, start_date, end_date').in('id', theirTripIds)
    for (const t of tripData ?? []) {
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
  }

  let squadCount = 0
  if (theirTripIds.length > 0) {
    const { data: squadRows } = await db
      .from('trip_members').select('user_id').in('trip_id', theirTripIds).neq('user_id', params.userId)
    squadCount = new Set((squadRows ?? []).map((r: any) => r.user_id)).size
  }

  return (
    <PublicProfileView
      profile={profile as any}
      visibleBio={visibleBio}
      visibleHomeCity={visibleHomeCity}
      stats={{ trips: theirTrips, countries: countrySet.size, daysAway, squad: squadCount }}
    />
  )
}
