import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import TripCard from '@/components/trips/TripCard'

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hello, {profile?.display_name?.split(' ')[0]} 👋</p>
          <h1 className="text-2xl font-bold">Your trips</h1>
        </div>
        <Link
          href="/trips/new"
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 text-white" />
        </Link>
      </div>

      <div className="px-5 pb-24 space-y-8">
        {trips.length === 0 ? (
          <div className="pt-20 flex flex-col items-center text-center space-y-4">
            <div className="text-5xl">✈️</div>
            <h2 className="text-lg font-semibold">No trips yet</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Create your first trip and invite your crew. It only takes a minute.
            </p>
            <Link
              href="/trips/new"
              className="mt-2 px-6 h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" /> Plan a trip
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Upcoming
                </h2>
                <div className="space-y-3">
                  {upcoming.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Past
                </h2>
                <div className="space-y-3 opacity-70">
                  {past.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
