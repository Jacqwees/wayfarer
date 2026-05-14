'use client'

import { motion } from 'framer-motion'
import { LogoMark } from '@/components/shared/Logo'

export default function StepReady({
  displayName,
  hasPendingInvites,
  onCreateTrip,
  onCheckInvites,
  onJoinTrip,
}: {
  displayName: string
  hasPendingInvites: boolean
  onCreateTrip: () => void
  onCheckInvites: () => void
  onJoinTrip?: () => void
}) {
  const firstName = displayName.split(' ')[0]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col flex-1 items-center justify-center text-center"
    >
      {/* Animated logo mark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
        className="mb-8"
      >
        <LogoMark size={72} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="space-y-2 mb-8"
      >
        <h1 className="font-display italic text-[34px] leading-tight tracking-[-0.01em]">
          Let&apos;s go, {firstName}.
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px] mx-auto">
          Your squad is waiting. Time to plan something worth packing for.
        </p>
      </motion.div>

      {/* Perforated divider */}
      <svg height="2" width="180" className="mb-8" aria-hidden="true">
        <line x1="0" y1="1" x2="180" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.35 }}
        className="w-full space-y-3"
      >
        {onJoinTrip && (
          <button
            onClick={onJoinTrip}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            Join your trip →
          </button>
        )}
        {hasPendingInvites && !onJoinTrip && (
          <button
            onClick={onCheckInvites}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            Check your invites →
          </button>
        )}
        {!onJoinTrip && (
          <button
            onClick={onCreateTrip}
            className={`w-full h-12 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform font-semibold text-sm rounded-full ${
              hasPendingInvites
                ? 'border border-border text-foreground'
                : 'bg-primary text-primary-foreground text-base'
            }`}
          >
            Plan a trip
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
