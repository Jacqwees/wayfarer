'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { saveFlight, deleteFlight } from '@/app/actions/flights'
import AirportInput from '@/components/shared/AirportInput'
import { useT } from '@/lib/i18n'

type Flight = {
  id: string
  direction: 'outbound' | 'return'
  departure_airport: string
  arrival_airport: string
  departure_datetime: string
  arrival_datetime: string
  flight_number: string | null
  airline: string | null
  booking_ref: string | null
  notes: string | null
}

type Props = {
  tripId: string
  flights: Flight[]
  canEdit: boolean
}

const empty = {
  direction: 'outbound' as 'outbound' | 'return',
  departure_airport: '',
  arrival_airport: '',
  departure_datetime: '',
  arrival_datetime: '',
  flight_number: '',
  airline: '',
  booking_ref: '',
  notes: '',
}

function formatDate(dt: string) {
  const d = new Date(dt)
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function duration(dep: string, arr: string) {
  const mins = (new Date(arr).getTime() - new Date(dep).getTime()) / 60000
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

function BoardingPassCard({ f, canEdit, onEdit, onDelete }: {
  f: Flight; canEdit: boolean; onEdit: () => void; onDelete: () => void
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-visible relative">
      {/* notch circles */}
      <div className="absolute -left-2 top-[62%] w-4 h-4 rounded-full bg-background border border-border z-10" />
      <div className="absolute -right-2 top-[62%] w-4 h-4 rounded-full bg-background border border-border z-10" />

      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow text-primary">● {f.direction.toUpperCase()}</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-emerald-500">● confirmed</span>
            {canEdit && (
              <div className="flex gap-1">
                <button onClick={onEdit} className="p-1.5 rounded-lg active:bg-muted transition-colors">
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
                <button onClick={onDelete} className="p-1.5 rounded-lg active:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Route */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-display italic text-[44px] leading-none tracking-[-0.02em] text-foreground">{f.departure_airport}</p>
            <p className="eyebrow mt-1">{f.departure_airport}</p>
          </div>

          <div className="flex-1 px-4 text-center">
            <p className="font-mono text-[10px] text-muted-foreground tracking-[0.1em] mb-1.5">{duration(f.departure_datetime, f.arrival_datetime)}</p>
            <div className="relative">
              <svg height="2" width="100%" className="block">
                <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 4" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-1">
                <Plane className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            {f.flight_number && (
              <p className="font-mono text-[10px] text-muted-foreground tracking-[0.1em] mt-1.5">{f.flight_number}</p>
            )}
          </div>

          <div className="text-right">
            <p className="font-display italic text-[44px] leading-none tracking-[-0.02em] text-foreground">{f.arrival_airport}</p>
            <p className="eyebrow mt-1 text-right">{f.arrival_airport}</p>
          </div>
        </div>
      </div>

      {/* Perforation */}
      <svg height="2" width="100%" aria-hidden="true">
        <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
      </svg>

      <div className="px-5 py-3 flex justify-between items-start">
        <div>
          <p className="eyebrow mb-1">Date</p>
          <p className="font-mono text-xs text-foreground font-medium">{formatDate(f.departure_datetime)}</p>
        </div>
        <div className="text-right">
          <p className="eyebrow mb-1">Seats</p>
          <p className="font-mono text-xs text-foreground font-medium">{f.airline ?? '—'}</p>
        </div>
      </div>

      {f.booking_ref && (
        <div className="px-5 pb-3 border-t border-dashed border-border">
          <p className="eyebrow mt-3 mb-1">Booking ref</p>
          <p className="font-mono text-xs text-foreground font-medium uppercase">{f.booking_ref}</p>
        </div>
      )}

      {f.notes && (
        <div className="px-5 pb-4 border-t border-dashed border-border">
          <p className="text-xs text-muted-foreground mt-3">{f.notes}</p>
        </div>
      )}
    </div>
  )
}

export default function FlightsView({ tripId, flights, canEdit }: Props) {
  const router = useRouter()
  const t = useT()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<(typeof empty & { id?: string }) | null>(null)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const outbound = flights.filter(f => f.direction === 'outbound')
  const returnFlight = flights.filter(f => f.direction === 'return')

  function openAdd(direction: 'outbound' | 'return') {
    setForm({ ...empty, direction })
    setError('')
  }

  function openEdit(f: Flight) {
    setForm({
      id: f.id,
      direction: f.direction,
      departure_airport: f.departure_airport,
      arrival_airport: f.arrival_airport,
      departure_datetime: f.departure_datetime.slice(0, 16),
      arrival_datetime: f.arrival_datetime.slice(0, 16),
      flight_number: f.flight_number ?? '',
      airline: f.airline ?? '',
      booking_ref: f.booking_ref ?? '',
      notes: f.notes ?? '',
    })
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setError('')
    startTransition(async () => {
      const res = await saveFlight(tripId, {
        ...form,
        departure_datetime: new Date(form.departure_datetime).toISOString(),
        arrival_datetime: new Date(form.arrival_datetime).toISOString(),
      })
      if (res.error) { setError(res.error); return }
      setForm(null)
    })
  }

  function handleDelete(id: string) {
    setDeleteId(null)
    startTransition(async () => { await deleteFlight(tripId, id) })
  }

  const sections = [
    { dir: 'outbound' as const, list: outbound, label: t.flights.outbound, emptyMsg: t.flights.noOutbound },
    { dir: 'return' as const, list: returnFlight, label: t.flights.return, emptyMsg: t.flights.noReturn },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="min-h-screen bg-background pb-32"
    >
      {/* Header */}
      <div className="px-5 pt-14 pb-5">
        <p className="eyebrow mb-0.5">your squad&apos;s flights</p>
        <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">{t.flights.title}</h1>
      </div>

      <div className="px-4 space-y-8">
        {sections.map(({ dir, list, label, emptyMsg }) => (
          <div key={dir}>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="eyebrow">{label}</p>
              {canEdit && (
                <button onClick={() => openAdd(dir)}
                  className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform">
                  <Plus className="w-3.5 h-3.5 text-foreground" />
                </button>
              )}
            </div>

            {list.length === 0 ? (
              <div
                className="border border-dashed border-border rounded-xl px-5 py-7 text-center cursor-default"
                onClick={() => canEdit && openAdd(dir)}
              >
                <Plane className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{emptyMsg}</p>
                {canEdit && (
                  <p className="font-mono text-[10px] text-primary tracking-[0.1em] mt-3 uppercase">+ add leg</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {list.map(f => (
                  <BoardingPassCard
                    key={f.id}
                    f={f}
                    canEdit={canEdit}
                    onEdit={() => openEdit(f)}
                    onDelete={() => setDeleteId(f.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit sheet */}
      <AnimatePresence>
        {form && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setForm(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-background w-full rounded-t-[28px] max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div>
                  <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
                  <h2 className="font-display italic text-[24px] leading-tight tracking-[-0.01em]">
                    {form.id ? 'Edit' : 'Add'} {form.direction === 'outbound' ? 'outbound' : 'return'} flight
                  </h2>
                </div>
                <button onClick={() => setForm(null)} className="p-2 -mr-1">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 pb-8">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="eyebrow mb-1.5 block">From</label>
                    <AirportInput required value={form.departure_airport}
                      onChange={v => setForm(f => f && ({ ...f, departure_airport: v }))}
                      placeholder="LGW" />
                  </div>
                  <div>
                    <label className="eyebrow mb-1.5 block">To</label>
                    <AirportInput required value={form.arrival_airport}
                      onChange={v => setForm(f => f && ({ ...f, arrival_airport: v }))}
                      placeholder="LIS" />
                  </div>
                </div>

                <div>
                  <label className="eyebrow mb-1.5 block">Departure</label>
                  <input required type="datetime-local" value={form.departure_datetime}
                    onChange={e => setForm(f => f && ({ ...f, departure_datetime: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>

                <div>
                  <label className="eyebrow mb-1.5 block">Arrival</label>
                  <input required type="datetime-local" value={form.arrival_datetime}
                    onChange={e => setForm(f => f && ({ ...f, arrival_datetime: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="eyebrow mb-1.5 block">Airline</label>
                    <input value={form.airline} onChange={e => setForm(f => f && ({ ...f, airline: e.target.value }))}
                      placeholder="British Airways"
                      className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  </div>
                  <div>
                    <label className="eyebrow mb-1.5 block">Flight no.</label>
                    <input value={form.flight_number} onChange={e => setForm(f => f && ({ ...f, flight_number: e.target.value }))}
                      placeholder="BA 532"
                      className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono" />
                  </div>
                </div>

                <div>
                  <label className="eyebrow mb-1.5 block">Booking ref</label>
                  <input value={form.booking_ref} onChange={e => setForm(f => f && ({ ...f, booking_ref: e.target.value }))}
                    placeholder="ABC123"
                    className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono uppercase" />
                </div>

                <div>
                  <label className="eyebrow mb-1.5 block">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => f && ({ ...f, notes: e.target.value }))}
                    placeholder="Seat preferences, luggage notes…" rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
                </div>

                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>}

                <button type="submit" disabled={isPending}
                  className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {form.id ? 'Save changes' : 'Add flight'}
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
              <h2 className="font-display italic text-[22px] mb-2">Remove flight?</h2>
              <p className="text-sm text-muted-foreground mb-6">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 h-12 rounded-full border border-border text-sm font-medium active:scale-[0.98] transition-transform">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteId!)} disabled={isPending}
                  className="flex-1 h-12 rounded-full bg-destructive text-white text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform">
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
