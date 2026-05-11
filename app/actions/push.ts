'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function savePushSubscription(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  await db.from('push_subscriptions' as any).upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  }, { onConflict: 'user_id,endpoint' })

  return { success: true }
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  await db.from('push_subscriptions' as any).delete().eq('user_id', user.id).eq('endpoint', endpoint)
  return { success: true }
}

export async function sendPushToUser(userId: string, payload: {
  title: string
  body: string
  url?: string
  tag?: string
}) {
  const db = createServiceClient()
  const { data: subs } = await db.from('push_subscriptions' as any).select('endpoint, p256dh, auth').eq('user_id', userId) as { data: { endpoint: string; p256dh: string; auth: string }[] | null }
  if (!subs || subs.length === 0) return

  const message = JSON.stringify(payload)
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        message
      )
    } catch {
      // Subscription expired — remove it
      await db.from('push_subscriptions' as any).delete().eq('endpoint', sub.endpoint)
    }
  }
}
