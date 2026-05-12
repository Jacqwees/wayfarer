'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Plus, Trash2, CheckSquare, Square, PackageCheck, X, Loader2 } from 'lucide-react'
import { addPackingItem, togglePackingItem, deletePackingItem } from '@/app/actions/packing'

type PackingItem = {
  id: string
  label: string
  packed: boolean
  assigned_to: string | null
  added_by: string
}

type Member = { user_id: string; display_name: string }

type Props = {
  tripId: string
  items: PackingItem[]
  members: Member[]
  currentUserId: string
  isOwner: boolean
}

export default function PackingView({ tripId, items: initial, members, currentUserId, isOwner }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [items, setItems] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [label, setLabel] = useState('')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'mine' | 'unpacked'>('all')
  const [error, setError] = useState('')

  function memberName(uid: string) {
    return members.find(m => m.user_id === uid)?.display_name ?? 'Someone'
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    setError('')
    const optimistic: PackingItem = {
      id: Math.random().toString(),
      label: label.trim(),
      packed: false,
      assigned_to: assignedTo || null,
      added_by: currentUserId,
    }
    setItems(prev => [...prev, optimistic])
    setLabel('')
    setAssignedTo('')
    setShowAdd(false)
    startTransition(async () => {
      const res = await addPackingItem(tripId, optimistic.label, optimistic.assigned_to)
      if (res.error) { setError(res.error); setItems(prev => prev.filter(x => x.id !== optimistic.id)) }
      else router.refresh()
    })
  }

  function handleToggle(item: PackingItem) {
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, packed: !x.packed } : x))
    startTransition(async () => {
      await togglePackingItem(tripId, item.id, !item.packed)
    })
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(x => x.id !== id))
    startTransition(async () => { await deletePackingItem(tripId, id) })
  }

  const filtered = items.filter(item => {
    if (filter === 'mine') return item.assigned_to === currentUserId
    if (filter === 'unpacked') return !item.packed
    return true
  })

  const packedCount = items.filter(i => i.packed).length
  const progress = items.length ? Math.round((packedCount / items.length) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="min-h-screen bg-background px-5 pt-14 pb-32 max-w-mobile mx-auto"
    >
      <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground mb-6 -ml-1">
        <ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span>
      </button>

      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">Packing list</h1>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold active:scale-95 transition-transform">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{packedCount} of {items.length} packed</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 mb-5">
        {(['all', 'mine', 'unpacked'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
            {f === 'all' ? 'All' : f === 'mine' ? 'Assigned to me' : 'Unpacked'}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 mb-4">{error}</p>}

      {filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-lg px-4 py-12 text-center">
          <PackageCheck className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {items.length === 0 ? 'Add items your group needs to pack' : 'Nothing here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map(item => (
              <motion.div key={item.id}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={`flex items-center gap-3 bg-card border rounded-lg px-4 py-3 transition-colors ${item.packed ? 'border-border opacity-60' : 'border-border'}`}>
                  <button onClick={() => handleToggle(item)} disabled={isPending} className="shrink-0">
                    {item.packed
                      ? <CheckSquare className="w-5 h-5 text-primary" />
                      : <Square className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.packed ? 'line-through text-muted-foreground' : ''}`}>
                      {item.label}
                    </p>
                    {item.assigned_to && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        → {memberName(item.assigned_to)}
                      </p>
                    )}
                  </div>
                  {(item.added_by === currentUserId || isOwner) && (
                    <button onClick={() => handleDelete(item.id)} disabled={isPending}
                      className="p-1.5 rounded-xl hover:bg-destructive/10 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add item sheet */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setShowAdd(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-background w-full rounded-t-3xl p-6 max-w-mobile mx-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Add item</h2>
                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Item</label>
                  <input
                    autoFocus required
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="Sunscreen, adaptor, passport…"
                    className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Assign to (optional)</label>
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  >
                    <option value="">Anyone</option>
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" disabled={isPending || !label.trim()}
                  className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add to list
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
