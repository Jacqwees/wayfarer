'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Hotel, Plus, Pencil, Trash2, X, Loader2, MapPin, ExternalLink } from 'lucide-react'
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
}

const emptyForm = { name: '', address: '', lat: null as number | null, lng: null as number | null, check_in_date: '', check_out_date: '', booking_ref: '', notes: '' }

function nights(ci: string, co: string) {
  const diff = (new Date(co).getTime() - new Date(ci).getTime()) / 86400000
  return Math.round(diff)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function HotelView({ tripId, hotels, canEdit }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<(typeof emptyForm & { id?: string }) | null>(null)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const addressRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  useEffect(() => {
    if (mapsReady && form && addressRef.current && !(window as any).__hotelAC) {
      const ac = new (window as any).google.maps.places.Autocomplete(addressRef.current, { types: ['establishment', 'geocode'] })
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        const lat = place.geometry?.location?.lat() ?? null
        const lng = place.geometry?.location?.lng() ?? null
        setForm(f => f && ({ ...f, address: place.formatted_address ?? f.address, lat, lng }))
      })
      autocompleteRef.current = ac
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

  function openMaps(h: HotelRow) {
    const q = h.lat && h.lng ? `${h.lat},${h.lng}` : encodeURIComponent(h.address)
    window.open(`https://maps.google.com/?q=${q}`, '_blank')
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setMapsReady(true)}
        strategy="lazyOnload"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="min-h-screen bg-background px-5 pt-14 pb-32 max-w-mobile mx-auto"
      >
        <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground mb-6 -ml-1">
          <ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span>
        </button>

        <div className="flex items-center justify-between mb-7">
          <h1 className="text-2xl font-bold">Hotel</h1>
          {canEdit && (
            <button onClick={openAdd} className="flex items-center gap-1 text-primary text-sm font-medium">
              <Plus className="w-4 h-4" /> Add
            </button>
          )}
        </div>

        {hotels.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl px-4 py-12 text-center">
            <Hotel className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No accommodation added yet</p>
            {canEdit && (
              <button onClick={openAdd} className="mt-4 text-sm text-primary font-medium">+ Add hotel</button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {hotels.map(h => (
              <div key={h.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-4 py-4">
                  <div className="flex items-start justify-between mb-1">
                    <h2 className="font-bold text-base">{h.name}</h2>
                    {canEdit && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(h)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => setDeleteId(h.id)} className="p-1.5 rounded-xl hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button onClick={() => openMaps(h)} className="flex items-start gap-1.5 text-muted-foreground mb-3 text-left">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span className="text-xs leading-relaxed">{h.address}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
                  </button>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Check-in</p>
                      <p className="text-sm font-semibold">{formatDate(h.check_in_date)}</p>
                    </div>
                    <div className="h-px flex-1 bg-border" />
                    <div className="text-xs text-muted-foreground text-center">{nights(h.check_in_date, h.check_out_date)} nights</div>
                    <div className="h-px flex-1 bg-border" />
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Check-out</p>
                      <p className="text-sm font-semibold">{formatDate(h.check_out_date)}</p>
                    </div>
                  </div>

                  {h.booking_ref && (
                    <div className="mt-3">
                      <span className="text-xs bg-primary/10 text-primary rounded-lg px-2 py-1 font-mono">Ref: {h.booking_ref}</span>
                    </div>
                  )}
                  {h.notes && <p className="text-xs text-muted-foreground mt-2">{h.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

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
                  <h2 className="text-lg font-bold">{form.id ? 'Edit' : 'Add'} accommodation</h2>
                  <button onClick={() => setForm(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Hotel / property name</label>
                    <input required value={form.name} onChange={e => setForm(f => f && ({ ...f, name: e.target.value }))}
                      placeholder="Barceló Raval"
                      className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Address</label>
                    <input ref={addressRef} required value={form.address}
                      onChange={e => setForm(f => f && ({ ...f, address: e.target.value }))}
                      placeholder="Search for the hotel…"
                      className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Check-in</label>
                      <input required type="date" value={form.check_in_date}
                        onChange={e => setForm(f => f && ({ ...f, check_in_date: e.target.value }))}
                        className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Check-out</label>
                      <input required type="date" value={form.check_out_date}
                        onChange={e => setForm(f => f && ({ ...f, check_out_date: e.target.value }))}
                        className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Booking reference</label>
                    <input value={form.booking_ref} onChange={e => setForm(f => f && ({ ...f, booking_ref: e.target.value }))}
                      placeholder="ABC123"
                      className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(f => f && ({ ...f, notes: e.target.value }))}
                      placeholder="Pool access, breakfast included…" rows={2}
                      className="w-full px-4 py-3 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
                  </div>

                  {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>}

                  <button type="submit" disabled={isPending}
                    className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
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
                className="bg-card w-full rounded-t-3xl p-6 max-w-mobile mx-auto"
                onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-2">Remove accommodation?</h2>
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
    </>
  )
}
