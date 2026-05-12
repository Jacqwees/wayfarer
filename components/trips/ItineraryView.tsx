'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Plus, Pencil, Trash2, X, Loader2, Clock, CalendarDays } from 'lucide-react'
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

function formatDayDisplay(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}
function formatDay(d: string) { return formatDayDisplay(d) }

export default function ItineraryView({ tripId, items, days, canAdd, canEdit }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
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

  const itemsByDay = (date: string) => items.filter(i => i.date === date).sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="min-h-screen bg-background px-5 pt-14 pb-32 max-w-mobile mx-auto"
    >
      <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground mb-6 -ml-1">
        <ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span>
      </button>

      <h1 className="text-2xl font-bold mb-7">Itinerary</h1>

      {days.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl px-4 py-12 text-center">
          <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Trip dates not set</p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day, idx) => {
            const dayItems = itemsByDay(day)
            return (
              <div key={day}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-0.5">
                      Day {String(idx + 1).padStart(2, '0')}
                    </p>
                    <p className="font-display italic text-[22px] leading-tight tracking-[-0.01em] text-foreground">
                      {formatDayDisplay(day)}
                    </p>
                  </div>
                  {canAdd && (
                    <button onClick={() => openAdd(day)} className="flex items-center gap-1 text-xs text-primary font-semibold">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  )}
                </div>

                {dayItems.length === 0 ? (
                  <div className="bg-card border border-dashed border-border rounded-2xl px-4 py-5 text-center text-muted-foreground text-xs">
                    Nothing planned yet
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-3">
                      {dayItems.map(item => (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 relative z-10">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          </div>
                          <div className="flex-1 bg-card border border-border rounded-2xl px-4 py-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                {item.time && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <span className="font-mono text-[11px] text-primary font-semibold">{item.time}</span>
                                  </div>
                                )}
                                <p className="font-semibold text-sm">{item.title}</p>
                                {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                              </div>
                              {canEdit && (
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => openEdit(item)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                  </button>
                                  <button onClick={() => setDeleteId(item.id)} className="p-1 rounded-lg hover:bg-destructive/10 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add item sheet */}
      <AnimatePresence>
        {(addDate || editItem) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => { setAddDate(null); setEditItem(null) }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-background w-full rounded-t-3xl max-h-[80vh] overflow-y-auto max-w-mobile mx-auto"
              onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-background px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold">{editItem ? 'Edit' : 'Add'} activity</h2>
                <button onClick={() => { setAddDate(null); setEditItem(null) }}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <form onSubmit={editItem ? handleEdit : handleAdd} className="px-5 py-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Title</label>
                  <input required autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Visit Sagrada Família"
                    className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Time (optional)</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Notes (optional)</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Tickets booked, meeting spot…" rows={3}
                    className="w-full px-4 py-3 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
                </div>

                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>}

                <button type="submit" disabled={isPending}
                  className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
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
              className="bg-card w-full rounded-t-3xl p-6 max-w-mobile mx-auto"
              onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-2">Remove activity?</h2>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 h-12 rounded-2xl border border-border text-sm font-medium">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} disabled={isPending}
                  className="flex-1 h-12 rounded-2xl bg-destructive text-white text-sm font-semibold disabled:opacity-50">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
