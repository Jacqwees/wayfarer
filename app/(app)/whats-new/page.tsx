'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, ChevronDown } from 'lucide-react'
import { CHANGELOG, CURRENT_VERSION, type ChangelogEntry } from '@/lib/changelog'

function markSeen() {
  try { localStorage.setItem('squadstay_changelog_seen', CURRENT_VERSION) } catch { /* */ }
}

function EntryCard({ entry, isLatest }: { entry: ChangelogEntry; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(isLatest)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl overflow-hidden border ${isLatest ? 'border-primary/30 bg-card' : 'border-border bg-card/60'}`}
    >
      {/* Entry header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-5 py-5 flex items-start gap-4"
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${isLatest ? 'bg-primary/10' : 'bg-secondary'}`}>
          {entry.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-0.5">
            {entry.label}{isLatest ? ' · Current' : ''}
          </p>
          <h2 className={`font-display italic leading-tight tracking-[-0.01em] ${isLatest ? 'text-[22px] text-foreground' : 'text-[18px] text-muted-foreground'}`}>
            {entry.headline}
          </h2>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Feature list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-0 border-t border-border">
              {entry.features.map((f, i) => (
                <div key={i} className={`flex gap-4 py-4 ${i < entry.features.length - 1 ? 'border-b border-dashed border-border' : ''}`}>
                  <span className="text-xl mt-0.5 shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">{f.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function WhatsNewPage() {
  const router = useRouter()
  const latest = CHANGELOG[0]

  // Mark as seen when this page mounts — they've seen it now
  useEffect(() => { markSeen() }, [])

  function handleContinue() {
    markSeen()
    router.push('/trips')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-mobile mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-5 pt-16 pb-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
          className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold font-mono uppercase tracking-[0.15em] mb-6"
        >
          <Sparkles className="w-3 h-3" />
          What&apos;s new
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-display italic text-[36px] leading-[1.1] tracking-[-0.02em] text-foreground mb-3"
        >
          {latest.headline}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          Here&apos;s everything that&apos;s new in SquadStay.
        </motion.p>
      </motion.div>

      {/* Changelog entries */}
      <div className="flex-1 px-4 space-y-3 pb-40">
        {CHANGELOG.map((entry, i) => (
          <motion.div
            key={entry.version}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
          >
            <EntryCard entry={entry} isLatest={i === 0} />
          </motion.div>
        ))}

        {/* Suggestions card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + CHANGELOG.length * 0.08 }}
          className="rounded-3xl border border-dashed border-border bg-card/40 px-5 py-6 text-center"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Your move</p>
          <h3 className="font-display italic text-[22px] leading-tight tracking-[-0.01em] text-foreground mb-2">
            What should we build next?
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Every request gets read. Tell us what&apos;s missing, broken, or would make this 10× better for your squad.
          </p>
          <a
            href="mailto:hello@squadstay.co.uk?subject=Feature request"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-foreground text-background text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            Send a request →
          </a>
        </motion.div>
      </div>

      {/* Sticky CTA */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent max-w-mobile mx-auto"
      >
        <button
          onClick={handleContinue}
          className="w-full h-14 rounded-full bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
        >
          Let&apos;s go
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  )
}
