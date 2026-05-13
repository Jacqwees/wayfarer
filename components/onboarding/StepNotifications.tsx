'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, ChevronLeft } from 'lucide-react'
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
  const [subscribing, setSubscribing] = useState(false)

  async function enableNotifications() {
    setSubscribing(true)
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        // Browser doesn't support push — skip silently
        onNext()
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        // User denied — move on without subscribing
        setRequested(true)
        onNext()
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        // VAPID not configured yet — skip
        setRequested(true)
        onNext()
        return
      }

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
    } catch {
      // Silent — push failing shouldn't block onboarding
    } finally {
      setSubscribing(false)
      setRequested(true)
      onNext()
    }
  }

  return (
    <motion.div {...slide} transition={{ duration: 0.3, ease: 'easeOut' }} className="flex flex-col flex-1">
      <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground text-sm mb-6 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 pb-8">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
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
          disabled={saving || subscribing || requested}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {subscribing ? 'Setting up…' : 'Enable notifications'}
        </button>
        <button
          onClick={onNext}
          disabled={saving || subscribing}
          className="w-full text-center text-sm text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
        >
          Maybe later
        </button>
      </div>
    </motion.div>
  )
}
