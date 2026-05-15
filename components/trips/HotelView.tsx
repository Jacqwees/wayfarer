'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Loader2, MapPin, ExternalLink } from 'lucide-react'
import Script from 'next/script'
import { saveHotel, deleteHotel } from '@/app/actions/hotel'

type HotelRow = {
  id: string
  name: string
  address: string
  lat: number | null
  lng: number | null
  check_in_date: string
  check_out_date: string
  booking_ref: string | null
  notes: string | null
}

type Props = {
  tripId: string
  hotels: HotelRow[]
  canEdit: boolean
  tripStart: string
  tripEnd: string
}

const emptyForm = {
  name: '', address: '', lat: null as number | null, lng: null as number | null,
  check_in_date: '', check_out_date: '', booking_ref: '', notes: '',
}

function nights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function openMaps(h: HotelRow) {
  const q = h.lat && h.lng ? `${h.lat},${h.lng}` : encodeURIComponent(h.address)
  window.open(`https://maps.google.com/?q=${q}`, '_blank')
}

function HotelCard({ h, canEdit, onEdit, onDelete }: {
  h: HotelRow; canEdit: boolean; onEdit: () => void; onDelete: () => void
}) {
  const n = nights(h.check_in_date, h.check_out_date)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="px-4 pt-4 pb-0 flex items-start justify-between">
        <div>
          <p className="eyebrow mb-0.5">accommodation</p>
          <h2 className="font-display italic text-[22px] leading-tight tracking-[-0.01em]">{h.name}</h2>
        </div>
        {canEdit && (
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg active:bg-muted transition-colors">
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg active:bg-destructive/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        )}
      </div>

      {/* Check-in card */}
      <div className="px-4 py-4">
        <div className="bg-background border border-border rounded-xl px-4 py-3 relative overflow-visible">
          {/* notches */}
          <div className="absolute -left-2 top-[58%] w-4 h-4 rounded-full bg-card border border-border z-10" />
          <div className="absolute -right-2 top-[58%] w-4 h-4 rounded-full bg-card border border-border z-10" />

          <div className="flex justify-between items-start">
            <div>
              <p className="eyebrow mb-1">Check-in</p>
              <p className="font-display italic text-[22px] leading-tight tracking-[-0.01em]">{formatDate(h.check_in_date)}</p>
              <p className="font-mono text-[10px] text-muted-foreground tracking-[0.1em] mt-1">after 15:00</p>
            </div>
            <div className="flex-1 flex items-center justify-center pt-6">
              <p className="font-mono text-[10px] text-muted-foreground tracking-[0.15em] uppercase">{n} night{n !== 1 ? 's' : ''}</p>
            </div>
            <div className="text-right">
              <p className="eyebrow mb-1">Check-out</p>
              <p className="font-display italic text-[22px] leading-tight tracking-[-0.01em]">{formatDate(h.check_out_date)}</p>
              <p className="font-mono text-[10px] text-muted-foreground tracking-[0.1em] mt-1">before 11:00</p>
            </div>
          </div>

          <svg height="2" width="100%" className="my-3" aria-hidden="true">
            <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
          </svg>

          {h.booking_ref && (
            <div className="flex justify-between">
              <div>
                <p className="eyebrow mb-1">Confirmation</p>
                <p className="font-mono text-xs text-foreground font-medium uppercase">{h.booking_ref}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map preview */}
      <div className="px-4 pb-4">
        <p className="eyebrow mb-2">Address</p>
        <div className="h-28 bg-secondary rounded-xl border border-border relative overflow-hidden mb-3">
          {/* Grid background */}
          <svg width="100%" height="100%" className="absolute inset-0 opacity-40">
            <defs>
              <pattern id={`grid-${h.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${h.id})`} />
            <path d="M -10 60 Q 70 50 150 70 T 310 65" stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" opacity="0.25" />
          </svg>
          {/* Pin */}
          <div className="absolute top-[35%] left-[38%]">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          {/* Address chip */}
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-background/85 backdrop-blur-sm border-t border-border">
            <p className="font-mono text-[10px] text-foreground truncate tracking-wide">{h.address}</p>
          </div>
        </div>
        <button
          onClick={() => openMaps(h)}
          className="w-full h-10 rounded-full border border-border text-sm font-medium text-foreground flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Maps →
        </button>
      </div>

      {h.notes && (
        <div className="px-4 pb-4 border-t border-dashed border-border pt-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{h.notes}</p>
        </div>
      )}
    </div>
  )
}

