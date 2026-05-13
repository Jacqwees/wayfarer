'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import TripCard from './TripCard'
import MiniTripCard from './MiniTripCard'

type Trip = {
  id: string
  name: string
  destination_name: string
  start_date: string
  end_date: string
  cover_photo_url: string | null
  role: string
}

export default function TripListView({
  upcoming,
  past,
}: {
  upcoming: Trip[]
  past: Trip[]
}) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const hasTrips = upcoming.length > 0 || past.length > 0

  // ── Tab chip pill ──────────────────────────────────────────────
  function TabChip({ id, label, count }: { id: 'upcoming' | 'past'; label: string; count: number }) {
    const active = tab === id
    return (
      <button
        onClick={() => setTab(id)}
        className={`relative px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
          active
            ? 'bg-foreground text-background'
            : 'border border-border text-muted-foreground'
        }`}
      >
        {label}
        {count > 0 && (
          <span className={`ml-1.5 font-mono text-[10px] ${active ? 'opacity-60' : 'opacity-70'}`}>
            {count}
          </span>
        )}
      </button>
    )
  }

  // ── Empty state ────────────────────────────────────────────────
  if (!hasTrips) {
    return (
      <div className="px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-12 flex flex-col items-center text-center gap-5"
        >
          {/* Perforated circle */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="absolute inset-0" width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none"
                stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
            </svg>
            <span className="font-display italic text-primary text-3xl leading-none">✈</span>
          </div>

          <div>
            <h2 className="font-display italic text-[26px] leading-tight text-foreground">
              No trips yet.
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-[240px]">
              Create your first trip and invite your crew — it only takes a minute.
            </p>
          </div>

          {/* Perforated divider */}
          <svg height="2" width="200">
            <line x1="0" y1="1" x2="200" y2="1"
              stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
          </svg>

          <Link
            href="/trips/new"
            className="h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-md"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Plan a trip
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-5">
      {/* Tab chips */}
      <div className="flex gap-2 mb-5">
        <TabChip id="upcoming" label="Upcoming" count={upcoming.length} />
        <TabChip id="past" label="Past" count={past.length} />
      </div>

      <AnimatePresence mode="wait">
        {tab === 'upcoming' ? (
          <motion.div
            key="upcoming"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {upcoming.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground text-sm">
                No upcoming trips — time to plan one.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Featured hero card — first upcoming trip */}
                <TripCard trip={upcoming[0]} index={0} featured />

                {/* Perforated divider between featured + rest */}
                {upcoming.length > 1 && (
                  <div className="py-1">
                    <svg height="2" width="100%">
                      <line x1="0" y1="1" x2="100%" y2="1"
                        stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
                    </svg>
                  </div>
                )}

                {/* Mini cards for remaining trips */}
                {upcoming.slice(1).map((trip, i) => (
                  <MiniTripCard key={trip.id} trip={trip} index={i + 1} />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="past"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {past.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground text-sm">No past trips yet.</p>
            ) : (
              <div className="space-y-3 opacity-80">
                {past.map((trip, i) => (
                  <MiniTripCard key={trip.id} trip={trip} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
