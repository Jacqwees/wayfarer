'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Loader2, Bell, WifiOff, RefreshCw } from 'lucide-react'
import { addExpense, recordPayment, confirmPayment, disputeSplit, nudgePayer } from '@/app/actions/expenses'
import { createClient } from '@/lib/supabase/client'
import { useOfflineExpenses } from '@/hooks/useOfflineExpenses'

type Member = { user_id: string; display_name: string; avatar_url: string | null }
type Expense = {
  id: string; description: string; amount: number; currency: string; amount_gbp: number
  paid_by: string; category: string; split_type: string; created_at: string
  expense_splits: { id: string; user_id: string; amount_owed: number; status: string }[]
}
type Payment = { id: string; from_user_id: string; to_user_id: string; amount: number; note: string | null; status: string; created_at: string }

type Props = {
  tripId: string
  currentUserId: string
  members: Member[]
  expenses: Expense[]
  payments: Payment[]
}

const CURRENCIES = ['GBP', 'EUR', 'USD', 'JPY', 'AUD', 'CAD', 'CHF', 'NOK', 'SEK', 'DKK']
const CATEGORIES = ['Food & Drink', 'Transport', 'Accommodation', 'Activities', 'Shopping', 'Other']

type Transfer = { from: string; to: string; amount: number }

function minimiseTransfers(balances: Record<string, number>): Transfer[] {
  const creditors = Object.entries(balances).filter(([, v]) => v > 0.01).sort((a, b) => b[1] - a[1])
  const debtors = Object.entries(balances).filter(([, v]) => v < -0.01).sort((a, b) => a[1] - b[1])
  const transfers: Transfer[] = []
  let ci = 0, di = 0
  const cr = creditors.map(([id, amt]) => ({ id, amt }))
  const dr = debtors.map(([id, amt]) => ({ id, amt }))
  while (ci < cr.length && di < dr.length) {
    const pay = Math.min(cr[ci].amt, -dr[di].amt)
    transfers.push({ from: dr[di].id, to: cr[ci].id, amount: pay })
    cr[ci].amt -= pay
    dr[di].amt += pay
    if (Math.abs(cr[ci].amt) < 0.01) ci++
    if (Math.abs(dr[di].amt) < 0.01) di++
  }
  return transfers
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
}

