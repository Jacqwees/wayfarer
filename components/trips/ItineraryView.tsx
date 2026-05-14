'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Loader2, CalendarDays } from 'lucide-react'
import { addItineraryItem, updateItineraryItem, deleteItineraryItem } from '@/app/actions/itinerary'

type Item = {
  id: string
  date: string
  title: string
  description: string | null
  time: string | null
  added_by: string
}

type Props = {
  tripId: string
  items: Item[]
  days: string[]
  canAdd: boolean
  canEdit: boolean
}

function dayOfWeek(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()
}

function dayNum(d: string) {
  return new Date(d + 'T12:00:00').getDate()
}

function dayHeader(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function ItineraryView({ tripId, items, days, canAdd, canEdit }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeDay, setActiveDay] = useState(days[0] ?? '')
  const [addDate, setAddDate] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', time: '' })
  const [error, setError] = useState('')

  function openAdd(date: string) {
    setAddDate(date)
    setForm({ title: '', description: '', time: '' })
    setError('')
  }

  function openEdit(item: Item) {
    setEditItem(item)
    setForm({ title: item.title, description: item.description ?? '', time: item.time ?? '' })
    setError('')
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addDate || !form.title.trim()) return
    setError('')
    startTransition(async () => {
      const res = await addItineraryItem(tripId, { date: addDate, title: form.title.trim(), description: form.description, time: form.time })
      if (res.error) { setError(res.error); return }
      setAddDate(null)
    })
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editItem) return
    setError('')
    startTransition(async () => {
      const res = await updateItineraryItem(tripId, editItem.id, { title: form.title.trim(), description: form.description, time: form.time })
      if (res.error) { setError(res.error); return }
      setEditItem(null)
    })
  }

  function handleDelete(id: string) {
    setDeleteId(null)
    startTransition(async () => { await deleteItineraryItem(tripId, id) })
  }

  const dayItems = (date: string) => items.filter(i => i.date === date).sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="min-h-screen bg-background pb-32"
    >
      {/* Header */}
      <div className="px-5 pt-14 pb-3">
        <p className="eyebrow mb-0.5">day by day</p>
        <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">Itinerary</h1>
      </div>

      {days.length === 0 ? (
        <div className="px-4">
          <div className="border border-dashed border-border rounded-xl px-4 py-12 text-center">
            <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Trip dates not set</p>
          </div>
        </div>
      ) : (
        <>
          {/* Day picker strip */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none">
            {days.map(d => {
              const active = d === activeDay
              return (
                <button key={d} onClick={() => setActiveDay(d)}
                  className="shrink-0 w-11 py-2 rounded-xl text-center transition-colors active:scale-95"
                  style={{
                    background: active ? 'hsl(var(--foreground))' : 'hsl(var(--card))',
                    border: active ? 'none' : '1px solid hsl(var(--border))',
                  }}>
                  <p className="font-mono text-[9px] tracking-[0.1em] mb-0.5" style={{ opacity: 0.7, color: active ? 'hsl(var(--background))' : 'hsl(var(--foreground))' }}>
                    {dayOfWeek(d)}
                  </p>
                  <p className="font-semibold text-base leading-tight" style={{ color: active ? 'hsl(var(--background))' : 'hsl(var(--foreground))' }}>
                    {dayNum(d)}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Active day content */}
          <div className="px-5 mt-3">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display italic text-[24px] leading-tight tracking-[-0.01em]">
                {dayHeader(activeDay).split(',')[0]}
                <span className="text-muted-foreground">, {dayHeader(activeDay).split(',').slice(1).join(',').trim()}</span>
              </p>
              {canAdd && (
                <button onClick={() => openAdd(activeDay)}
                  className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform">
                  <Plus className="w-3.5 h-3.5 text-foreground" />
                </button>
              )}
            </div>

            {dayItems(activeDay).length === 0 ? (
              <div className="border border-dashed border-border rounded-xl px-4 py-8 text-center text-muted-foreground text-sm">
                Nothing planned · {canAdd ? 'tap + to add something' : 'all clear'}
              </div>
            ) : (
              <div>
                {dayItems(activeDay).map((item, i, arr) => {
                  const isLast = i === arr.length - 1
                  const hasTime = !!item.time
                  return (
                    <div key={item.id} className="flex gap-3 relative">
                      {/* Time + spine */}
                      <div className="w-12 shrink-0 relative pt-0.5">
                        {hasTime && (
                          <p className="font-mono text-[12px] font-semibold text-primary tabular-nums">{item.time}</p>
                        )}
                        {/* Spine */}
                        {!isLast && (
                          <div className="absolute left-[5px] top-6 bottom-0 border-l border-dashed border-border" />
                        )}
                        {/* Dot */}
                        <div className="absolute left-0 top-5 w-[11px] h-[11px] rounded-full"
                          style={{
                            background: hasTime ? 'hsl(var(--primary))' : 'transparent',
                            border: `1.5px solid ${hasTime ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                          }} />
                      </div>

                      {/* Card */}
                      <div className={`flex-1 mb-3.5 px-3.5 py-3 rounded-xl border ${hasTime ? 'bg-card border-border' : 'border-dashed border-border bg-transparent'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold tracking-[-0.01em] ${!hasTime ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1 leading-snug">{item.description}</p>
                            )}
                          </div>
                          {canEdit && (
                            <div className="flex gap-0.5 shrink-0">
                              <button onClick={() => openEdit(item)} className="p-1 rounded-lg active:bg-muted transition-colors">
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </button>
                              <button onClick={() => setDeleteId(item.id)} className="p-1 rounded-lg active:bg-destructive/10 transition-colors">
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit sheet */}
      <AnimatePresence>
        {(addDate || editItem) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => { setAddDate(null); setEditItem(null) }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-background w-full rounded-t-[28px] max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <h2 className="font-display italic text-[24px] leading-tight">{editItem ? 'Edit' : 'Add'} activity</h2>
                <button onClick={() => { setAddDate(null); setEditItem(null) }}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <form onSubmit={editItem ? handleEdit : handleAdd} className="px-5 py-4 space-y-4 pb-8">
                <div>
                  <label className="eyebrow mb-1.5 block">Title</label>
                  <input required autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Visit Sagrada Família"
                    className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>

                <div>
                  <label className="eyebrow mb-1.5 block">Time (optional)</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>

                <div>
                  <label className="eyebrow mb-1.5 block">Notes (optional)</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Tickets booked, meeting spot…" rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
                </div>

                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>}

                <button type="submit" disabled={isPending}
                  className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editItem ? 'Save changes' : 'Add to itinerary'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setDeleteId(null)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="bg-card w-full rounded-t-[28px] p-6"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <h2 className="font-display italic text-[22px] mb-2">Remove activity?</h2>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 h-12 rounded-full border border-border text-sm font-medium">Cancel</button>
                <button onClick={() => handleDelete(deleteId!)} disabled={isPending}
                  className="flex-1 h-12 rounded-full bg-destructive text-white text-sm font-semibold disabled:opacity-50">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
