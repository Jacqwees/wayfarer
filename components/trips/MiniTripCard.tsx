'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const GRADIENTS = [
  'radial-gradient(120% 80% at 30% 110%, #FFB766 0%, #E8754A 28%, #B33E4F 55%, #4A1F4C 85%)',
  'radial-gradient(120% 90% at 70% 0%, #F4B5C8 0%, #C26F8B 30%, #5E3A6E 60%, #1D1B3A 90%)',
  'radial-gradient(110% 90% at 50% 100%, #FFE7B0 0%, #F5A35E 25%, #D9494B 55%, #1C3C5A 92%)',
  'radial-gradient(120% 90% at 30% 0%, #C9F0E0 0%, #6FC8B2 25%, #3F6D88 55%, #1A2B45 92%)',
  'radial-gradient(120% 90% at 70% 90%, #C8E1E5 0%, #6797A8 28%, #3A4C66 60%, #1B2438 92%)',
  'radial-gradient(120% 90% at 50% 50%, #FFC58A 0%, #E07A3C 30%, #8B2F2A 60%, #2D1414 92%)',
  'radial-gradient(130% 90% at 50% 100%, #E6D9B5 0%, #9AAC8B 25%, #4F6F75 55%, #1F2D3A 92%)',
]

function getGradient(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T12:00:00')
  const e = new Date(end + 'T12:00:00')
  const nights = Math.round((e.getTime() - s.getTime()) / 86400000)
  const sm = s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const em = e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${sm} → ${em} · ${nights}n`
}

function daysUntil(start: string, end: string): string | null {
  const now = Date.now()
  const s = new Date(start + 'T12:00:00').getTime()
  const e = new Date(end + 'T12:00:00').getTime()
  if (now > e) return null
  if (now >= s) return 'Now'
  const days = Math.ceil((s - now) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 30) return `${days}d`
  return `${Math.floor(days / 30)}mo`
}

type Trip = {
  id: string
  name: string
  destination_name: string
  start_date: string
  end_date: string
  cover_photo_url: string | null
  role: string
}

export default function MiniTripCard({ trip, index = 0 }: { trip: Trip; index?: number }) {
  const bg = trip.cover_photo_url ? undefined : getGradient(trip.destination_name)
  const countdown = daysUntil(trip.start_date, trip.end_date)
  const dest = trip.destination_name.split(',')[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/trips/${trip.id}`}>
        <div className="flex bg-card border border-border rounded-xl overflow-hidden active:scale-[0.98] transition-transform h-[76px]">
          {/* Gradient / photo strip */}
          <div
            className="w-[72px] flex-shrink-0 relative overflow-hidden"
            style={{ background: bg }}
          >
            {trip.cover_photo_url && (
              <img
                src={trip.cover_photo_url}
                alt={dest}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 px-3.5 py-3 flex flex-col justify-between min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display italic text-[21px] leading-[0.9] text-foreground truncate">
                {dest}
              </h3>
              {countdown && (
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-primary whitespace-nowrap flex-shrink-0 mt-0.5">
                  ● {countdown}
                </span>
              )}
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              {formatDateRange(trip.start_date, trip.end_date)}
            </p>
          </div>

          {/* Chevron */}
          <div className="pr-3.5 flex items-center flex-shrink-0">
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