export default function ExpensesView({ tripId, currentUserId, members, expenses, payments }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<'expenses' | 'settle'>('expenses')
  const { isOnline, pendingExpenses, syncing, queueExpense, syncPending } = useOfflineExpenses(tripId)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`rt-expenses-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${tripId}` }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `trip_id=eq.${tripId}` }, () => router.refresh())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tripId, router])

  const [showAdd, setShowAdd] = useState(false)
  const [nudgedIds, setNudgedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [payNote, setPayNote] = useState('')
  const [payTarget, setPayTarget] = useState<Transfer | null>(null)

  const [form, setForm] = useState({
    description: '', amount: '', currency: 'GBP', paid_by: currentUserId,
    category: 'Other', split_type: 'equal_all' as 'equal_all' | 'equal_select' | 'custom',
    split_with: members.map(m => m.user_id),
    custom_splits: members.map(m => ({ user_id: m.user_id, amount: '' })),
  })

  function memberName(uid: string) {
    return members.find(m => m.user_id === uid)?.display_name ?? uid
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return }
    setError('')
    const expenseData = {
      description: form.description, amount: amt, currency: form.currency,
      paid_by: form.paid_by, category: form.category, split_type: form.split_type,
      split_with: form.split_type === 'equal_select' ? form.split_with : undefined,
      custom_splits: form.split_type === 'custom'
        ? form.custom_splits.filter(s => parseFloat(s.amount) > 0).map(s => ({ user_id: s.user_id, amount: parseFloat(s.amount) }))
        : undefined,
    }
    if (!isOnline) {
      queueExpense(expenseData)
      setShowAdd(false)
      setForm(f => ({ ...f, description: '', amount: '', split_with: members.map(m => m.user_id) }))
      return
    }
    startTransition(async () => {
      const res = await addExpense(tripId, expenseData)
      if (res.error) { setError(res.error); return }
      setShowAdd(false)
      setForm(f => ({ ...f, description: '', amount: '', split_with: members.map(m => m.user_id) }))
    })
  }

  // Balances
  const balances: Record<string, number> = {}
  members.forEach(m => { balances[m.user_id] = 0 })
  for (const exp of expenses) {
    balances[exp.paid_by] = (balances[exp.paid_by] ?? 0) + exp.amount_gbp
    for (const split of exp.expense_splits) {
      if (split.user_id !== exp.paid_by) {
        balances[split.user_id] = (balances[split.user_id] ?? 0) - split.amount_owed
      }
    }
  }
  for (const p of payments.filter(p => p.status === 'confirmed')) {
    balances[p.from_user_id] = (balances[p.from_user_id] ?? 0) + p.amount
    balances[p.to_user_id] = (balances[p.to_user_id] ?? 0) - p.amount
  }
  const transfers = minimiseTransfers(balances)
  const pendingPayments = payments.filter(p => p.status === 'pending')
  const totalGbp = expenses.reduce((sum, e) => sum + e.amount_gbp, 0)
  const myBalance = balances[currentUserId] ?? 0
  const perHead = members.length > 0 ? totalGbp / members.length : 0

  function handleNudge(toId: string) {
    setNudgedIds(s => { const next = new Set(Array.from(s)); next.add(toId); return next })
    startTransition(async () => { await nudgePayer(tripId, toId) })
  }

  function handleConfirm(paymentId: string) {
    startTransition(async () => { await confirmPayment(tripId, paymentId) })
  }

  function handleRecordPayment() {
    if (!payTarget) return
    startTransition(async () => {
      await recordPayment(tripId, payTarget.to, payTarget.amount, payNote)
      setPayTarget(null)
      setPayNote('')
    })
  }

  // Best settle suggestion (first transfer)
  const topTransfer = transfers[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="min-h-screen bg-background pb-32"
    >
      {/* Hero balance card */}
      <div className="px-4 pt-14 pb-0">
        <div className="bg-card border border-border rounded-xl px-5 py-4 relative overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="eyebrow">Trip total</p>
            <button onClick={() => setShowAdd(true)}
              className="h-7 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 active:scale-[0.98] transition-transform">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <p className="font-display italic text-[44px] leading-none tracking-[-0.01em]">
              £{Math.floor(totalGbp).toLocaleString()}
            </p>
            <p className="font-display italic text-[20px] leading-none text-muted-foreground">
              .{String(Math.round((totalGbp % 1) * 100)).padStart(2, '0')}
            </p>
          </div>
          {members.length > 0 && (
            <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase mt-1.5">
              £{perHead.toFixed(0)} per head · avg
            </p>
          )}

          <svg height="2" width="100%" className="my-3.5" aria-hidden="true">
            <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
          </svg>

          <div className="flex justify-between">
            <div>
              <p className="eyebrow text-emerald-500 mb-1">You&apos;re owed</p>
              <p className={`font-mono text-[18px] font-semibold ${myBalance > 0.01 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {myBalance > 0.01 ? `+ £${myBalance.toFixed(2)}` : '£0.00'}
              </p>
            </div>
            <div className="text-right">
              <p className="eyebrow text-primary mb-1">You owe</p>
              <p className={`font-mono text-[18px] font-semibold ${myBalance < -0.01 ? 'text-primary' : 'text-muted-foreground'}`}>
                {myBalance < -0.01 ? `− £${Math.abs(myBalance).toFixed(2)}` : '£0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settle suggestion */}
      {topTransfer && (
        <div className="px-4 pt-3">
          <div className="bg-foreground text-background rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[9px] opacity-60 uppercase tracking-[0.15em] mb-1">Suggested settle</p>
              <p className="text-sm font-medium leading-snug">
                <strong>{topTransfer.from === currentUserId ? 'You' : memberName(topTransfer.from)}</strong>
                {' → '}
                <strong>{topTransfer.to === currentUserId ? 'you' : memberName(topTransfer.to)}</strong>
                {' '}£{topTransfer.amount.toFixed(2)}
              </p>
            </div>
            {topTransfer.from === currentUserId && (
              <button
                onClick={() => { setPayTarget(topTransfer); setPayNote('') }}
                className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0 active:scale-[0.98] transition-transform">
                Settle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-4 mt-3 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-amber-700 dark:text-amber-400">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">You&apos;re offline — expenses will sync when reconnected</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending offline */}
      {pendingExpenses.length > 0 && (
        <div className="px-4 mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="eyebrow text-amber-600">{pendingExpenses.length} pending sync</p>
            {isOnline && (
              <button onClick={syncPending} disabled={syncing}
                className="flex items-center gap-1 text-xs text-primary font-medium">
                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} /> Sync now
              </button>
            )}
          </div>
          {pendingExpenses.map(exp => (
            <div key={exp.id} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">{exp.description}</p>
                <p className="text-xs text-muted-foreground">{exp.currency} {exp.amount.toFixed(2)} · pending</p>
              </div>
              <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="px-4 pt-4">
        <div className="flex bg-card border border-border rounded-xl p-1 gap-1">
          {(['expenses', 'settle'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {t === 'expenses' ? 'Expenses' : 'Settle Up'}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses tab */}
      {tab === 'expenses' && (
        <div className="px-4 pt-4">
          {expenses.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl px-4 py-12 text-center">
              <p className="text-muted-foreground text-sm">No expenses yet</p>
              <button onClick={() => setShowAdd(true)} className="mt-3 text-sm text-primary font-medium">+ Add first expense</button>
            </div>
          ) : (
            <div>
              <p className="eyebrow mb-3">Recent · {expenses.length}</p>
              {expenses.map(exp => {
                const payer = members.find(m => m.user_id === exp.paid_by)
                const payerInitials = payer ? initials(payer.display_name) : '?'
                const mySplit = exp.expense_splits.find(s => s.user_id === currentUserId)
                return (
                  <div key={exp.id} className="flex items-center gap-3 py-3 border-t border-border first:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="font-display italic text-primary-foreground text-sm leading-none">{payerInitials[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{exp.description}</p>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5 tracking-[0.05em]">
                        {new Date(exp.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {exp.split_type === 'equal_all' ? `split ${members.length}` : 'custom split'}
                        {exp.currency !== 'GBP' ? ` · ${exp.currency}` : ''}
                      </p>
                      {mySplit && mySplit.amount_owed > 0 && mySplit.status !== 'paid' && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${mySplit.status === 'disputed' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            You owe £{mySplit.amount_owed.toFixed(2)}{mySplit.status === 'disputed' ? ' · disputed' : ''}
                          </span>
                          {mySplit.status === 'unpaid' && (
                            <button onClick={() => startTransition(() => disputeSplit(tripId, mySplit.id) as any)}
                              className="text-xs text-amber-500 font-medium">Dispute</button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-semibold">
                        {exp.currency !== 'GBP' ? `${exp.currency} ${exp.amount.toFixed(2)}` : `£${exp.amount.toFixed(2)}`}
                      </p>
                      {exp.paid_by === currentUserId && (
                        <p className="font-mono text-[9px] text-emerald-500 uppercase tracking-[0.1em] mt-0.5">● paid by you</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Settle tab */}
      {tab === 'settle' && (
        <div className="px-4 pt-4 space-y-5">
          {/* Pending confirmations */}
          {pendingPayments.filter(p => p.to_user_id === currentUserId).length > 0 && (
            <div>
              <p className="eyebrow mb-3">Awaiting your confirmation</p>
              <div className="space-y-2">
                {pendingPayments.filter(p => p.to_user_id === currentUserId).map(p => (
                  <div key={p.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{memberName(p.from_user_id)} sent £{p.amount.toFixed(2)}</p>
                      {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                    </div>
                    <button onClick={() => handleConfirm(p.id)} disabled={isPending}
                      className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full disabled:opacity-50">
                      Confirm
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transfers */}
          <div>
            <p className="eyebrow mb-3">Who owes who</p>
            {transfers.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">All settled up</p>
              </div>
            ) : (
              <div className="space-y-0">
                {transfers.map((t, i) => {
                  const isMe = t.from === currentUserId
                  const pendingForThis = pendingPayments.find(p => p.from_user_id === t.from && p.to_user_id === t.to)
                  return (
                    <div key={i} className="flex items-center py-3 border-b border-dashed border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {isMe ? 'You' : memberName(t.from)} → {t.to === currentUserId ? 'you' : memberName(t.to)}
                        </p>
                        <p className="font-mono text-[13px] text-primary font-semibold mt-0.5">£{t.amount.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        {isMe && !pendingForThis && (
                          <button onClick={() => { setPayTarget(t); setPayNote('') }}
                            className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                            Mark paid
                          </button>
                        )}
                        {!isMe && t.to === currentUserId && !nudgedIds.has(t.from) && (
                          <button onClick={() => handleNudge(t.from)}
                            className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full">
                            <Bell className="w-3 h-3" /> Nudge
                          </button>
                        )}
                        {pendingForThis && (
                          <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">Pending</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Per-person balances */}
          <div>
            <p className="eyebrow mb-3">Balances</p>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {members.map((m, i) => {
                const bal = balances[m.user_id] ?? 0
                return (
                  <div key={m.user_id} className={`flex items-center justify-between px-4 py-3 ${i < members.length - 1 ? 'border-b border-dashed border-border' : ''}`}>
                    <span className="text-sm font-medium">{m.user_id === currentUserId ? 'You' : m.display_name}</span>
                    <span className={`font-mono text-sm font-semibold ${bal > 0.01 ? 'text-emerald-600' : bal < -0.01 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {bal > 0.01 ? '+' : ''}{bal.toFixed(2)} GBP
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add expense sheet */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setShowAdd(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-background w-full rounded-t-[28px] max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <h2 className="font-display italic text-[24px] leading-tight">Add expense</h2>
                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <form onSubmit={handleAdd} className="px-5 py-4 space-y-4 pb-8">
                <div>
                  <label className="eyebrow mb-1.5 block">Description</label>
                  <input required autoFocus value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Dinner at La Boqueria"
                    className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>

                <div className="flex gap-3">
                  <div className="w-24">
                    <label className="eyebrow mb-1.5 block">Currency</label>
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                      className="w-full h-12 px-3 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm">
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="eyebrow mb-1.5 block">Amount</label>
                    <input required type="number" min="0.01" step="0.01" value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base font-semibold" />
                  </div>
                </div>

                <div>
                  <label className="eyebrow mb-1.5 block">Paid by</label>
                  <select value={form.paid_by} onChange={e => setForm(f => ({ ...f, paid_by: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm">
                    {members.map(m => <option key={m.user_id} value={m.user_id}>{m.user_id === currentUserId ? 'You' : m.display_name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="eyebrow mb-1.5 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${form.category === c ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="eyebrow mb-2 block">Split</label>
                  <div className="flex gap-2 mb-3">
                    {(['equal_all', 'equal_select', 'custom'] as const).map(st => (
                      <button key={st} type="button" onClick={() => setForm(f => ({ ...f, split_type: st }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${form.split_type === st ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
                        {st === 'equal_all' ? 'Everyone' : st === 'equal_select' ? 'Select' : 'Custom'}
                      </button>
                    ))}
                  </div>

                  {form.split_type === 'equal_select' && (
                    <div className="space-y-2">
                      {members.map(m => (
                        <label key={m.user_id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2.5">
                          <input type="checkbox" checked={form.split_with.includes(m.user_id)}
                            onChange={e => setForm(f => ({ ...f, split_with: e.target.checked ? [...f.split_with, m.user_id] : f.split_with.filter(id => id !== m.user_id) }))}
                            className="w-4 h-4 accent-primary" />
                          <span className="text-sm">{m.user_id === currentUserId ? 'You' : m.display_name}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {form.split_type === 'custom' && (
                    <div className="space-y-2">
                      {members.map((m, i) => (
                        <div key={m.user_id} className="flex items-center gap-3">
                          <span className="text-sm flex-1">{m.user_id === currentUserId ? 'You' : m.display_name}</span>
                          <div className="relative w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
                            <input type="number" min="0" step="0.01" value={form.custom_splits[i]?.amount ?? ''}
                              onChange={e => setForm(f => ({ ...f, custom_splits: f.custom_splits.map((s, j) => j === i ? { ...s, amount: e.target.value } : s) }))}
                              className="w-full h-10 pl-7 pr-3 rounded-xl border border-input bg-card text-sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>}

                <button type="submit" disabled={isPending}
                  className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add expense
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Record payment sheet */}
      <AnimatePresence>
        {payTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setPayTarget(null)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="bg-card w-full rounded-t-[28px] p-6"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <h2 className="font-display italic text-[22px] mb-1">Mark as paid</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Send £{payTarget.amount.toFixed(2)} to {memberName(payTarget.to)} — they&apos;ll confirm receipt.
              </p>
              <div className="mb-4">
                <label className="eyebrow mb-1.5 block">Note (optional)</label>
                <input value={payNote} onChange={e => setPayNote(e.target.value)}
                  placeholder="Bank transfer, Monzo, etc."
                  className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPayTarget(null)} className="flex-1 h-12 rounded-full border border-border text-sm font-medium">Cancel</button>
                <button onClick={handleRecordPayment} disabled={isPending}
                  className="flex-1 h-12 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform">
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
