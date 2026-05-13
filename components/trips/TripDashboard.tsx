'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  ChevronLeft, Plane, Hotel, CalendarDays, MapPin,
  Wallet, Users, Bell, UserPlus, Settings, PackageCheck
} from 'lucide-react'

// ─── Gradients ────────────────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
type Trip = {
  id: string; name: string; destination_name: string
  start_date: string; end_date: string; cover_photo_url: string | null
}
type Member = { id: string; display_name: string; avatar_url: string | null; role: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T12:00:00')
  const e = new Date(end + 'T12:00:00')
  const nights = Math.round((e.getTime() - s.getTime()) / 86400000)
  return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} → ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${nights}n`
}

function pad(n: number) { return String(n).padStart(2, '0') }

function useCountdown(startDate: string, endDate: string) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const now = Date.now()
  const s = new Date(startDate + 'T12:00:00').getTime()
  const e = new Date(endDate + 'T12:00:00').getTime()

  if (now > e) return { status: 'done' as const, days: 0, hms: '' }
  if (now >= s) return { status: 'active' as const, days: 0, hms: '' }

  const diff = s - now
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return { status: 'upcoming' as const, days, hms: `${pad(hours)}:${pad(mins)}:${pad(secs)}` }
}

// ─── Member avatars ───────────────────────────────────────────────────────────
function MemberStack({ members, max = 5 }: { members: Member[]; max?: number }) {
  const shown = members.slice(0, max)
  const extra = members.length - max
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {shown.map((m) => (
          <div key={m.id} className="w-7 h-7 rounded-full border-2 border-white/30 bg-white/20 overflow-hidden shrink-0">
            {m.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.avatar_url} alt={m.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/30 flex items-center justify-center text-white text-[10px] font-bold">
                {m.display_name[0]?.toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {extra > 0 && (
          <div className="w-7 h-7 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center text-white text-[10px] font-semibold">
            +{extra}
          </div>
        )}
      </div>
      <span className="text-white/80 text-[11px] font-medium">{members.length} going</span>
    </div>
  )
}

// ─── Countdown ticker ─────────────────────────────────────────────────────────
function CountdownTicker({ trip }: { trip: Trip }) {
  const { status, days, hms } = useCountdown(trip.start_date, trip.end_date)

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-3.5 flex items-center justify-between gap-4">
      {status === 'done' && (
        <>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-0.5">Trip</p>
            <p className="font-display italic text-[22px] leading-none text-foreground">Complete</p>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            ✓ done
          </span>
        </>
      )}
      {status === 'active' && (
        <>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-0.5">Right now</p>
            <p className="font-display italic text-[22px] leading-none text-foreground">On trip 🎉</p>
          </div>
          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            ● live
          </span>
        </>
      )}
      {status === 'upcoming' && (
        <>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-0.5">Takeoff in</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display italic text-[32px] leading-none tracking-[-0.01em] text-foreground">{days}</span>
              <span className="font-mono text-[11px] text-muted-foreground">days</span>
            </div>
            <p className="font-mono text-[13px] text-muted-foreground mt-0.5 tabular-nums">{hms}</p>
          </div>
          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
            ● booked
          </span>
        </>
      )}
    </div>
  )
}

// ─── DashTile ─────────────────────────────────────────────────────────────────
function DashTile({
  icon: Icon, eyebrow, stat, sub, href, accent = false, delay = 0
}: {
  icon: React.ElementType; eyebrow: string; stat: string; sub?: string
  href: string; accent?: boolean; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={href}>
        <div className={`rounded-2xl p-4 flex flex-col gap-3 active:scale-[0.97] transition-transform min-h-[108px] ${
          accent
            ? 'bg-foreground text-background'
            : 'bg-card border border-border'
        }`}>
          {/* Icon chip */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            accent ? 'bg-white/15' : 'bg-background'
          }`}>
            <Icon className={`w-4 h-4 ${accent ? 'text-background' : 'text-foreground'}`} />
          </div>
          {/* Content */}
          <div className="flex-1">
            <p className={`font-mono text-[9px] uppercase tracking-[0.16em] mb-0.5 ${
              accent ? 'text-white/60' : 'text-muted-foreground'
            }`}>{eyebrow}</p>
            <p className={`font-semibold text-[15px] leading-tight ${
              accent ? 'text-background' : 'text-foreground'
            }`}>{stat}</p>
            {sub && (
              <p className={`text-[11px] mt-0.5 ${
                accent ? 'text-white/60' : 'text-muted-foreground'
              }`}>{sub}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
type TileStats = {
  itineraryCount: number
  placesCount: number
  packingPacked: number
  packingTotal: number
}

export default function TripDashboard({
  trip, role, members, permissions, unreadCount, userId, netBalance, stats
}: {
  trip: Trip; role: string; members: Member[]; permissions: any
  unreadCount: number; userId: string; netBalance: number
  stats: TileStats
}) {
  const router = useRouter()
  const canInvite = role === 'owner' || (role === 'member' && permissions?.members_can_invite)
  const canEdit = role === 'owner' || (role === 'member' && permissions?.members_can_edit_info)
  const heroBg = trip.cover_photo_url ? undefined : getGradient(trip.destination_name)

  const balanceLabel = netBalance > 0
    ? `+£${Math.abs(netBalance).toFixed(2)}`
    : netBalance < 0
      ? `-£${Math.abs(netBalance).toFixed(2)}`
      : 'Settled'

  const packingLabel = stats.packingTotal === 0
    ? 'Nothing added yet'
    : stats.packingPacked === stats.packingTotal
      ? `All ${stats.packingTotal} packed ✓`
      : `${stats.packingPacked} / ${stats.packingTotal} packed`

  const itineraryLabel = stats.itineraryCount === 0
    ? 'Nothing planned yet'
    : `${stats.itineraryCount} item${stats.itineraryCount === 1 ? '' : 's'} planned`

  const placesLabel = stats.placesCount === 0
    ? 'None saved yet'
    : `${stats.placesCount} place${stats.placesCount === 1 ? '' : 's'} saved`

  return (
    <div className="min-h-screen bg-background pb-32">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative h-[280px] w-full overflow-hidden" style={{ background: heroBg }}>
        {trip.cover_photo_url && (
          <img src={trip.cover_photo_url} alt={trip.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(0,0,0,0.55) 100%)'
        }} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12">
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

        {/* Bottom: destination + members */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70 mb-1">
            {formatDateRange(trip.start_date, trip.end_date)}
          </p>
          <h1 className="font-display italic text-white text-[46px] leading-[0.88] tracking-[-0.01em] mb-3">
            {trip.destination_name.split(',')[0]}
          </h1>
          <div className="flex items-center justify-between">
            <MemberStack members={members} />
            {canInvite && (
              <Link href={`/trips/${trip.id}/invite`}
                className="flex items-center gap-1.5 text-[11px] text-white/90 font-semibold bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <UserPlus className="w-3 h-3" /> Invite
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── BELOW HERO ───────────────────────────────────────── */}
      <div className="px-4 pt-4 space-y-3">

        {/* Trip name */}
        <p className="font-semibold text-[15px] text-foreground">{trip.name}</p>

        {/* Countdown ticker */}
        <CountdownTicker trip={trip} />

        {/* Tile grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">

          <DashTile
            icon={Plane} eyebrow="Flights" stat="Flights"
            sub="Book & track" href={`/trips/${trip.id}/flights`} delay={0.04}
          />
          <DashTile
            icon={Hotel} eyebrow="Hotel" stat="Hotel"
            sub="Accommodation" href={`/trips/${trip.id}/hotel`} delay={0.07}
          />

          {/* Itinerary — accent dark tile */}
          <DashTile
            icon={CalendarDays} eyebrow="Itinerary" stat={itineraryLabel}
            href={`/trips/${trip.id}/itinerary`} accent delay={0.10}
          />

          <DashTile
            icon={MapPin} eyebrow="Things to do" stat={placesLabel}
            href={`/trips/${trip.id}/places`} delay={0.13}
          />

          {role !== 'viewer' && (
            <DashTile
              icon={Wallet}
              eyebrow="Expenses"
              stat={balanceLabel}
              sub={netBalance === 0 ? 'All settled up' : netBalance > 0 ? 'You are owed' : 'You owe'}
              href={`/trips/${trip.id}/expenses`}
              delay={0.16}
            />
          )}

          <DashTile
            icon={PackageCheck} eyebrow="Packing" stat={packingLabel}
            href={`/trips/${trip.id}/packing`} delay={0.19}
          />

          <DashTile
            icon={Users}
            eyebrow="Squad"
            stat={`${members.length} ${members.length === 1 ? 'person' : 'people'}`}
            sub="View members"
            href={`/trips/${trip.id}/members`}
            delay={0.22}
          />

        </div>
      </div>
    </div>
  )
}
