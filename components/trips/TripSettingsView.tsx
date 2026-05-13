'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Camera, Loader2, Trash2, X, MapPin } from 'lucide-react'
import Script from 'next/script'
import { updateTrip, deleteTrip, getUploadUrl } from '@/app/actions/trips'

type Trip = {
  id: string
  name: string
  destination_name: string
  destination_lat: number | null
  destination_lng: number | null
  start_date: string
  end_date: string
  cover_photo_url: string | null
}

export default function TripSettingsView({ trip, isOwner }: { trip: Trip; isOwner: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mapsReady, setMapsReady] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const destRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  const [form, setForm] = useState({
    name: trip.name,
    destination_name: trip.destination_name,
    destination_lat: trip.destination_lat,
    destination_lng: trip.destination_lng,
    start_date: trip.start_date,
    end_date: trip.end_date,
    cover_photo_url: trip.cover_photo_url,
  })

  function initAutocomplete() {
    if (!mapsReady || !destRef.current || autocompleteRef.current) return
    const ac = new (window as any).google.maps.places.Autocomplete(destRef.current, { types: ['(cities)'] })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      setForm(f => ({
        ...f,
        destination_name: place.formatted_address ?? place.name ?? f.destination_name,
        destination_lat: place.geometry?.location?.lat() ?? f.destination_lat,
        destination_lng: place.geometry?.location?.lng() ?? f.destination_lng,
      }))
    })
    autocompleteRef.current = ac
  }

  async function handleCoverPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `trip-covers/${trip.id}/${Date.now()}.${ext}`
      const result = await getUploadUrl('covers', path)
      if (result.error || !result.data) throw new Error(result.error ?? 'Could not get upload URL')

      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .uploadToSignedUrl(result.data.path, result.data.token, file, { contentType: file.type })
      if (uploadError) throw new Error(uploadError.message)

      const publicUrl = `https://fkybsfpdhvjitivsylnj.supabase.co/storage/v1/object/public/covers/${path}`
      setForm(f => ({ ...f, cover_photo_url: publicUrl }))
    } catch (err: any) {
      setError(err.message ?? 'Photo upload failed — please try again')
    } finally {
      setUploading(false)
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await updateTrip(trip.id, form)
      if (res?.error) { setError(res.error); return }
      router.push(`/trips/${trip.id}`)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTrip(trip.id)
    })
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

        <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em] mb-7">Trip settings</h1>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Cover photo */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Cover photo</label>
            <div
              className="relative h-40 rounded-lg overflow-hidden bg-gradient-to-br from-primary to-violet-600 cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {form.cover_photo_url && (
                <img src={form.cover_photo_url} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                {uploading
                  ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                  : <Camera className="w-6 h-6 text-white" />}
              </div>
              {form.cover_photo_url && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, cover_photo_url: null })) }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPhoto} />
          </div>

          {/* Trip name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Trip name</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Barcelona trip"
              className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>

          {/* Destination */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Destination</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={destRef}
                required
                value={form.destination_name}
                onChange={e => setForm(f => ({ ...f, destination_name: e.target.value }))}
                onFocus={initAutocomplete}
                placeholder="City, country"
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Start date</label>
              <input
                required type="date"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">End date</label>
              <input
                required type="date"
                value={form.end_date}
                min={form.start_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending || uploading}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </button>
        </form>

        {/* Danger zone */}
        {isOwner && (
          <div className="mt-10">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Danger zone</p>
            <div className="bg-card border border-destructive/30 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Delete this trip</p>
              <p className="text-xs text-muted-foreground mb-4">This permanently deletes the trip, all itinerary items, expenses, and member data. This cannot be undone.</p>
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 text-sm font-semibold text-destructive bg-destructive/10 px-4 py-2.5 rounded-xl"
              >
                <Trash2 className="w-4 h-4" /> Delete trip
              </button>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        <AnimatePresence>
          {showDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] flex items-end"
              onClick={() => setShowDelete(false)}>
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="bg-card w-full rounded-t-3xl p-6 max-w-mobile mx-auto"
                onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-2">Delete &quot;{trip.name}&quot;?</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  All data — itinerary, expenses, flights, hotels, members — will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDelete(false)} className="flex-1 h-12 rounded-2xl border border-border text-sm font-medium">Cancel</button>
                  <button onClick={handleDelete} disabled={isPending}
                    className="flex-1 h-12 rounded-2xl bg-destructive text-white text-sm font-semibold disabled:opacity-50">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete forever'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
