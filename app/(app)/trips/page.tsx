import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import TripListView from '@/components/trips/TripListView'

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, onboarding_complete')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_complete) redirect('/onboarding')

  const { data: memberships } = await supabase
    .from('trip_members')
    .select(`role, trips(id, name, destination_name, start_date, end_date, cover_photo_url)`)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const trips = (memberships ?? [])
    .map((m) => ({ ...(m.trips as any), role: m.role }))
    .filter(Boolean)

  const now = new Date()
  const upcoming = trips.filter((t) => new Date(t.end_date) >= now)
  const past = trips.filter((t) => new Date(t.end_date) < now)

  const firstName = profile?.display_name?.split(' ')[0] ?? ''

  // Build personalized header summary
  const totalUpcomingNights = upcoming.reduce((sum, t) => {
    const s = new Date(t.start_date + 'T12:00:00')
    const e = new Date(t.end_date + 'T12:00:00')
    return sum + Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000))
  }, 0)

  const heroLine =
    upcoming.length === 0
      ? 'Your trips.'
      : upcoming.length === 1
        ? totalUpcomingNights > 0
          ? `1 trip, ${totalUpcomingNights} nights.`
          : '1 trip coming up.'
        : totalUpcomingNights > 0
          ? `${upcoming.length} trips, ${totalUpcomingNights} nights.`
          : `${upcoming.length} trips coming up.`

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
            {firstName ? `Hello, ${firstName}` : 'Your trips'}
          </p>
          <h1 className="font-display italic text-[38px] leading-[0.9] tracking-[-0.01em] text-foreground">
            {heroLine}
          </h1>
        </div>
        <Link
          href="/trips/new"
          className="mt-1 w-10 h-10 rounded-full bg-foreground flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 text-background" strokeWidth={2.5} />
        </Link>
      </div>

      <TripListView upcoming={upcoming} past={past} />
    </div>
  )
}