export default function HotelView({ tripId, hotels, canEdit, tripStart, tripEnd }: Props) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<(typeof emptyForm & { id?: string }) | null>(null)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const addressRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mapsReady && form && addressRef.current && !(window as any).__hotelAC) {
      const ac = new (window as any).google.maps.places.Autocomplete(addressRef.current, { types: ['establishment', 'geocode'] })
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        const lat = place.geometry?.location?.lat() ?? null
        const lng = place.geometry?.location?.lng() ?? null
        setForm(f => f && ({
          ...f,
          address: place.formatted_address ?? f.address,
          name: f.name || place.name || f.name,
          lat,
          lng,
        }))
      })
      ;(window as any).__hotelAC = true
    }
  }, [mapsReady, form])

  function openAdd() {
    ;(window as any).__hotelAC = false
    setForm({ ...emptyForm })
    setError('')
  }

  function openEdit(h: HotelRow) {
    ;(window as any).__hotelAC = false
    setForm({ id: h.id, name: h.name, address: h.address, lat: h.lat, lng: h.lng, check_in_date: h.check_in_date, check_out_date: h.check_out_date, booking_ref: h.booking_ref ?? '', notes: h.notes ?? '' })
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setError('')

    if (form.check_out_date && form.check_in_date && form.check_out_date <= form.check_in_date) {
      setError('Check-out must be after check-in')
      return
    }
    if (tripStart && form.check_in_date && form.check_in_date < tripStart) {
      const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      setError(`Check-in can't be before your trip starts (${fmt(tripStart)})`)
      return
    }
    if (tripEnd && form.check_out_date && form.check_out_date > tripEnd) {
      const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      setError(`Check-out can't be after your trip ends (${fmt(tripEnd)})`)
      return
    }

    startTransition(async () => {
      const res = await saveHotel(tripId, form)
      if (res.error) { setError(res.error); return }
      setForm(null)
    })
  }

  function handleDelete(id: string) {
    setDeleteId(null)
    startTransition(async () => { await deleteHotel(tripId, id) })
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
        onLoad={() => setMapsReady(true)}
        strategy="lazyOnload"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="min-h-screen bg-background pb-32"
      >
        {/* Header */}
        <div className="px-5 pt-14 pb-5 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-0.5">where you&apos;re staying</p>
            <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">Hotel</h1>
          </div>
          {canEdit && (
            <button onClick={openAdd}
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 active:scale-[0.98] transition-transform">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>

        <div className="px-4 space-y-4">
          {hotels.length === 0 ? (
            <div
              className="border border-dashed border-border rounded-xl px-5 py-12 text-center"
              onClick={() => canEdit && openAdd()}
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-border flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No accommodation added yet</p>
              {canEdit && <p className="font-mono text-[10px] text-primary tracking-[0.1em] mt-3 uppercase">+ add hotel</p>}
            </div>
          ) : (
            hotels.map(h => (
              <HotelCard
                key={h.id}
                h={h}
                canEdit={canEdit}
                onEdit={() => openEdit(h)}
                onDelete={() => setDeleteId(h.id)}
              />
            ))
          )}
        </div>

        {/* Add/Edit sheet */}
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
                    <h2 className="font-display italic text-[24px] leading-tight">{form.id ? 'Edit' : 'Add'} accommodation</h2>
                  </div>
                  <button onClick={() => setForm(null)} className="p-2 -mr-1"><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 pb-8">
                  <div>
                    <label className="eyebrow mb-1.5 block">Property name</label>
                    <input required value={form.name} onChange={e => setForm(f => f && ({ ...f, name: e.target.value }))}
                      placeholder="Casa Boma"
                      className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  </div>

                  <div>
                    <label className="eyebrow mb-1.5 block">Address</label>
                    <input ref={addressRef} required value={form.address}
                      onChange={e => setForm(f => f && ({ ...f, address: e.target.value }))}
                      placeholder="Search for the hotel…"
                      className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="eyebrow mb-1.5 block">Check-in</label>
                      <input required type="date" value={form.check_in_date}
                        min={tripStart || undefined}
                        max={tripEnd || undefined}
                        onChange={e => {
                          const ci = e.target.value
                          setForm(f => f && ({
                            ...f,
                            check_in_date: ci,
                            check_out_date: f.check_out_date && f.check_out_date <= ci ? '' : f.check_out_date,
                          }))
                        }}
                        className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                    </div>
                    <div>
                      <label className="eyebrow mb-1.5 block">Check-out</label>
                      <input required type="date" value={form.check_out_date}
                        min={form.check_in_date || tripStart || undefined}
                        max={tripEnd || undefined}
                        onChange={e => setForm(f => f && ({ ...f, check_out_date: e.target.value }))}
                        className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="eyebrow mb-1.5 block">Booking reference</label>
                    <input value={form.booking_ref} onChange={e => setForm(f => f && ({ ...f, booking_ref: e.target.value }))}
                      placeholder="CB-2026-7841"
                      className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono" />
                  </div>

                  <div>
                    <label className="eyebrow mb-1.5 block">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(f => f && ({ ...f, notes: e.target.value }))}
                      placeholder="Pool access, breakfast included…" rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
                  </div>

                  {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>}

                  <button type="submit" disabled={isPending}
                    className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {form.id ? 'Save changes' : 'Add accommodation'}
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
                <h2 className="font-display italic text-[22px] mb-2">Remove accommodation?</h2>
                <p className="text-sm text-muted-foreground mb-6">This cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteId(null)}
                    className="flex-1 h-12 rounded-full border border-border text-sm font-medium">Cancel</button>
                  <button onClick={() => handleDelete(deleteId!)} disabled={isPending}
                    className="flex-1 h-12 rounded-full bg-destructive text-white text-sm font-semibold disabled:opacity-50">Delete</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
