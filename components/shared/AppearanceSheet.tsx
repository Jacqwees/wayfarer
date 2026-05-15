'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, SunMoon, Check } from 'lucide-react'
import { useTheme, type AppTheme } from '@/components/shared/ThemeProvider'

const OPTIONS: { value: AppTheme; label: string; sub: string; Icon: React.ElementType }[] = [
  { value: 'auto',  label: 'Auto',  sub: 'Follows your device setting',   Icon: SunMoon },
  { value: 'light', label: 'Light', sub: 'Always light',                   Icon: Sun     },
  { value: 'dark',  label: 'Dark',  sub: 'Always dark — easy on the eyes', Icon: Moon    },
]

type Props = {
  open: boolean
  onClose: () => void
}

export default function AppearanceSheet({ open, onClose }: Props) {
  const { theme, setTheme } = useTheme()

  function pick(t: AppTheme) {
    setTheme(t)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[70] flex items-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="bg-card w-full rounded-t-3xl p-6 max-w-mobile mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-4">Appearance</p>

            <div className="space-y-2">
              {OPTIONS.map(({ value, label, sub, Icon }) => {
                const active = theme === value
                return (
                  <button
                    key={value}
                    onClick={() => pick(value)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-colors ${
                      active
                        ? 'border-primary bg-primary/8'
                        : 'border-border bg-background hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-primary/15' : 'bg-secondary'}`}>
                      <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                    {active && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
