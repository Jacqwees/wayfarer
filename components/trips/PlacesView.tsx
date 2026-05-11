'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Search, Star, DollarSign, Heart, HeartOff, CalendarPlus, X, Loader2, MapPin } from 'lucide-react'
import Script from 'next/script'
import { savePlace, removePlace, addPlaceToItinerary } from '@/app/actions/places'

type Place = {
  id: string
  google_place_id: string
  name: string
  category: 'eat' | 'drink' | 'activity' | 'sight' | 'other'
  lat: number
  lng: number
  price_level: number | null
  rating: number | null
  photo_url: string | null
  added_to_itinerary: boolean
  added_by: string
}

type Props = {
  tripId: string
  savedPlaces: Place[]
  destination: { name: string; lat: number | null; lng: number | null }
  days: string[]
}

const categories = [
  { key: 'all', label: 'All' },
  { key: 'eat', label: '🍽 Eat' },
  { key: 'drink', label: '🍸 Drink' },
  { key: 'activity', label: '🎭 Activity' },
  { key: 'sight', label: '🏛 Sight' },
  { key: 'other', label: '📍 Other' },
] as const

const googleCategoryMap: Record<string, Place['category']> = {
  restaurant: 'eat', cafe: 'eat', bakery: 'eat', food: 'eat',
  bar: 'drink', night_club: 'drink',
  museum: 'sight', tourist_attraction: 'sight', church: 'sight', park: 'sight',
  amusement_park: 'activity', gym: 'activity', spa: 'activity',
}

function getPriceSymbol(level: number | null) {
  if (!level) return null
  return '£'.repeat(level)
}

