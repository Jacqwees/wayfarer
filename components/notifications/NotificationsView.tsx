'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, Users, Receipt, UserPlus, Crown, AlertCircle, Plane, MapPin, Calendar } from 'lucide-react'
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
  trip_invitation:    { icon: UserPlus,     color: 'text-primary' },
  invitation_sent:    { icon: UserPlus,     color: 'text-muted-foreground' },
  member_joined:      { icon: Users,        color: 'text-emerald-500' },
  expense_added:      { icon: Receipt,      color: 'text-amber-500' },
  payment_pending:    { icon: Receipt,      color: 'text-blue-500' },
  payment_confirmed:  { icon: CheckCheck,   color: 'text-emerald-500' },
  ownership_transfer: { icon: Crown,        color: 'text-amber-500' },
  nudge:              { icon: Bell,         color: 'text-orange-500' },
  dispute:            { icon: AlertCircle,  color: 'text-destructive' },
  flight_update:      { icon: Plane,        color: 'text-sky-500' },
  place_saved:        { icon: MapPin,       color: 'text-primary' },
  itinerary_update:   { icon: Calendar,     color: 'text-primary' },
}

function timeAgo(dt: string) {
  const diff = (Date.now() - new Date(dt).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function groupByDay(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)

  const buckets: Record<string, Notification[]> = {}
  for (const n of notifications) {
    const d = new Date(n.created_at)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const label =
      day.getTime() === today.getTime()
        ? 'Today'
        : day.getTime() === yesterday.getTime()
          ? 'Yesterday'
          : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    if (!buckets[label]) buckets[label] = []
    buckets[label].push(n)
  }

  return Object.entries(buckets).map(([label, items]) => ({ label, items }))
}

export default function NotificationsView({ notifications: initial, userId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notifications, setNotifications] = useState(initial)
  const [respondingId, setRespondingId] = useState<string | null>(null)

  const unread = notifications.filter(n => !n.read).length
  const groups = groupByDay(notifications)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`rt-my-notifications-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev])
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
        invitation_sent: 'invite', flight_update: 'flights', place_saved: 'places',
        itinerary_update: 'itinerary',
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
      className="min-h-screen bg-background pb-32"
    >
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-center justify-between">
        <div>
          {unread > 0 && <p className="eyebrow mb-0.5">{unread} unread</p>}
          <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">Inbox</h1>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={isPending}
              className="h-8 px-3.5 rounded-full border border-border text-xs font-medium text-foreground active:scale-[0.97] transition-transform"
            >
              Mark all
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 px-5">
          <div className="w-16 h-16 rounded-full border border-dashed border-border flex items-center justify-center">
            <Bell className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-display italic text-xl text-foreground">All quiet here.</p>
            <p className="text-sm text-muted-foreground mt-1">Notifications will show up when your squad makes moves.</p>
          </div>
        </div>
      ) : (
        <div className="px-4">
          {groups.map(({ label, items }) => (
            <div key={label}>
              {/* Day header */}
              <div className="flex items-center gap-3 py-3 px-1">
                <p className="eyebrow whitespace-nowrap">{label}</p>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Notifications */}
              <div className="space-y-0">
                {items.map((n, i) => {
                  const cfg = typeConfig[n.type] ?? { icon: Bell, color: 'text-muted-foreground' }
                  const Icon = cfg.icon
                  return (
                    <motion.button
                      key={n.id}
                      layout
                      onClick={() => handleTap(n)}
                      className={`w-full flex items-start gap-3 px-1 py-3 text-left transition-colors border-b border-dashed border-border last:border-0 ${!n.read ? '' : 'opacity-80'}`}
                    >
                      {/* Icon avatar */}
                      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${n.read ? 'bg-secondary' : 'bg-primary/10'} border ${n.read ? 'border-border' : 'border-primary/20'}`}>
                        <Icon className={`w-4 h-4 ${n.read ? 'text-muted-foreground' : cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13.5px] leading-snug ${n.read ? 'text-foreground' : 'font-medium text-foreground'}`}>
                          {n.message}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground mt-1 tracking-wide">{timeAgo(n.created_at)}</p>
                      </div>

                      {/* Unread dot */}
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invitation response bottom sheet */}
      <AnimatePresence>
        {respondingId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setRespondingId(null)}
          >
            <motion.div
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="bg-card w-full rounded-t-[28px] p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />

              {/* Perforation */}
              <h2 className="font-display italic text-[26px] leading-tight tracking-[-0.01em] mb-1">
                You&apos;ve been invited.
              </h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Would you like to join this trip?
              </p>

              <svg height="2" width="100%" className="mb-5" aria-hidden="true">
                <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
              </svg>

              <div className="flex gap-3">
                <button
                  onClick={() => handleRespond(false)}
                  disabled={isPending}
                  className="flex-1 h-12 rounded-full border border-border text-sm font-medium disabled:opacity-50 text-foreground active:scale-[0.98] transition-transform"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleRespond(true)}
                  disabled={isPending}
                  className="flex-1 h-12 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  Accept →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
