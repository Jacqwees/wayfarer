'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Plane, Hotel, CalendarDays, MapPin,
  Wallet, Users, Bell, UserPlus
} from 'lucide-react'

type Trip = {
  id: string
  name: string
  destination_name: string
  start_date: string
  end_date: string
  cover_photo_url: string | null
}

type Member = {
  id: string
  display_name: string
  avatar_url: string | null
  role: string
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  return `${s.toLocaleDateString('en-GB', opts)} – ${e.toLocaleDateString('en-GB', opts)}`
}

function daysUntil(start: string, end: string) {
  const now = Date.now()
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (now > e) return 'Trip complete'
  if (now >= s) return 'Trip in progress 🎉'
  const days = Math.ceil((s - now) / 86400000)
  return `${days} day${days === 1 ? '' : 's'} to go`
}

const cards = [
  { label: 'Flights', icon: Plane, href: 'flights', color: 'bg-sky-100 text-sky-600' },
  { label: 'Hotel', icon: Hotel, href: 'hotel', color: 'bg-amber-100 text-amber-600' },
  { label: 'Itinerary', icon: CalendarDays, href: 'itinerary', color: 'bg-violet-100 text-violet-600' },
  { label: 'Things To Do', icon: MapPin, href: 'places', color: 'bg-emerald-100 text-emerald-600' },
  { label: 'Expenses', icon: Wallet, href: 'expenses', color: 'bg-rose-100 text-rose-600' },
  { label: 'Members', icon: Users, href: 'members', color: 'bg-indigo-100 text-indigo-600' },
]

export default function TripDashboard({
  trip, role, members, permissions, unreadCount, userId
}: {
  trip: Trip
  role: string
  members: Member[]
  permissions: any
  unreadCount: number
  userId: string
}) {
  const router = useRouter()
  const canInvite = role === 'owner' || (role === 'member' && permissions?.members_can_invite)

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative h-52">
        {trip.cover_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={trip.cover_photo_url} alt={trip.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-violet-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12">
          <button
            onClick={() => router.push('/trips')}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <Link
            href="/notifications"
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center relative"
          >
            <Bell className="w-4 h-4 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>

        {/* Trip info */}
        <div className="absolute bottom-4 left-5 right-5">
          <h1 className="text-white text-xl font-bold leading-tight">{trip.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-white/80 text-xs flex items-center gap-1">
              <MapPin className="w-3 h-3" />{trip.destination_name}
            </span>
            <span className="text-white/80 text-xs">·</span>
            <span className="text-white/80 text-xs">{daysUntil(trip.start_date, trip.end_date)}</span>
          </div>
          <p className="text-white/60 text-xs mt-0.5">{formatDateRange(trip.start_date, trip.end_date)}</p>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-6">
        {/* Members strip */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {members.slice(0, 6).map((m) => (
              <div
                key={m.id}
                className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden"
              >
                {m.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.avatar_url} alt={m.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {m.display_name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {members.length > 6 && (
              <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                +{members.length - 6}
              </div>
            )}
          </div>
          {canInvite && (
            <Link
              href={`/trips/${trip.id}/invite`}
              className="flex items-center gap-1.5 ml-1 text-xs text-primary font-medium"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invite
            </Link>
          )}
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card, i) => {
            const Icon = card.icon
            const isViewerBlocked = role === 'viewer' && card.href === 'expenses'
            if (isViewerBlocked) return null
            return (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Link href={`/trips/${trip.id}/${card.href}`}>
                  <div className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-3 active:scale-[0.97] transition-transform shadow-sm">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm text-foreground">{card.label}</span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
