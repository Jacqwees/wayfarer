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
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return GRADIENTS[hash % GRADIENTS.length]
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T12:00:00')
  const e = new Date(end + 'T12:00:00')
  const nights = Math.round((e.getTime() - s.getTime()) / 86400000)
  const startStr = s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const endStr = e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${startStr} → ${endStr} · ${nights} nights`
}

function daysUntil(start: string, end: string) {
  const now = Date.now()
  const s = new Date(start + 'T12:00:00').getTime()
  const e = new Date(end + 'T12:00:00').getTime()
  if (now > e) return null
  if (now >= s) return 'In progress'
  const days = Math.ceil((s - now) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `In ${days} days`
  if (days < 30) return `In ${Math.floor(days / 7)} wks`
  return `In ${Math.floor(days / 30)} mo`
}

export default function TripCard({ trip, index = 0, featured = false }: {
  trip: {
    id: string
    name: string
    destination_name: string
    start_date: string
    end_date: string
    cover_photo_url: string | null
    role: string
  }
  index?: number
  featured?: boolean
}) {
  const countdown = daysUntil(trip.start_date, trip.end_date)
  const bg = trip.cover_photo_url ? undefined : getGradient(trip.destination_name)
  const cardHeight = featured ? 'h-[250px]' : 'h-[190px]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/trips/${trip.id}`}>
        <div
          className={`relative ${cardHeight} rounded-xl overflow-hidden active:scale-[0.98] transition-transform`}
          style={{ background: bg }}
        >
          {trip.cover_photo_url && (
            <img src={trip.cover_photo_url} alt={trip.name} className="absolute inset-0 w-full h-full object-cover" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.58) 100%)' }} />

          {/* Top row — countdown + role badge */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            {countdown && (
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/90 bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-sm">
                {countdown}
              </span>
            )}
            {trip.role === 'viewer' && (
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/80 bg-black/30 px-2 py-1 rounded-sm ml-auto">
                Viewer
              </span>
            )}
          </div>

          {/* Bottom — date + destination name */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 mb-1.5">
              {formatDateRange(trip.start_date, trip.end_date)}
            </p>
            <h3 className="font-display italic text-white text-[34px] leading-[0.9] tracking-[-0.01em]">
              {trip.destination_name.split(',')[0]}
            </h3>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
