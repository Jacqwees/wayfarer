'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Mail, Send, CheckCircle2, Loader2, Clock, X, RotateCcw } from 'lucide-react'
import { sendInvitation, cancelInvitation, resendInvitationEmail } from '@/app/actions/invitations'

type PendingInvitation = { id: string; invited_email: string; invited_role: string; created_at: string }

export default function InviteForm({ tripId, tripName, pendingInvitations: initial }: {
  tripId: string
  tripName: string
  pendingInvitations: PendingInvitation[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'viewer'>('member')
  const [error, setError] = useState('')
  const [sent, setSent] = useState<string[]>([])
  const [pending, setPending] = useState(initial)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [resendOk, setResendOk] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    startTransition(async () => {
      const res = await sendInvitation(tripId, email.trim(), role)
      if (res.error) { setError(res.error); return }
      setSent(s => [...s, email.trim()])
      setPending(p => [...p, {
        id: Math.random().toString(),
        invited_email: email.trim(),
        invited_role: role,
        created_at: new Date().toISOString(),
      }])
      setEmail('')
    })
  }

  function handleCancel(id: string) {
    setCancellingId(null)
    startTransition(async () => {
      await cancelInvitation(tripId, id)
      setPending(p => p.filter(x => x.id !== id))
    })
  }

  function handleResend(id: string) {
    setResendOk(null)
    startTransition(async () => {
      setResendingId(id)
      const res = await resendInvitationEmail(tripId, id)
      setResendingId(null)
      if (!res.error) setResendOk(id)
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="min-h-screen bg-background px-5 pt-14 pb-32 max-w-mobile mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground mb-6 -ml-1">
        <ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span>
      </button>

      <h1 className="text-2xl font-bold mb-1">Invite people</h1>
      <p className="text-muted-foreground text-sm mb-7">to <span className="font-medium text-foreground">{tripName}</span></p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="friend@example.com" required autoFocus
              className="w-full h-13 pl-10 pr-4 rounded-2xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Role</label>
          <div className="grid grid-cols-2 gap-2">
            {(['member', 'viewer'] as const).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`py-3 rounded-2xl border text-sm font-medium transition-colors ${role === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-input text-muted-foreground'}`}>
                <div className="font-semibold capitalize">{r}</div>
                <div className={`text-xs mt-0.5 ${role === r ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {r === 'member' ? 'Can participate fully' : 'Read-only access'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</motion.p>}

        <button type="submit" disabled={isPending || !email.trim()}
          className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isPending ? 'Sending…' : 'Send invite'}
        </button>
      </form>

      {/* Pending invitations */}
      <AnimatePresence>
        {pending.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pending invitations</p>
            {pending.map(inv => (
              <div key={inv.id} className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.invited_email}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground capitalize">{inv.invited_role} · Pending</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleResend(inv.id)}
                      disabled={isPending}
                      className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-xl bg-primary/10 text-primary transition-colors disabled:opacity-50"
                    >
                      {resendingId === inv.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : resendOk === inv.id
                          ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          : <RotateCcw className="w-3 h-3" />}
                      {resendOk === inv.id ? 'Sent' : 'Resend'}
                    </button>
                    <button
                      onClick={() => setCancellingId(inv.id)}
                      disabled={isPending}
                      className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-xl bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previously sent this session */}
      <AnimatePresence>
        {sent.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Just sent</p>
            {sent.map(e => (
              <div key={e} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-foreground">{e}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel confirmation sheet */}
      <AnimatePresence>
        {cancellingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setCancellingId(null)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-card w-full rounded-t-3xl p-6 max-w-mobile mx-auto"
              onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-2">Cancel invitation?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {pending.find(x => x.id === cancellingId)?.invited_email} will no longer be able to join with this invite.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setCancellingId(null)} className="flex-1 h-12 rounded-2xl border border-border text-sm font-medium">Keep</button>
                <button onClick={() => handleCancel(cancellingId)} disabled={isPending}
                  className="flex-1 h-12 rounded-2xl bg-destructive text-white text-sm font-semibold disabled:opacity-50">
                  Cancel invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
