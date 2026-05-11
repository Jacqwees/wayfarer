'use client'

import { useEffect } from 'react'
import { savePushSubscription } from '@/app/actions/push'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buf = new ArrayBuffer(rawData.length)
  const output = new Uint8Array(buf)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return buf
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export default function PushSubscriber() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission !== 'granted') return

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) return

    navigator.serviceWorker.ready.then(async (reg) => {
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })
      }

      const p256dhKey = sub.getKey('p256dh')
      const authKey = sub.getKey('auth')
      if (!p256dhKey || !authKey) return

      await savePushSubscription({
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(p256dhKey),
          auth: arrayBufferToBase64(authKey),
        },
      })
    }).catch(() => {})
  }, [])

  return null
}
