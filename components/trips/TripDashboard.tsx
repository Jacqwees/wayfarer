'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Plane, Hotel, CalendarDays, MapPin,
  Wallet, Users, Bell, UserPlus, Settings, PackageCheck
} from 'lucide-react'

const GRADIENTS = [
  'radial-gradient(120% 80% at 30% 110%, #FFB766 0%, #E8754A 28%, #B33E4F 55%, #4A1F4C 85%)',
  'radial-gradient(120% 90% at 70% 0%, #F4B5C8 0%, #C26F8B 30%, #5E3A6E 60%, #1D1B3A 90%)',
  'radial-gradient(110% 90% at 50% 100%, #FFE7B0 0%, #F5A35E 25%, #D9494B 55%, #1C3C5A 92%)',
  'radial-gradient(120% 90% at 30% 0%, #C9F0E0 0%, #6FC8B2 25%, #3F6D88 55%, #1A2B45 92%)',
  'radial-gradient(120% 90% at 70% 90%, #C8E1E5 0%, #6797A8 28%, #3A4C66 60%, #1B2438 92%)',
  'radial-gradient(120% 90% at 50% 50%, #FFC58A 0%, #E07A3C 30%, #8B2F2A 60%, #2D1414 92%)',
]
function getGradient(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

type Trip = {
  id: string; name: string; destination_name: string
  start_date: string; end_date: string; cover_photo_url: string | null
}
type Member = { id: string; display_name: string; avatar_url: string | null; role: string }

function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T12:00:00')
  const e = new Date(end + 'T12:00:00')
  const nights = Math.round((e.getTime() - s.getTime()) / 86400000)
  return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} → ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${nights} nights`
}

function daysUntil(start: string, end: string) {
  const now = Date.now()
  const s = new Date(start + 'T12:00:00').getTime()
  const e = new Date(end + 'T12:00:00').getTime()
  if (now > e) return 'Trip complete'
  if (now >= s) return 'In progress 🎉'
  const days = Math.ceil((s - now) / 86400000)
  return `${days} day${days === 1 ? '' : 's'} to go`
}

const cards = [
  { label: 'Flights', icon: Plane, href: 'flights', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40' },
  { label: 'Hotel', icon: Hotel, href: 'hotel', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  { label: 'Itinerary', icon: CalendarDays, href: 'itinerary', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
  { label: 'Things To Do', icon: MapPin, href: 'places', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { label: 'Expenses', icon: Wallet, href: 'expenses', color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Packing', icon: PackageCheck, href: 'packing', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40' },
  { label: 'Members', icon: Users, href: 'members', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
]

export default function TripDashboard({
  trip, role, members, permissions, unreadCount, userId, netBalance
}: {
  trip: Trip; role: string; members: Member[]; permissions: any
  unreadCount: number; userId: string; netBalance: number
}) {
  const router = useRouter()
  const canInvite = role === 'owner' || (role === 'member' && permissions?.members_can_invite)
  const canEdit = role === 'owner' || (role === 'member' && permissions?.members_can_edit_info)
  const heroBg = trip.cover_photo_url ? undefined : getGradient(trip.destination_name)

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero */}
      <div className="relative h-56 mx-4 mt-4 rounded-xl overflow-hidden" style={{ background: heroBg }}>
        {trip.cover_photo_url && (
          <img src={trip.cover_photo_url} alt={trip.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
          <button
            onClick={() => router.push('/trips')}
            className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/trips/${trip.id}/settings`}
                className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </Link>
            )}
            <Link href="/notifications"
              className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center relative">
              <Bell className="w-4 h-4 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center font-bold px-0.5">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Trip info */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 mb-1">
            {formatDateRange(trip.start_date, trip.end_date)}
          </p>
          <h1 className="font-display italic text-white text-[44px] leading-[0.88] tracking-[-0.01em]">
            {trip.destination_name.split(',')[0]}
          </h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Trip name + countdown row */}
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">{trip.name}</p>
          <span className="font-mono text-[11px] text-muted-foreground">{daysUntil(trip.start_date, trip.end_date)}</span>
        </div>

        {/* Members strip */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 6).map((m) => (
              <div key={m.id} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden shrink-0">
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
              <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[11px] text-muted-foreground font-semibold">
                +{members.length - 6}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{members.length} people</p>
          {canInvite && (
            <Link href={`/trips/${trip.id}/invite`}
              className="ml-auto flex items-center gap-1.5 text-xs text-primary font-semibold">
              <UserPlus className="w-3.5 h-3.5" /> Invite
            </Link>
          )}
        </div>

        {/* Balance widget */}
        {role !== 'viewer' && netBalance !== 0 && (
          <Link href={`/trips/${trip.id}/expenses`}>
            <div className={`rounded-lg px-4 py-3 flex items-center justify-between ${
              netBalance > 0
                ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900'
                : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900'
            }`}>
              <div>
                <p className={`font-mono text-[10px] uppercase tracking-[0.14em] mb-0.5 ${netBalance > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {netBalance > 0 ? 'You are owed' : 'You owe'}
                </p>
                <p className={`font-display italic text-[22px] leading-none tracking-[-0.01em] ${netBalance > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  £{Math.abs(netBalance).toFixed(2)}
                </p>
              </div>
              <Wallet className={`w-5 h-5 ${netBalance > 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </Link>
        )}

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {cards.map((card, i) => {
            const Icon = card.icon
            if (role === 'viewer' && card.href === 'expenses') return null
            return (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Link href={`/trips/${trip.id}/${card.href}`}>
                  <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 active:scale-[0.97] transition-transform">
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center ${card.bg}`}>
                      <Icon className={`w-[18px] h-[18px] ${card.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground leading-tight">{card.label}</p>
                    </div>
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
