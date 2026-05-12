'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Plane } from 'lucide-react'
import TripCard from './TripCard'

type Trip = {
  id: string
  name: string
  destination_name: string
  start_date: string
  end_date: string
  cover_photo_url: string | null
  role: string
}

export default function TripListView({ upcoming, past }: { upcoming: Trip[]; past: Trip[] }) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const hasTrips = upcoming.length > 0 || past.length > 0
  const shown = tab === 'upcoming' ? upcoming : past

  return (
    <div className="px-5">
      {/* Tab chips */}
      {hasTrips && (
        <div className="flex gap-2 mb-6">
          {(['upcoming', 'past'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-colors capitalize ${
                tab === t ? 'bg-foreground text-background' : 'border border-border text-muted-foreground'
              }`}
            >
              {t}
              {t === 'upcoming' && upcoming.length > 0 && (
                <span className={`ml-2 font-mono text-[10px] ${tab === t ? 'text-background/60' : 'text-muted-foreground'}`}>
                  {upcoming.length}
                </span>
              )}
              {t === 'past' && past.length > 0 && (
                <span className={`ml-2 font-mono text-[10px] ${tab === t ? 'text-background/60' : 'text-muted-foreground'}`}>
                  {past.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!hasTrips ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-16 flex flex-col items-center text-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Plane className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-1">No trips yet</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Create your first trip and invite your crew. It only takes a minute.
              </p>
            </div>
            <Link
              href="/trips/new"
              className="mt-2 px-6 h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" /> Plan a trip
            </Link>
          </motion.div>
        ) : shown.length === 0 ? (
          <motion.div
            key="empty-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 text-center"
          >
            <p className="text-muted-foreground text-sm">No {tab} trips</p>
          </motion.div>
        ) : (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`space-y-3 ${tab === 'past' ? 'opacity-80' : ''}`}
          >
            {shown.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
