'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Plus, X, Loader2, Receipt, ArrowRightLeft, AlertCircle, Bell } from 'lucide-react'
import { addExpense, recordPayment, confirmPayment, disputeSplit, nudgePayer } from '@/app/actions/expenses'
import { createClient } from '@/lib/supabase/client'
import { useOfflineExpenses } from '@/hooks/useOfflineExpenses'
import { WifiOff, RefreshCw } from 'lucide-react'

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
      description: form.description,
      amount: amt,
      currency: form.currency,
      paid_by: form.paid_by,
      category: form.category,
      split_type: form.split_type,
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

  // Calculate balances for settle-up
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
  // Factor in confirmed payments
  for (const p of payments.filter(p => p.status === 'confirmed')) {
    balances[p.from_user_id] = (balances[p.from_user_id] ?? 0) + p.amount
    balances[p.to_user_id] = (balances[p.to_user_id] ?? 0) - p.amount
  }
  const transfers = minimiseTransfers(balances)
  const pendingPayments = payments.filter(p => p.status === 'pending')

  const totalGbp = expenses.reduce((sum, e) => sum + e.amount_gbp, 0)

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="min-h-screen bg-background px-5 pt-14 pb-32 max-w-mobile mx-auto"
    >
      <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground mb-6 -ml-1">
        <ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span>
      </button>

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-primary text-sm font-medium">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <p className="text-muted-foreground text-sm mb-4">Total: <span className="font-semibold text-foreground">£{totalGbp.toFixed(2)}</span></p>

      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 mb-4 text-amber-700 dark:text-amber-400">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">You&apos;re offline — expenses will sync when reconnected</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending offline expenses */}
      {pendingExpenses.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              {pendingExpenses.length} pending sync
            </p>
            {isOnline && (
              <button onClick={syncPending} disabled={syncing}
                className="flex items-center gap-1 text-xs text-primary font-medium">
                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} /> Sync now
              </button>
            )}
          </div>
          <div className="space-y-2">
            {pendingExpenses.map(exp => (
              <div key={exp.id} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{exp.description}</p>
                  <p className="text-xs text-muted-foreground">{exp.currency} {exp.amount.toFixed(2)} · pending</p>
                </div>
                <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex bg-card border border-border rounded-2xl p-1 gap-1 mb-6">
        {(['expenses', 'settle'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            {t === 'expenses' ? 'Expenses' : 'Settle Up'}
          </button>
        ))}
      </div>

      {tab === 'expenses' && (
        expenses.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl px-4 py-12 text-center">
            <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No expenses yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(exp => {
              const mySplit = exp.expense_splits.find(s => s.user_id === currentUserId)
              return (
                <div key={exp.id} className="bg-card border border-border rounded-2xl px-4 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{exp.description}</p>
                      <p className="text-xs text-muted-foreground">{exp.category} · paid by {memberName(exp.paid_by)}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold text-sm">{exp.currency !== 'GBP' ? `${exp.currency} ${exp.amount.toFixed(2)}` : `£${exp.amount.toFixed(2)}`}</p>
                      {exp.currency !== 'GBP' && <p className="text-xs text-muted-foreground">≈ £{exp.amount_gbp.toFixed(2)}</p>}
                    </div>
                  </div>
                  {mySplit && mySplit.amount_owed > 0 && (
                    <div className={`flex items-center justify-between mt-2 pt-2 border-t border-border text-xs`}>
                      <span className={mySplit.status === 'disputed' ? 'text-amber-500' : 'text-muted-foreground'}>
                        You owe £{mySplit.amount_owed.toFixed(2)} {mySplit.status === 'disputed' ? '· disputed' : ''}
                      </span>
                      {mySplit.status === 'unpaid' && (
                        <button onClick={() => startTransition(() => disputeSplit(tripId, mySplit.id) as any)}
                          className="text-xs text-amber-500 font-medium">
                          Dispute
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {tab === 'settle' && (
        <div className="space-y-6">
          {/* Pending payment confirmations */}
          {pendingPayments.filter(p => p.to_user_id === currentUserId).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Awaiting your confirmation</p>
              <div className="space-y-2">
                {pendingPayments.filter(p => p.to_user_id === currentUserId).map(p => (
                  <div key={p.id} className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{memberName(p.from_user_id)} sent £{p.amount.toFixed(2)}</p>
                      {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                    </div>
                    <button onClick={() => handleConfirm(p.id)} disabled={isPending}
                      className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl disabled:opacity-50">
                      Confirm
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transfer list */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Who owes who</p>
            {transfers.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl px-4 py-6 text-center text-sm text-muted-foreground">
                All settled up! 🎉
              </div>
            ) : (
              <div className="space-y-2">
                {transfers.map((t, i) => {
                  const isMe = t.from === currentUserId
                  const pendingForThis = pendingPayments.find(p => p.from_user_id === t.from && p.to_user_id === t.to)
                  return (
                    <div key={i} className="bg-card border border-border rounded-2xl px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            {isMe ? 'You' : memberName(t.from)} → {t.to === currentUserId ? 'you' : memberName(t.to)}
                          </p>
                          <p className="text-xs text-muted-foreground font-semibold">£{t.amount.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                          {isMe && !pendingForThis && (
                            <button onClick={() => { setPayTarget(t); setPayNote('') }}
                              className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-xl">
                              Mark paid
                            </button>
                          )}
                          {!isMe && t.to === currentUserId && !nudgedIds.has(t.from) && (
                            <button onClick={() => handleNudge(t.from)}
                              className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-xl">
                              <Bell className="w-3 h-3" /> Nudge
                            </button>
                          )}
                          {pendingForThis && (
                            <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-xl">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Per-person balances */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Balances</p>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {members.map((m, i) => {
                const bal = balances[m.user_id] ?? 0
                return (
                  <div key={m.user_id} className={`flex items-center justify-between px-4 py-3 ${i < members.length - 1 ? 'border-b border-border' : ''}`}>
                    <span className="text-sm font-medium">{m.user_id === currentUserId ? 'You' : m.display_name}</span>
                    <span className={`text-sm font-semibold ${bal > 0.01 ? 'text-emerald-600' : bal < -0.01 ? 'text-destructive' : 'text-muted-foreground'}`}>
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
              className="bg-background w-full rounded-t-3xl max-h-[90vh] overflow-y-auto max-w-mobile mx-auto"
              onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-background px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold">Add expense</h2>
                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <form onSubmit={handleAdd} className="px-5 py-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                  <input required autoFocus value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Dinner at La Boqueria"
                    className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>

                <div className="flex gap-3">
                  <div className="w-24">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Currency</label>
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                      className="w-full h-12 px-3 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm">
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Amount</label>
                    <input required type="number" min="0.01" step="0.01" value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base font-semibold" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Paid by</label>
                  <select value={form.paid_by} onChange={e => setForm(f => ({ ...f, paid_by: e.target.value }))}
                    className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm">
                    {members.map(m => <option key={m.user_id} value={m.user_id}>{m.user_id === currentUserId ? 'You' : m.display_name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${form.category === c ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Split</label>
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
                  className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
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
              className="bg-card w-full rounded-t-3xl p-6 max-w-mobile mx-auto"
              onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-1">Mark as paid</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Send £{payTarget.amount.toFixed(2)} to {memberName(payTarget.to)} — they&apos;ll confirm receipt.
              </p>
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Note (optional)</label>
                <input value={payNote} onChange={e => setPayNote(e.target.value)}
                  placeholder="Bank transfer, Monzo, etc."
                  className="w-full h-12 px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPayTarget(null)} className="flex-1 h-12 rounded-2xl border border-border text-sm font-medium">Cancel</button>
                <button onClick={handleRecordPayment} disabled={isPending}
                  className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
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
