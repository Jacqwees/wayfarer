'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, MapPin, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type PlaceSuggestion = {
  place_id: string
  description: string
  lat?: number
  lng?: number
}

export default function NewTripForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [destinationData, setDestinationData] = useState<PlaceSuggestion | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const autocompleteTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Google Places autocomplete via REST
  async function fetchSuggestions(input: string) {
    if (input.length < 2) { setSuggestions([]); return }
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      const service = new (window as any).google.maps.places.AutocompleteService()
      service.getPlacePredictions(
        { input, types: ['(cities)'] },
        (preds: any[], status: string) => {
          if (status === 'OK') {
            setSuggestions(preds.map((p: any) => ({ place_id: p.place_id, description: p.description })))
          }
        }
      )
    }
  }

  async function resolveLatLng(placeId: string): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!(window as any).google?.maps?.places) { resolve(null); return }
      const service = new (window as any).google.maps.places.PlacesService(
        document.createElement('div')
      )
      service.getDetails({ placeId, fields: ['geometry'] }, (place: any, status: string) => {
        if (status === 'OK' && place?.geometry?.location) {
          resolve({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() })
        } else {
          resolve(null)
        }
      })
    })
  }

  function handleDestinationChange(val: string) {
    setDestination(val)
    setDestinationData(null)
    if (autocompleteTimeout.current) clearTimeout(autocompleteTimeout.current)
    autocompleteTimeout.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  async function selectSuggestion(s: PlaceSuggestion) {
    setDestination(s.description)
    setSuggestions([])
    const coords = await resolveLatLng(s.place_id)
    setDestinationData({ ...s, ...coords ?? {} })
  }

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const supabase = createClient()
    const path = `covers/${userId}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('covers').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('covers').getPublicUrl(path)
      setCoverUrl(data.publicUrl)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!destinationData) { setError('Please select a destination from the list'); return }
    if (!name.trim()) { setError('Trip name is required'); return }
    if (!startDate || !endDate) { setError('Please set travel dates'); return }
    if (endDate < startDate) { setError('End date must be after start date'); return }

    setSaving(true)
    setError('')
    const supabase = createClient()

    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .insert({
        name: name.trim(),
        destination_name: destinationData.description,
        destination_lat: destinationData.lat ?? null,
        destination_lng: destinationData.lng ?? null,
        start_date: startDate,
        end_date: endDate,
        cover_photo_url: coverUrl,
        created_by: userId,
      })
      .select('id')
      .single()

    if (tripErr || !trip) { setError(tripErr?.message ?? 'Failed to create trip'); setSaving(false); return }

    // Add creator as owner
    await supabase.from('trip_members').insert({ trip_id: trip.id, user_id: userId, role: 'owner' })

    // Create default permissions
    await supabase.from('trip_permissions').insert({ trip_id: trip.id })

    router.push(`/trips/${trip.id}`)
  }

  return (
    <>
      {/* Load Google Maps JS API */}
      <script
        async
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-5 pt-12 pb-24 max-w-sm mx-auto"
      >
        <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground text-sm mb-6 -ml-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold mb-6">New trip ✈️</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cover photo */}
          <div>
            <label className="text-sm font-medium block mb-2">Cover photo <span className="text-muted-foreground font-normal">(optional)</span></label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-36 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 overflow-hidden relative active:scale-[0.98] transition-transform"
            >
              {coverUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCoverUrl(null) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tap to add a cover photo</span>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
          </div>

          {/* Trip name */}
          <div>
            <label className="text-sm font-medium block mb-1">Trip name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lanzarote June 2026"
              required
              className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
            />
          </div>

          {/* Destination */}
          <div className="relative">
            <label className="text-sm font-medium block mb-1">Destination</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                placeholder="Search for a city…"
                required
                className="w-full h-12 pl-9 pr-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
              />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s.place_id}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-muted active:bg-muted border-b border-border last:border-0"
                  >
                    {s.description}
                  </button>
                ))}
              </div>
            )}
            {destinationData && (
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location confirmed
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Depart</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate('') }}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full h-12 px-3 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Return</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate || new Date().toISOString().split('T')[0]}
                className="w-full h-12 px-3 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform mt-2"
          >
            {saving ? 'Creating trip…' : 'Create trip'}
          </button>
        </form>
      </motion.div>
    </>
  )
}
