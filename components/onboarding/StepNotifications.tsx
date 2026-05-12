'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, ChevronLeft } from 'lucide-react'

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

export default function StepNotifications({
  onBack,
  onNext,
  saving,
}: {
  onBack: () => void
  onNext: () => void
  saving: boolean
}) {
  const [requested, setRequested] = useState(false)

  async function enableNotifications() {
    if ('Notification' in window) {
      await Notification.requestPermission()
    }
    setRequested(true)
    onNext()
  }

  return (
    <motion.div {...slide} transition={{ duration: 0.3, ease: 'easeOut' }} className="flex flex-col flex-1">
      <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground text-sm mb-6 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 pb-8">
        <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center">
          <Bell className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">Stay in the loop</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
          Get notified when someone joins your trip, adds an expense, or sends you money.
          You can change this anytime in settings.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={enableNotifications}
          disabled={saving || requested}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {saving ? 'Saving…' : 'Enable notifications'}
        </button>
        <button
          onClick={onNext}
          disabled={saving}
          className="w-full text-center text-sm text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
        >
          Maybe later
        </button>
      </div>
    </motion.div>
  )
}
