'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Heart, CalendarPlus, X, Loader2, MapPin } from 'lucide-react'
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
  { key: 'eat', label: '◉ Food' },
  { key: 'drink', label: '☾ Drinks' },
  { key: 'activity', label: '◢ Activity' },
  { key: 'sight', label: '★ Sights' },
  { key: 'other', label: '◐ Other' },
] as const

const googleCategoryMap: Record<string, Place['category']> = {
  restaurant: 'eat', cafe: 'eat', bakery: 'eat', food: 'eat',
  bar: 'drink', night_club: 'drink',
  museum: 'sight', tourist_attraction: 'sight', church: 'sight', park: 'sight',
  amusement_park: 'activity', gym: 'activity', spa: 'activity',
}

function priceSymbol(level: number | null) {
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
    serviceRef.current.textSearch({ query: query.trim(), location, radius: 30000 }, (res: SearchResult[], status: string) => {
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
        google_place_id: r.place_id, name: r.name,
        category: inferCategory(r.types),
        lat: r.geometry.location.lat(), lng: r.geometry.location.lng(),
        price_level: r.price_level ?? null, rating: r.rating ?? null, photo_url: photoUrl,
      })
      if (!res.error) {
        setSavedPlaces(p => [...p, {
          id: Math.random().toString(), google_place_id: r.place_id, name: r.name,
          category: inferCategory(r.types),
          lat: r.geometry.location.lat(), lng: r.geometry.location.lng(),
          price_level: r.price_level ?? null, rating: r.rating ?? null,
          photo_url: photoUrl, added_to_itinerary: false, added_by: '',
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

  // Featured = first place with a photo
  const featured = filtered.find(p => p.photo_url)
  const grid = filter === 'all' && featured ? filtered : filtered

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setMapsReady(true)}
        strategy="lazyOnload"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="min-h-screen bg-background pb-32"
      >
        {/* Header */}
        <div className="px-5 pt-14 pb-3">
          <p className="eyebrow mb-0.5">near {destination.name.split(',')[0]}</p>
          <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">Things to do</h1>
        </div>

        {/* Search */}
        <div className="px-4 mb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Search restaurants, museums…"
              disabled={!mapsReady}
              className="w-full h-12 pl-10 pr-20 rounded-full border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            <button onClick={doSearch} disabled={!mapsReady || !query.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary disabled:opacity-40">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Search results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mx-4 bg-card border border-border rounded-xl overflow-hidden mb-4 shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="eyebrow">{results.length} results</span>
                <button onClick={() => setResults([])}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {results.map(r => {
                  const saved = savedIds.has(r.place_id)
                  return (
                    <div key={r.place_id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        {r.formatted_address && <p className="text-xs text-muted-foreground truncate">{r.formatted_address}</p>}
                        <div className="flex items-center gap-2 mt-0.5">
                          {r.rating && <span className="text-xs text-amber-500 flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-500" />{r.rating}</span>}
                          {r.price_level && <span className="text-xs text-muted-foreground">{priceSymbol(r.price_level ?? null)}</span>}
                        </div>
                      </div>
                      <button onClick={() => saved ? null : handleSave(r)} disabled={saved || isPending}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${saved ? 'bg-secondary text-muted-foreground' : 'bg-primary text-primary-foreground'}`}>
                        {saved ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none mb-2">
          {categories.map(c => (
            <button key={c.key} onClick={() => setFilter(c.key as any)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === c.key
                  ? 'bg-foreground text-background'
                  : 'bg-card border border-border text-foreground'
              }`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Featured card */}
        {featured && filter === 'all' && (
          <div className="px-4 mb-3">
            <div className="h-44 rounded-xl relative overflow-hidden" style={{ background: 'hsl(var(--secondary))' }}>
              {featured.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured.photo_url} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.65) 100%)' }} />
              <div className="absolute top-3 left-3">
                <span className="font-mono text-[9px] text-white/90 tracking-[0.1em] bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">● recommended</span>
              </div>
              <button
                onClick={() => handleRemove(featured.id)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform">
                <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
              </button>
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <p className="font-display italic text-[22px] leading-tight">{featured.name}</p>
                <div className="flex gap-2 mt-1.5 font-mono text-[11px] text-white/85 tracking-[0.1em]">
                  {featured.rating && <span>★ {featured.rating}</span>}
                  {featured.rating && (featured.price_level || featured.category) && <span>·</span>}
                  {featured.price_level && <span>{priceSymbol(featured.price_level)}</span>}
                  <span>·</span>
                  <span className="capitalize">{featured.category}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Saved places */}
        {filtered.length === 0 ? (
          <div className="px-4">
            <div className="border border-dashed border-border rounded-xl px-4 py-12 text-center">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {savedPlaces.length === 0 ? 'Search for places to save them here' : 'No saved places in this category'}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-4">
            <div className="flex items-baseline justify-between mb-3">
              <p className="eyebrow">Saved · {filtered.length}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {grid.map(p => (
                <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="h-24 relative" style={{ background: 'hsl(var(--secondary))' }}>
                    {p.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center">
                      <Heart className="w-3 h-3 text-primary fill-primary" />
                    </button>
                    <div className="absolute bottom-1.5 left-2 font-mono text-[9px] text-white bg-black/40 px-1.5 py-0.5 rounded tracking-[0.08em]">
                      ● {p.category}
                    </div>
                  </div>
                  <div className="px-2.5 py-2.5">
                    <p className="font-semibold text-[12.5px] text-foreground truncate tracking-[-0.01em]">{p.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5 tracking-[0.05em]">
                      {priceSymbol(p.price_level) ?? '—'}
                      {p.rating ? ` · ★ ${p.rating}` : ''}
                    </p>
                    <button
                      onClick={() => { setAddItinPlace(p.id); setSelectedDay(days[0] ?? '') }}
                      disabled={p.added_to_itinerary}
                      className={`mt-2 flex items-center gap-1 text-[10px] font-medium ${p.added_to_itinerary ? 'text-muted-foreground' : 'text-primary'}`}>
                      <CalendarPlus className="w-3 h-3" />
                      {p.added_to_itinerary ? 'Added' : 'Add to plan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add to itinerary picker */}
        <AnimatePresence>
          {addItinPlace && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] flex items-end"
              onClick={() => setAddItinPlace(null)}>
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                className="bg-card w-full rounded-t-[28px] p-6"
                onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
                <h2 className="font-display italic text-[22px] mb-4">Add to which day?</h2>
                <div className="space-y-2 mb-5 max-h-60 overflow-y-auto">
                  {days.map(d => (
                    <button key={d} onClick={() => setSelectedDay(d)}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-left transition-colors ${selectedDay === d ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background'}`}>
                      {formatDay(d)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setAddItinPlace(null)} className="flex-1 h-12 rounded-full border border-border text-sm font-medium">Cancel</button>
                  <button onClick={handleAddToItinerary} disabled={isPending}
                    className="flex-1 h-12 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform">Add</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
