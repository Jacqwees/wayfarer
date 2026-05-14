'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { savePushSubscription } from '@/app/actions/push'

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output.buffer as ArrayBuffer
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

const TOGGLES = [
  { key: 'push',     label: 'Push notifications',  sub: 'On your phone, immediately',      defaultOn: true },
  { key: 'email',    label: 'Email summaries',      sub: 'Weekly digest while planning',    defaultOn: true },
  { key: 'expenses', label: 'Expense alerts only',  sub: 'The financial stuff, nothing else', defaultOn: false },
]

function ToggleRow({ label, sub, on, onToggle }: { label: string; sub: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center py-3.5 border-b border-dashed border-border last:border-0 text-left gap-3"
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <div
        className="w-10 h-6 rounded-full relative flex-shrink-0 transition-colors"
        style={{ background: on ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
      >
        <div
          className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all"
          style={{ left: on ? 19 : 3 }}
        />
      </div>
    </button>
  )
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
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLES.map((t) => [t.key, t.defaultOn]))
  )

  function toggle(key: string) {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function enableAndContinue() {
    setSubscribing(true)
    try {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          if (vapidKey) {
            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidKey),
            })
            const p256dh = sub.getKey('p256dh')
            const auth = sub.getKey('auth')
            if (p256dh && auth) {
              await savePushSubscription({
                endpoint: sub.endpoint,
                keys: {
                  p256dh: arrayBufferToBase64(p256dh),
                  auth: arrayBufferToBase64(auth),
                },
              })
            }
          }
        }
      }
    } catch {
      // Silent — push failing shouldn't block onboarding
    } finally {
      setSubscribing(false)
      setSubscribed(true)
      onNext()
    }
  }

  return (
    <motion.div {...slide} transition={{ duration: 0.3, ease: 'easeOut' }} className="flex flex-col flex-1">
      <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground text-sm mb-6 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <p className="eyebrow mb-2">step 04 · 04</p>
      <h1 className="font-display italic text-[36px] leading-[0.95] tracking-[-0.01em] mb-1.5">
        One last thing.
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed mb-6">
        Get pinged when someone adds an expense, accepts an invite, or drops a new plan in the itinerary.
      </p>

      {/* Toggle rows */}
      <div className="bg-card border border-border rounded-2xl px-4 mb-5">
        {TOGGLES.map((t) => (
          <ToggleRow
            key={t.key}
            label={t.label}
            sub={t.sub}
            on={toggles[t.key]}
            onToggle={() => toggle(t.key)}
          />
        ))}
      </div>

      {/* Perforated divider */}
      <svg height="2" width="100%" className="mb-5" aria-hidden="true">
        <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
      </svg>

      {/* Tip card */}
      <div className="bg-secondary border border-dashed border-border rounded-xl px-4 py-3.5 mb-auto">
        <p className="eyebrow mb-1.5">Tip</p>
        <p className="text-sm text-foreground leading-relaxed">
          You can mute a trip from inside it. Quiet mode is per-trip, per-person.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <button
          onClick={enableAndContinue}
          disabled={saving || subscribing || subscribed}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {subscribing ? 'Setting up…' : "Let's go →"}
        </button>
        <button
          onClick={onNext}
          disabled={saving || subscribing}
          className="w-full text-center text-sm text-muted-foreground disabled:opacity-50"
        >
          Maybe later
        </button>
      </div>
    </motion.div>
  )
}
