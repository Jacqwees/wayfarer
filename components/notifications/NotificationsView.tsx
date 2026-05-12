'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, Users, Receipt, UserPlus, Crown, AlertCircle } from 'lucide-react'
import { markNotificationRead, markAllRead } from '@/app/actions/notifications'
import { respondToInvitation } from '@/app/actions/invitations'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  type: string
  trip_id: string | null
  reference_id: string | null
  message: string
  read: boolean
  created_at: string
}

type Props = { notifications: Notification[]; userId: string }

const typeConfig: Record<string, { icon: any; color: string }> = {
  trip_invitation: { icon: UserPlus, color: 'text-primary' },
  member_joined: { icon: Users, color: 'text-emerald-500' },
  expense_added: { icon: Receipt, color: 'text-amber-500' },
  payment_pending: { icon: Receipt, color: 'text-blue-500' },
  payment_confirmed: { icon: CheckCheck, color: 'text-emerald-500' },
  ownership_transfer: { icon: Crown, color: 'text-amber-500' },
  nudge: { icon: Bell, color: 'text-orange-500' },
  dispute: { icon: AlertCircle, color: 'text-destructive' },
}

function timeAgo(dt: string) {
  const diff = (Date.now() - new Date(dt).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationsView({ notifications: initial, userId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notifications, setNotifications] = useState(initial)
  const [respondingId, setRespondingId] = useState<string | null>(null)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`rt-my-notifications-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
        const n = payload.new as Notification
        setNotifications(prev => [n, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  function markRead(id: string) {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
    startTransition(() => markNotificationRead(id) as any)
  }

  function handleMarkAll() {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
    startTransition(() => markAllRead() as any)
  }

  function handleTap(n: Notification) {
    if (!n.read) markRead(n.id)
    if (n.type === 'trip_invitation' && n.reference_id) {
      setRespondingId(n.reference_id)
      return
    }
    if (n.trip_id) {
      const destinations: Record<string, string> = {
        expense_added: 'expenses', payment_pending: 'expenses', payment_confirmed: 'expenses',
        nudge: 'expenses', member_joined: 'members', ownership_transfer: 'members',
      }
      const sub = destinations[n.type]
      router.push(sub ? `/trips/${n.trip_id}/${sub}` : `/trips/${n.trip_id}`)
    }
  }

  function handleRespond(accept: boolean) {
    if (!respondingId) return
    startTransition(async () => {
      const res = await respondToInvitation(respondingId, accept)
      setRespondingId(null)
      if (accept && res.tripId) router.push(`/trips/${res.tripId}`)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="min-h-screen bg-background px-5 pt-14 pb-32 max-w-mobile mx-auto"
    >
      <div className="flex items-center justify-between mb-7">
        <div>
          {unread > 0 && <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-0.5">{unread} unread</p>}
          <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">Notifications</h1>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAll} disabled={isPending}
            className="text-xs text-primary font-semibold flex items-center gap-1.5">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Bell className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg = typeConfig[n.type] ?? { icon: Bell, color: 'text-muted-foreground' }
            const Icon = cfg.icon
            return (
              <motion.button
                key={n.id}
                layout
                onClick={() => handleTap(n)}
                className={`w-full flex items-start gap-3 bg-card border rounded-lg px-4 py-4 text-left transition-colors ${n.read ? 'border-border' : 'border-primary/30 bg-primary/5'}`}
              >
                <div className={`w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${n.read ? 'text-foreground' : 'font-medium text-foreground'}`}>
                    {n.message}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Invitation response sheet */}
      <AnimatePresence>
        {respondingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setRespondingId(null)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-card w-full rounded-t-3xl p-6 max-w-mobile mx-auto"
              onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-2">Trip invitation</h2>
              <p className="text-sm text-muted-foreground mb-6">Would you like to accept or decline this invitation?</p>
              <div className="flex gap-3">
                <button onClick={() => handleRespond(false)} disabled={isPending}
                  className="flex-1 h-12 rounded-2xl border border-border text-sm font-medium disabled:opacity-50">Decline</button>
                <button onClick={() => handleRespond(true)} disabled={isPending}
                  className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">Accept</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
