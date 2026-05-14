'use client'

import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import type { OnboardingData } from './OnboardingFlow'

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

const TRAVEL_TAGS = [
  { label: 'Beach',     icon: '◐' },
  { label: 'Cities',    icon: '◼' },
  { label: 'Mountains', icon: '▲' },
  { label: 'Food',      icon: '◉' },
  { label: 'Festivals', icon: '✦' },
  { label: 'Adventure', icon: '◢' },
  { label: 'Wellness',  icon: '○' },
  { label: 'Nightlife', icon: '☾' },
  { label: 'Culture',   icon: '✚' },
  { label: 'Budget',    icon: '£' },
  { label: 'Lux',       icon: '◆' },
  { label: 'Road trip', icon: '⌖' },
]

const BUDGETS = [
  { label: 'Backpack', symbol: '£' },
  { label: 'Comfort',  symbol: '££' },
  { label: 'Plush',    symbol: '£££' },
]

type Visibility = 'trip' | 'friend' | 'private'

function VisibilityPicker({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  const options: { value: Visibility; label: string }[] = [
    { value: 'trip', label: 'Trip members' },
    { value: 'private', label: 'Only me' },
  ]
  return (
    <div className="flex gap-2 mt-1.5">
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
  function toggleTag(label: string) {
    const current = data.travel_tags ?? []
    const next = current.includes(label)
      ? current.filter((t) => t !== label)
      : [...current, label]
    update({ travel_tags: next })
  }

  return (
    <motion.div {...slide} transition={{ duration: 0.3, ease: 'easeOut' }} className="flex flex-col flex-1">
      <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground text-sm mb-6 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <p className="eyebrow mb-2">step 02 · 04</p>
      <h1 className="font-display italic text-[36px] leading-[0.95] tracking-[-0.01em] mb-1.5">
        What&apos;s your speed?
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed mb-6">
        Pick a few — we&apos;ll tune the feed.
      </p>

      {/* Travel style tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TRAVEL_TAGS.map(({ label, icon }) => {
          const active = (data.travel_tags ?? []).includes(label)
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggleTag(label)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium border transition-colors active:scale-[0.97] ${
                active
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card border-border text-foreground'
              }`}
            >
              <span className="text-[12px] opacity-70">{icon}</span>
              {label}
            </button>
          )
        })}
      </div>

      {/* Perforated divider */}
      <svg height="2" width="100%" className="mb-5" aria-hidden="true">
        <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
      </svg>

      {/* Budget tier */}
      <div className="mb-6">
        <p className="eyebrow mb-3">Budget tier · default for new trips</p>
        <div
          className="flex gap-0 bg-card rounded-xl border border-border p-1"
        >
          {BUDGETS.map(({ label, symbol }) => {
            const active = (data.budget_tier ?? 'Comfort') === label
            return (
              <button
                key={label}
                type="button"
                onClick={() => update({ budget_tier: label as OnboardingData['budget_tier'] })}
                className={`flex-1 py-2.5 text-center rounded-lg transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground'
                }`}
              >
                <div className="font-mono text-[13px] font-semibold leading-none mb-0.5">{symbol}</div>
                <div className="text-[11px] opacity-80">{label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Perforated divider */}
      <svg height="2" width="100%" className="mb-5" aria-hidden="true">
        <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
      </svg>

      <div className="space-y-4 mb-auto">
        {/* Bio */}
        <div>
          <label className="text-sm font-medium">About you <span className="text-muted-foreground font-normal">(optional)</span></label>
          <textarea
            value={data.bio}
            onChange={(e) => update({ bio: e.target.value })}
            placeholder="e.g. Beach and tapas over sightseeing every time…"
            rows={2}
            className="mt-1 w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base resize-none font-display italic"
          />
          <VisibilityPicker value={data.bio_visibility} onChange={(v) => update({ bio_visibility: v })} />
        </div>

        {/* Home city */}
        <div>
          <label className="text-sm font-medium">Home base <span className="text-muted-foreground font-normal">(optional)</span></label>
          <input
            type="text"
            value={data.home_city}
            onChange={(e) => update({ home_city: e.target.value })}
            placeholder="e.g. London"
            className="mt-1 w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
          />
          <VisibilityPicker value={data.home_city_visibility} onChange={(v) => update({ home_city_visibility: v })} />
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <button
          onClick={onNext}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition-transform"
        >
          Continue
        </button>
        <button
          onClick={onNext}
          className="w-full text-center text-sm text-muted-foreground"
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  )
}
