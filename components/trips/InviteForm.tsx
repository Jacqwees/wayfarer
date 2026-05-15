'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, X, RotateCcw, Copy, Check, Trash2 } from 'lucide-react'
import { sendInvitation, cancelInvitation, resendInvitationEmail, generateInviteLink, revokeInviteLink } from '@/app/actions/invitations'

type PendingInvitation = { id: string; invited_email: string; invited_role: string; created_at: string }

export default function InviteForm({ tripId, tripName, pendingInvitations: initial, existingInviteLink: initialLink }: {
  tripId: string
  tripName: string
  pendingInvitations: PendingInvitation[]
  existingInviteLink: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'viewer'>('member')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState<string[]>([])
  const [pending, setPending] = useState(initial)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [resendOk, setResendOk] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(initialLink)
  const [linkCopied, setLinkCopied] = useState(false)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  async function handleGenerateLink() {
    setGeneratingLink(true)
    setLinkError(null)
    const res = await generateInviteLink(tripId)
    setGeneratingLink(false)
    if (res.url) {
      setInviteLink(res.url)
    } else {
      setLinkError(res.error ?? 'Could not generate link')
    }
  }

  async function handleCopyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  async function handleRevokeLink() {
    startTransition(async () => {
      await revokeInviteLink(tripId)
      setInviteLink(null)
    })
  }

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
      setNote('')
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
      className="min-h-screen bg-background pb-32">

      {/* Header */}
      <div className="px-5 pt-14 pb-3">
        <p className="eyebrow mb-1">add to {tripName}</p>
        <h1 className="font-display italic text-[36px] leading-[0.95] tracking-[-0.01em]">
          Who else<br />is in?
        </h1>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          We&apos;ll email them a link. They can join with one tap — no account needed up front.
        </p>
      </div>

      <div className="px-5 pt-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="eyebrow mb-1.5 block">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="friend@example.com" required autoFocus
              className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>

          {/* Role */}
          <div>
            <label className="eyebrow mb-1.5 block">Role</label>
            <div className="flex gap-2">
              {([
                { value: 'member', label: 'Editor', sub: 'add plans + spend' },
                { value: 'viewer', label: 'Viewer', sub: 'read-only · no spending' },
              ] as const).map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`flex-1 px-4 py-3 rounded-xl text-left transition-colors ${
                    role === r.value
                      ? 'bg-foreground text-background'
                      : 'bg-card border border-border text-foreground'
                  }`}>
                  <p className="font-semibold text-sm">{r.label}</p>
                  <p className={`text-xs mt-0.5 ${role === r.value ? 'opacity-70' : 'text-muted-foreground'}`}>{r.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="eyebrow mb-1.5 block">Send with a note · optional</label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              placeholder={`"${tripName.split(' ')[0]} — you have to come on this one!"`}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-dashed border-border bg-card text-foreground font-display italic focus:outline-none focus:ring-2 focus:ring-ring text-[15px] leading-relaxed resize-none placeholder:text-muted-foreground placeholder:not-italic"
            />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}
            </motion.p>
          )}

          <button type="submit" disabled={isPending || !email.trim()}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending ? 'Sending…' : 'Send invite →'}
          </button>
        </form>

        {/* Perforation */}
        <svg height="2" width="100%" className="my-6" aria-hidden="true">
          <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
        </svg>

        {/* Invite link */}
        <p className="eyebrow mb-3">Or share a link</p>
        {inviteLink ? (
          <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-foreground truncate">{inviteLink.replace(/^https?:\/\//, '')}</p>
              <p className="font-mono text-[9px] text-muted-foreground mt-0.5 uppercase tracking-[0.08em]">expires in 7 days</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button type="button" onClick={handleCopyLink}
                className="h-9 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 active:scale-[0.98] transition-transform">
                {linkCopied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
              <button type="button" onClick={handleRevokeLink} disabled={isPending}
                className="h-9 w-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center active:scale-[0.98] transition-transform disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button type="button" onClick={handleGenerateLink} disabled={generatingLink}
              className="w-full h-12 rounded-xl border border-dashed border-border text-sm text-muted-foreground font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50">
              {generatingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {generatingLink ? 'Generating…' : 'Generate invite link'}
            </button>
            {linkError && (
              <div className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-4 py-3 text-xs text-destructive leading-relaxed">
                <p className="font-semibold mb-1">Table not set up yet</p>
                <p className="text-muted-foreground mb-2">Run this SQL in your Supabase dashboard → SQL Editor:</p>
                <pre className="font-mono text-[10px] bg-background rounded-lg p-2 overflow-x-auto text-foreground whitespace-pre-wrap">{`create table trip_invite_links (\n  id uuid primary key default gen_random_uuid(),\n  trip_id uuid references trips(id) on delete cascade not null,\n  created_by uuid references users(id) on delete cascade not null,\n  role text not null default 'member',\n  created_at timestamptz default now() not null\n);`}</pre>
              </div>
            )}
          </div>
        )}

        {/* Pending invitations */}
        <AnimatePresence>
          {pending.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
              <p className="eyebrow mb-3">Pending invitations</p>
              <div className="space-y-0">
                {pending.map(inv => (
                  <div key={inv.id}
                    className="flex items-center gap-3 py-3 border-b border-dashed border-border last:border-0">
                    <div className="w-9 h-9 rounded-full border border-dashed border-border flex items-center justify-center shrink-0">
                      <span className="font-display italic text-muted-foreground text-sm">{inv.invited_email[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inv.invited_email}</p>
                      <p className="font-mono text-[10px] text-muted-foreground tracking-[0.05em] mt-0.5 uppercase">{inv.invited_role} · pending</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleResend(inv.id)} disabled={isPending}
                        className="h-7 px-2.5 rounded-full text-xs font-medium bg-card border border-border text-foreground flex items-center gap-1 disabled:opacity-50">
                        {resendingId === inv.id ? <Loader2 className="w-3 h-3 animate-spin" />
                          : resendOk === inv.id ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          : <RotateCcw className="w-3 h-3" />}
                        {resendOk === inv.id ? 'Sent' : 'Resend'}
                      </button>
                      <button onClick={() => setCancellingId(inv.id)} disabled={isPending}
                        className="h-7 w-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center disabled:opacity-50">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Just sent */}
        <AnimatePresence>
          {sent.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <p className="eyebrow mb-3">Just sent</p>
              {sent.map(e => (
                <div key={e} className="flex items-center gap-3 py-3 border-b border-dashed border-border last:border-0">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-sm text-foreground">{e}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cancel confirmation */}
      <AnimatePresence>
        {cancellingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setCancellingId(null)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="bg-card w-full rounded-t-[28px] p-6"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <h2 className="font-display italic text-[22px] mb-2">Cancel invitation?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {pending.find(x => x.id === cancellingId)?.invited_email} will no longer be able to join with this invite.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setCancellingId(null)} className="flex-1 h-12 rounded-full border border-border text-sm font-medium">Keep</button>
                <button onClick={() => handleCancel(cancellingId!)} disabled={isPending}
                  className="flex-1 h-12 rounded-full bg-destructive text-white text-sm font-semibold disabled:opacity-50">Cancel invite</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
