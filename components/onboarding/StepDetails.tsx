'use client'

import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import type { OnboardingData } from './OnboardingFlow'

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

type Visibility = 'trip' | 'friend' | 'private'

function VisibilityPicker({
  value,
  onChange,
}: {
  value: Visibility
  onChange: (v: Visibility) => void
}) {
  const options: { value: Visibility; label: string }[] = [
    { value: 'trip', label: 'Trip members' },
    { value: 'private', label: 'Only me' },
  ]
  return (
    <div className="flex gap-2 mt-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors ${
            value === o.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-input text-muted-foreground bg-card'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function StepDetails({
  data,
  update,
  onBack,
  onNext,
}: {
  data: OnboardingData
  update: (p: Partial<OnboardingData>) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <motion.div {...slide} transition={{ duration: 0.3, ease: 'easeOut' }} className="flex flex-col flex-1">
      <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground text-sm mb-6 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-1">A bit more about you</h1>
      <p className="text-muted-foreground text-sm mb-8">
        All optional. Control who sees each field.
      </p>

      <div className="space-y-6 mb-auto">
        {/* Phone */}
        <div>
          <label className="text-sm font-medium">Phone number</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="+44 7700 000000"
            className="mt-1 w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
          />
          <VisibilityPicker
            value={data.phone_visibility}
            onChange={(v) => update({ phone_visibility: v })}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="text-sm font-medium">Bio</label>
          <textarea
            value={data.bio}
            onChange={(e) => update({ bio: e.target.value })}
            placeholder="Say something about yourself…"
            rows={2}
            className="mt-1 w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base resize-none"
          />
          <VisibilityPicker
            value={data.bio_visibility}
            onChange={(v) => update({ bio_visibility: v })}
          />
        </div>

        {/* Home city */}
        <div>
          <label className="text-sm font-medium">Home city</label>
          <input
            type="text"
            value={data.home_city}
            onChange={(e) => update({ home_city: e.target.value })}
            placeholder="e.g. London"
            className="mt-1 w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
          />
          <VisibilityPicker
            value={data.home_city_visibility}
            onChange={(v) => update({ home_city_visibility: v })}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onNext}
          className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition-transform"
        >
          Continue
        </button>
      </div>
      <button
        onClick={onNext}
        className="mt-3 text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
      >
        Skip for now
      </button>
    </motion.div>
  )
}
