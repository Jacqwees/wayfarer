'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Mail, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { sendInvitation } from '@/app/actions/invitations'

export default function InviteForm({ tripId, tripName }: { tripId: string; tripName: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'viewer'>('member')
  const [error, setError] = useState('')
  const [sent, setSent] = useState<string[]>([])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    startTransition(async () => {
      const res = await sendInvitation(tripId, email.trim(), role)
      if (res.error) { setError(res.error); return }
      setSent(s => [...s, email.trim()])
      setEmail('')
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

      <AnimatePresence>
        {sent.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Invitations sent</p>
            {sent.map(e => (
              <div key={e} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-foreground">{e}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
