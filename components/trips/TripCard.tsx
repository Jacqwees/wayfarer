'use client'

import Link from 'next/link'
import { MapPin, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  if (s.getFullYear() !== e.getFullYear()) {
    return `${s.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })} – ${e.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`
  }
  return `${s.toLocaleDateString('en-GB', opts)} – ${e.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`
}

function daysUntil(start: string) {
  const diff = Math.ceil((new Date(start).getTime() - Date.now()) / 86400000)
  if (diff < 0) return null
  if (diff === 0) return 'Today!'
  if (diff === 1) return 'Tomorrow'
  return `${diff} days away`
}

export default function TripCard({ trip }: {
  trip: {
    id: string
    name: string
    destination_name: string
    start_date: string
    end_date: string
    cover_photo_url: string | null
    role: string
  }
}) {
  const countdown = daysUntil(trip.start_date)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/trips/${trip.id}`}>
        <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm active:scale-[0.98] transition-transform">
          {/* Cover photo or gradient placeholder */}
          <div className="h-32 relative">
            {trip.cover_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={trip.cover_photo_url}
                alt={trip.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/80 to-violet-500/80" />
            )}
            {countdown && (
              <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {countdown}
              </div>
            )}
            {trip.role === 'viewer' && (
              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                Viewer
              </div>
            )}
          </div>

          <div className="px-4 py-3 space-y-1">
            <h3 className="font-semibold text-foreground">{trip.name}</h3>
            <div className="flex items-center gap-3 text-muted-foreground text-xs">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {trip.destination_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDateRange(trip.start_date, trip.end_date)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