function formatDay(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

type SearchResult = {
  place_id: string
  name: string
  formatted_address?: string
  geometry: { location: { lat: () => number; lng: () => number } }
  rating?: number
  price_level?: number
  types?: string[]
  photos?: { getUrl: (opts: any) => string }[]
}

export default function PlacesView({ tripId, savedPlaces: initial, destination, days }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mapsReady, setMapsReady] = useState(false)
  const [filter, setFilter] = useState<'all' | Place['category']>('all')
  const [savedPlaces, setSavedPlaces] = useState(initial)
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [addItinPlace, setAddItinPlace] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState(days[0] ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const serviceRef = useRef<any>(null)

  useEffect(() => {
    if (mapsReady && !serviceRef.current) {
      serviceRef.current = new (window as any).google.maps.places.PlacesService(document.createElement('div'))
    }
  }, [mapsReady])

  function doSearch() {
    if (!serviceRef.current || !query.trim()) return
    setSearching(true)
    setResults([])
    const location = destination.lat && destination.lng
      ? new (window as any).google.maps.LatLng(destination.lat, destination.lng)
      : undefined
    serviceRef.current.textSearch({
      query: query.trim(),
      location,
      radius: 30000,
    }, (res: SearchResult[], status: string) => {
      setSearching(false)
      if (status === 'OK') setResults(res.slice(0, 20))
    })
  }

  function inferCategory(types?: string[]): Place['category'] {
    for (const t of (types ?? [])) {
      if (googleCategoryMap[t]) return googleCategoryMap[t]
    }
    return 'other'
  }

  function handleSave(r: SearchResult) {
    const photoUrl = r.photos?.[0]?.getUrl({ maxWidth: 400 }) ?? null
    startTransition(async () => {
      const res = await savePlace(tripId, {
        google_place_id: r.place_id,
        name: r.name,
        category: inferCategory(r.types),
        lat: r.geometry.location.lat(),
        lng: r.geometry.location.lng(),
        price_level: r.price_level ?? null,
        rating: r.rating ?? null,
        photo_url: photoUrl,
      })
      if (!res.error) {
        setSavedPlaces(p => [...p, {
          id: Math.random().toString(),
          google_place_id: r.place_id,
          name: r.name,
          category: inferCategory(r.types),
          lat: r.geometry.location.lat(),
          lng: r.geometry.location.lng(),
          price_level: r.price_level ?? null,
          rating: r.rating ?? null,
          photo_url: photoUrl,
          added_to_itinerary: false,
          added_by: '',
        }])
      }
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removePlace(tripId, id)
      setSavedPlaces(p => p.filter(x => x.id !== id))
    })
  }

  function handleAddToItinerary() {
    if (!addItinPlace || !selectedDay) return
    startTransition(async () => {
      await addPlaceToItinerary(tripId, addItinPlace, selectedDay)
      setSavedPlaces(p => p.map(x => x.id === addItinPlace ? { ...x, added_to_itinerary: true } : x))
      setAddItinPlace(null)
    })
  }

  const savedIds = new Set(savedPlaces.map(p => p.google_place_id))
  const filtered = savedPlaces.filter(p => filter === 'all' || p.category === filter)

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

        <h1 className="text-2xl font-bold mb-1">Things To Do</h1>
        <p className="text-sm text-muted-foreground mb-5">near <span className="font-medium text-foreground">{destination.name}</span></p>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Search restaurants, museums…"
            disabled={!mapsReady}
            className="w-full h-12 pl-10 pr-20 rounded-2xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
          <button onClick={doSearch} disabled={!mapsReady || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary disabled:opacity-40">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Search results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-card border border-border rounded-2xl overflow-hidden mb-6 shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground">{results.length} results</span>
                <button onClick={() => setResults([])}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {results.map(r => {
                  const saved = savedIds.has(r.place_id)
                  return (
                    <div key={r.place_id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        {r.formatted_address && <p className="text-xs text-muted-foreground truncate">{r.formatted_address}</p>}
                        <div className="flex items-center gap-2 mt-0.5">
                          {r.rating && <span className="text-xs text-amber-500 flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-500" />{r.rating}</span>}
                          {r.price_level && <span className="text-xs text-muted-foreground">{getPriceSymbol(r.price_level ?? null)}</span>}
                        </div>
                      </div>
                      <button onClick={() => saved ? null : handleSave(r)} disabled={saved || isPending}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${saved ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}>
                        {saved ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1 scrollbar-none">
          {categories.map(c => (
            <button key={c.key} onClick={() => setFilter(c.key as any)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === c.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Saved places */}
        {filtered.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl px-4 py-12 text-center">
            <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {savedPlaces.length === 0 ? 'Search for places to save them here' : 'No saved places in this category'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden flex">
                {p.photo_url && (
                  <img src={p.photo_url} alt="" className="w-20 h-20 object-cover shrink-0" />
                )}
                <div className="flex-1 px-4 py-3 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 mb-2">
                    {p.rating && <span className="text-xs text-amber-500 flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-500" />{p.rating}</span>}
                    {p.price_level && <span className="text-xs text-muted-foreground">{getPriceSymbol(p.price_level)}</span>}
                    <span className="text-xs text-muted-foreground capitalize">{p.category}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setAddItinPlace(p.id); setSelectedDay(days[0] ?? '') }}
                      disabled={p.added_to_itinerary}
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${p.added_to_itinerary ? 'text-muted-foreground bg-muted' : 'text-primary bg-primary/10'}`}>
                      <CalendarPlus className="w-3 h-3" />
                      {p.added_to_itinerary ? 'Added' : 'Add to itinerary'}
                    </button>
                    <button onClick={() => handleRemove(p.id)} disabled={isPending}
                      className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-destructive bg-destructive/10 transition-colors">
                      <HeartOff className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add to itinerary picker */}
        <AnimatePresence>
          {addItinPlace && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] flex items-end"
              onClick={() => setAddItinPlace(null)}>
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="bg-card w-full rounded-t-3xl p-6 max-w-mobile mx-auto"
                onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-4">Add to which day?</h2>
                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                  {days.map(d => (
                    <button key={d} onClick={() => setSelectedDay(d)}
                      className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium text-left transition-colors ${selectedDay === d ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background'}`}>
                      {formatDay(d)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setAddItinPlace(null)} className="flex-1 h-12 rounded-2xl border border-border text-sm font-medium">Cancel</button>
                  <button onClick={handleAddToItinerary} disabled={isPending}
                    className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">Add</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
