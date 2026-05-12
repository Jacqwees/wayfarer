'use client'

import { motion } from 'framer-motion'
import { MapPin, Bell } from 'lucide-react'

export default function StepReady({
  displayName,
  hasPendingInvites,
  onCreateTrip,
  onCheckInvites,
}: {
  displayName: string
  hasPendingInvites: boolean
  onCreateTrip: () => void
  onCheckInvites: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col flex-1 items-center justify-center text-center space-y-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
        className="text-6xl"
      >
        🌍
      </motion.div>

      <div className="space-y-2">
        <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">
          You&apos;re all set, {displayName.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Time to start planning something amazing.
        </p>
      </div>

      <div className="w-full space-y-3 pt-4">
        {hasPendingInvites && (
          <button
            onClick={onCheckInvites}
            className="w-full h-12 rounded-xl bg-accent text-accent-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Bell className="w-4 h-4" />
            Check your trip invites
          </button>
        )}
        <button
          onClick={onCreateTrip}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <MapPin className="w-4 h-4" />
          Create your first trip
        </button>
      </div>
    </motion.div>
  )
}
