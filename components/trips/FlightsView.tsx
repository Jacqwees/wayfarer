'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, PlaneTakeoff, PlaneLanding, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { saveFlight, deleteFlight } from '@/app/actions/flights'

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

const empty: { direction: 'outbound' | 'return'; departure_airport: string; arrival_airport: string; departure_datetime: string; arrival_datetime: string; flight_number: string; airline: string; booking_ref: string; notes: string } = {
  direction: 'outbound',
  departure_airport: '',
  arrival_airport: '',
  departure_datetime: '',
  arrival_datetime: '',
  flight_number: '',
  airline: '',
  booking_ref: '',
  notes: '',
}

function formatDateTime(dt: string) {
  const d = new Date(dt)
  return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function duration(dep: string, arr: string) {
  const mins = (new Date(arr).getTime() - new Date(dep).getTime()) / 60000
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

export default function FlightsView({ tripId, flights, canEdit }: Props) {
  const router = useRouter()
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
    startTransition(async () => {
      await deleteFlight(tripId, id)
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

      <h1 className="text-2xl font-bold mb-7">Flights</h1>

      {(['outbound', 'return'] as const).map(dir => {
        const list = dir === 'outbound' ? outbound : returnFlight
        const Icon = dir === 'outbound' ? PlaneTakeoff : PlaneLanding
        const label = dir === 'outbound' ? 'Outbound' : 'Return'

        return (
          <div key={dir} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{label}</span>
              </div>
              {canEdit && (
                <button onClick={() => openAdd(dir)}
                  className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              )}
            </div>

            {list.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl px-4 py-8 text-center text-muted-foreground text-sm">
                No {label.toLowerCase()} flight added yet
              </div>
            ) : (
              <div className="space-y-3">
                {list.map(f => (
                  <div key={f.id} className="bg-card border border-border rounded-2xl px-4 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-xl font-bold">{f.departure_airport}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(f.departure_datetime)}</p>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 px-2">
                          <div className="text-xs text-muted-foreground">{duration(f.departure_datetime, f.arrival_datetime)}</div>
                          <div className="w-16 h-px bg-border relative">
                            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold">{f.arrival_airport}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(f.arrival_datetime)}</p>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(f)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => setDeleteId(f.id)} className="p-1.5 rounded-xl hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                      {f.airline && <span className="text-xs text-muted-foreground">{f.airline}</span>}
                      {f.flight_number && <span className="text-xs text-muted-foreground font-mono">{f.flight_number}</span>}
                      {f.booking_ref && <span className="text-xs bg-primary/10 text-primary rounded-lg px-2 py-0.5 font-mono">{f.booking_ref}</span>}
                    </div>
                    {f.notes && <p className="text-xs text-muted-foreground mt-2">{f.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Add/Edit sheet */}
      <AnimatePresence>
        {form && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setForm(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-background w-full rounded-t-3xl max-h-[90vh] overflow-y-auto max-w-mobile mx-auto"
              onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-background px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold">{form.id ? 'Edit' : 'Add'} {form.direction} flight</h2>
                <button onClick={() => setForm(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">From (IATA)</label>
                    <input required value={form.departure_airport} onChange={e => setForm(f => f && ({ ...f, departure_airport: e.target.value.toUpperCase() }))}
                      placeholder="LHR" maxLength={4}
                      className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base font-mono uppercase" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">To (IATA)</label>
                    <input required value={form.arrival_airport} onChange={e => setForm(f => f && ({ ...f, arrival_airport: e.target.value.toUpperCase() }))}
                      placeholder="BCN" maxLength={4}
                      className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base font-mono uppercase" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Departure</label>
                  <input required type="datetime-local" value={form.departure_datetime}
                    onChange={e => setForm(f => f && ({ ...f, departure_datetime: e.target.value }))}
                    className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Arrival</label>
                  <input required type="datetime-local" value={form.arrival_datetime}
                    onChange={e => setForm(f => f && ({ ...f, arrival_datetime: e.target.value }))}
                    className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Airline</label>
                    <input value={form.airline} onChange={e => setForm(f => f && ({ ...f, airline: e.target.value }))}
                      placeholder="easyJet"
                      className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Flight no.</label>
                    <input value={form.flight_number} onChange={e => setForm(f => f && ({ ...f, flight_number: e.target.value }))}
                      placeholder="EZY1234"
                      className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Booking reference</label>
                  <input value={form.booking_ref} onChange={e => setForm(f => f && ({ ...f, booking_ref: e.target.value }))}
                    placeholder="ABC123"
                    className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono uppercase" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => f && ({ ...f, notes: e.target.value }))}
                    placeholder="Checked bags, terminal info…" rows={2}
                    className="w-full px-4 py-3 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
                </div>

                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>}

                <button type="submit" disabled={isPending}
                  className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
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
              className="bg-card w-full rounded-t-3xl p-6 max-w-mobile mx-auto"
              onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-2">Remove flight?</h2>
              <p className="text-sm text-muted-foreground mb-6">This cannot be undone.</p>
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
