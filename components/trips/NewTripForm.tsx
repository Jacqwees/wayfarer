'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, ImagePlus, X, Loader2 } from 'lucide-react'
import Script from 'next/script'
import { createTrip, getUploadUrl } from '@/app/actions/trips'

type PlaceSuggestion = {
  place_id: string
  description: string
  lat?: number
  lng?: number
}

export default function NewTripForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [destinationData, setDestinationData] = useState<PlaceSuggestion | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapsLoaded = useRef(false)

  function onMapsLoaded() {
    mapsLoaded.current = true
  }

  function handleDestinationChange(val: string) {
    setDestination(val)
    setDestinationData(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 2) { setSuggestions([]); return }
    debounceRef.current = setTimeout(() => {
      if (!(window as any).google?.maps?.places) return
      const svc = new (window as any).google.maps.places.AutocompleteService()
      svc.getPlacePredictions({ input: val, types: ['(cities)'] }, (preds: any[], status: string) => {
        if (status === 'OK') setSuggestions(preds.map((p: any) => ({ place_id: p.place_id, description: p.description })))
      })
    }, 300)
  }

  async function selectSuggestion(s: PlaceSuggestion) {
    setDestination(s.description)
    setSuggestions([])
    if (!(window as any).google?.maps?.places) { setDestinationData(s); return }
    const svc = new (window as any).google.maps.places.PlacesService(document.createElement('div'))
    svc.getDetails({ placeId: s.place_id, fields: ['geometry'] }, (place: any, status: string) => {
      if (status === 'OK' && place?.geometry?.location) {
        setDestinationData({ ...s, lat: place.geometry.location.lat(), lng: place.geometry.location.lng() })
      } else {
        setDestinationData(s)
      }
    })
  }

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `trip-covers/${Date.now()}.${ext}`
      const result = await getUploadUrl('covers', path)
      if (result.error || !result.data) throw new Error(result.error ?? 'Could not get upload URL')

      // Use Supabase client uploadToSignedUrl — more reliable than raw fetch on mobile
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .uploadToSignedUrl(result.data.path, result.data.token, file, { contentType: file.type })
      if (uploadError) throw new Error(uploadError.message)

      setCoverUrl(`https://fkybsfpdhvjitivsylnj.supabase.co/storage/v1/object/public/covers/${path}`)
    } catch (err: any) {
      setError(err.message ?? 'Photo upload failed — please try again')
    }
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Trip name is required'); return }
    if (!destinationData) { setError('Please select a destination from the suggestions'); return }
    if (!startDate || !endDate) { setError('Please set travel dates'); return }
    if (endDate < startDate) { setError('Return date must be after departure'); return }
    setError('')
    startTransition(async () => {
      const result = await createTrip({
        name: name.trim(),
        destination_name: destinationData.description,
        destination_lat: destinationData.lat ?? null,
        destination_lng: destinationData.lng ?? null,
        start_date: startDate,
        end_date: endDate,
        cover_photo_url: coverUrl,
      })
      if (result?.error) setError(result.error)
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={onMapsLoaded}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-5 pt-14 pb-32 max-w-mobile mx-auto"
      >
        <div className="mb-7">
          <p className="eyebrow mb-0.5">plan ahead</p>
          <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">New trip</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover photo */}
          <div>
            <label className="eyebrow mb-1.5 block">Cover photo · optional</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full h-44 rounded-xl border border-dashed border-border relative overflow-hidden flex flex-col items-center justify-center gap-2 bg-card active:scale-[0.99] transition-transform"
            >
              {coverUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCoverUrl(null) }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center z-10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </>
              ) : uploading ? (
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-7 h-7 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Add a cover photo</span>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
          </div>

          {/* Trip name */}
          <div>
            <label className="eyebrow mb-1.5 block">Trip name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lanzarote Summer 2026"
              required
              className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>

          {/* Destination */}
          <div className="relative">
            <label className="eyebrow mb-1.5 block">Destination</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                placeholder="Search for a city…"
                autoComplete="off"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute z-20 top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                {suggestions.slice(0, 5).map((s, i) => (
                  <button
                    key={s.place_id}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className={`w-full text-left px-4 py-3.5 text-sm active:bg-muted flex items-center gap-3 ${i < suggestions.length - 1 ? 'border-b border-dashed border-border' : ''}`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {s.description}
                  </button>
                ))}
              </div>
            )}
            {destinationData && !suggestions.length && (
              <p className="text-xs text-primary mt-1.5 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3" /> Location confirmed
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow mb-1.5 block">Depart</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate('') }}
                required
                min={today}
                className="w-full h-12 px-3 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
            <div>
              <label className="eyebrow mb-1.5 block">Return</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate || today}
                className="w-full h-12 px-3 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isPending || uploading}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create trip'}
          </button>
        </form>
      </motion.div>
    </>
  )
}
