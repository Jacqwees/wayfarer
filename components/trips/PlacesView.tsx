'use client'

import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Heart, CalendarPlus, X, Loader2, MapPin, Navigation, Clock } from 'lucide-react'
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
  hotelLat?: number | null
  hotelLng?: number | null
  days: string[]
}

type NearbyResult = {
  place_id: string
  name: string
  vicinity?: string
  geometry: { location: { lat: () => number; lng: () => number } }
  rating?: number
  price_level?: number
  types?: string[]
  photos?: { getUrl: (opts: { maxWidth: number }) => string }[]
  opening_hours?: { open_now?: boolean }
  marker?: google.maps.Marker
}

const CATEGORY_TABS = [
  { key: 'all',      label: 'All',        icon: '◐', types: [] },
  { key: 'eat',      label: 'Food',       icon: '◉', types: ['restaurant', 'cafe', 'bakery'] },
  { key: 'drink',    label: 'Drinks',     icon: '☾', types: ['bar', 'night_club'] },
  { key: 'activity', label: 'Activities', icon: '◢', types: ['tourist_attraction', 'amusement_park', 'gym', 'spa', 'bowling_alley'] },
  { key: 'sight',    label: 'Sights',     icon: '★', types: ['museum', 'art_gallery', 'church', 'park', 'beach'] },
] as const

const CATEGORY_COLORS: Record<string, string> = {
  eat: '#E0533A', drink: '#5B7556', activity: '#D9923B', sight: '#6FA4C2', other: '#E89AAE',
}

function priceSymbol(level: number | null) {
  if (!level) return null
  return '£'.repeat(level)
}

function formatDay(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function inferCategory(types?: string[]): Place['category'] {
  const map: Record<string, Place['category']> = {
    restaurant: 'eat', cafe: 'eat', bakery: 'eat', food: 'eat',
    bar: 'drink', night_club: 'drink',
    museum: 'sight', tourist_attraction: 'sight', church: 'sight', park: 'sight', beach: 'sight', art_gallery: 'sight',
    amusement_park: 'activity', gym: 'activity', spa: 'activity', bowling_alley: 'activity',
  }
  for (const t of (types ?? [])) {
    if (map[t]) return map[t]
  }
  return 'other'
}

declare global {
  interface Window { google: typeof google }
}

export default function PlacesView({ tripId, savedPlaces: initial, destination, hotelLat, hotelLng, days }: Props) {
  const [isPending, startTransition] = useTransition()
  const [mapsReady, setMapsReady] = useState(false)
  const [activeTab, setActiveTab] = useState<typeof CATEGORY_TABS[number]['key']>('all')
  const [savedPlaces, setSavedPlaces] = useState(initial)
  const [nearbyResults, setNearbyResults] = useState<NearbyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<NearbyResult | null>(null)
  const [query, setQuery] = useState('')
  const [addItinPlace, setAddItinPlace] = useState<{ id: string; name: string } | null>(null)
  const [selectedDay, setSelectedDay] = useState(days[0] ?? '')
  const [selectedTime, setSelectedTime] = useState('10:00')
  const [searchMode, setSearchMode] = useState(false)
  const [searchResults, setSearchResults] = useState<NearbyResult[]>([])

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Centre on hotel if available, otherwise destination
  const centerLat = hotelLat ?? destination.lat
  const centerLng = hotelLng ?? destination.lng

  const savedIds = new Set(savedPlaces.map(p => p.google_place_id))

  // Init map once Maps API loads
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return
    if (!centerLat || !centerLng) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { elementType: 'geometry', stylers: [{ color: '#F4EDE0' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#5C544A' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FCF8EE' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C9E8F5' }] },
        { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#EBE2D1' }] },
      ],
    })
    mapInstanceRef.current = map
    serviceRef.current = new window.google.maps.places.PlacesService(map)

    // Hotel/destination pin
    new window.google.maps.Marker({
      position: { lat: centerLat, lng: centerLng },
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#1B1A18',
        fillOpacity: 1,
        strokeColor: '#FCF8EE',
        strokeWeight: 2,
      },
      title: hotelLat ? 'Your hotel' : destination.name,
      zIndex: 10,
    })

    // Load initial "All" nearby
    doNearbySearch(map, 'all')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady])

  function clearMarkers() {
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
  }

  const doNearbySearch = useCallback((map: google.maps.Map, tab: typeof CATEGORY_TABS[number]['key']) => {
    if (!serviceRef.current || !centerLat || !centerLng) return
    const tabDef = CATEGORY_TABS.find(t => t.key === tab)
    const types = tabDef?.types ?? []
    const keyword = tab === 'all' ? undefined : tabDef?.label

    setLoading(true)
    clearMarkers()
    setNearbyResults([])
    setSelectedPlace(null)

    const request: google.maps.places.PlaceSearchRequest = {
      location: new window.google.maps.LatLng(centerLat, centerLng),
      radius: 1500,
      ...(types.length ? { type: types[0] as string } : {}),
      ...(keyword ? { keyword } : {}),
    }

    serviceRef.current.nearbySearch(request, (results, status) => {
      setLoading(false)
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) return

      const top = results.slice(0, 20)
      setNearbyResults(top as NearbyResult[])

      // Drop markers
      top.forEach(place => {
        if (!place.geometry?.location) return
        const cat = inferCategory(place.types)
        const color = CATEGORY_COLORS[cat] ?? '#928873'
        const pos = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        const placeId = place.place_id ?? ''
        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          title: place.name ?? '',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: savedIds.has(placeId) ? 8 : 6,
            fillColor: savedIds.has(placeId) ? '#E0533A' : color,
            fillOpacity: 0.9,
            strokeColor: '#FCF8EE',
            strokeWeight: 1.5,
          },
          zIndex: savedIds.has(placeId) ? 5 : 1,
        })
        marker.addListener('click', () => {
          setSelectedPlace({ ...(place as NearbyResult), marker })
          map.panTo(pos)
        })
        markersRef.current.push(marker)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLat, centerLng])

  function handleTabChange(tab: typeof CATEGORY_TABS[number]['key']) {
    setActiveTab(tab)
    setSearchMode(false)
    setQuery('')
    if (mapInstanceRef.current) {
      doNearbySearch(mapInstanceRef.current, tab)
    }
  }

  function doSearch() {
    if (!serviceRef.current || !query.trim() || !centerLat || !centerLng) return
    setLoading(true)
    setSearchResults([])
    setSearchMode(true)
    clearMarkers()
    serviceRef.current.textSearch(
      { query: query.trim(), location: new window.google.maps.LatLng(centerLat, centerLng), radius: 5000 },
      (results, status) => {
        setLoading(false)
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) return
        const top = results.slice(0, 20) as NearbyResult[]
        setSearchResults(top)
        top.forEach(place => {
          if (!place.geometry?.location) return
          const cat = inferCategory(place.types)
          const pos = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
          const marker = new window.google.maps.Marker({
            position: pos,
            map: mapInstanceRef.current!,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: CATEGORY_COLORS[cat] ?? '#928873',
              fillOpacity: 0.9,
              strokeColor: '#FCF8EE',
              strokeWeight: 1.5,
            },
          })
          marker.addListener('click', () => {
            setSelectedPlace(place)
            mapInstanceRef.current?.panTo(pos)
          })
          markersRef.current.push(marker)
        })
      }
    )
  }

  function handleSave(r: NearbyResult) {
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
        // Update marker to coral
        if (r.marker) {
          r.marker.setIcon({
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#E0533A',
            fillOpacity: 0.9,
            strokeColor: '#FCF8EE',
            strokeWeight: 1.5,
          })
          r.marker.setZIndex(5)
        }
      }
    })
  }

  function handleRemove(id: string, gid: string) {
    startTransition(async () => {
      await removePlace(tripId, id)
      setSavedPlaces(p => p.filter(x => x.id !== id))
      // If this was the selected place, clear selection
      if (selectedPlace?.place_id === gid) setSelectedPlace(null)
    })
  }

  function handleAddToItinerary() {
    if (!addItinPlace || !selectedDay) return
    startTransition(async () => {
      await addPlaceToItinerary(tripId, addItinPlace.id, selectedDay, selectedTime)
      setSavedPlaces(p => p.map(x => x.id === addItinPlace.id ? { ...x, added_to_itinerary: true } : x))
      setAddItinPlace(null)
    })
  }

  const displayList = searchMode ? searchResults : nearbyResults
  const savedInList = displayList.filter(r => savedIds.has(r.place_id))
  const unsavedInList = displayList.filter(r => !savedIds.has(r.place_id))
  const sortedList = [...savedInList, ...unsavedInList]

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setMapsReady(true)}
        strategy="lazyOnload"
      />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
        className="min-h-screen bg-background flex flex-col pb-28">

        {/* Header */}
        <div className="px-5 pt-14 pb-3">
          <p className="eyebrow mb-0.5">near {destination.name.split(',')[0]}</p>
          <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">Discover</h1>
        </div>

        {/* Search bar */}
        <div className="px-4 mb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef} value={query}
              onChange={e => { setQuery(e.target.value); if (!e.target.value) { setSearchMode(false); if (mapInstanceRef.current) doNearbySearch(mapInstanceRef.current, activeTab) } }}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Search bars, beaches, museums…"
              disabled={!mapsReady}
              className="w-full h-11 pl-10 pr-20 rounded-full border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            {query ? (
              <button onClick={doSearch} disabled={!mapsReady || !query.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary disabled:opacity-40 flex items-center gap-1">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
              </button>
            ) : null}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
          {CATEGORY_TABS.map(c => (
            <button key={c.key} onClick={() => handleTabChange(c.key)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: activeTab === c.key ? 'hsl(var(--foreground))' : 'hsl(var(--card))',
                color: activeTab === c.key ? 'hsl(var(--background))' : 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="px-4 mb-3">
          <div className="relative rounded-2xl overflow-hidden" style={{ height: 220 }}>
            {!centerLat && (
              <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Set a destination to see the map</p>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
            {!mapsReady && centerLat && (
              <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {/* Map legend */}
            {mapsReady && (
              <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-foreground inline-block" />
                  {hotelLat ? 'Hotel' : 'Area'}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-primary">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                  Saved
                </span>
              </div>
            )}
            {loading && (
              <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                <span className="text-[10px] font-mono text-muted-foreground">Loading…</span>
              </div>
            )}
          </div>
        </div>

        {/* Selected place detail card */}
        <AnimatePresence>
          {selectedPlace && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="mx-4 mb-3 bg-card border border-border rounded-2xl overflow-hidden shadow-lg"
            >
              {selectedPlace.photos?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedPlace.photos[0].getUrl({ maxWidth: 600 })} alt="" className="w-full h-32 object-cover" />
              )}
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-display italic text-[18px] leading-tight truncate">{selectedPlace.name}</p>
                    {selectedPlace.vicinity && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{selectedPlace.vicinity}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[11px]">
                      {selectedPlace.rating && (
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500" />{selectedPlace.rating}
                        </span>
                      )}
                      {selectedPlace.price_level && (
                        <span className="text-muted-foreground">{priceSymbol(selectedPlace.price_level)}</span>
                      )}
                      {selectedPlace.opening_hours?.open_now !== undefined && (
                        <span className={selectedPlace.opening_hours.open_now ? 'text-emerald-500' : 'text-destructive'}>
                          {selectedPlace.opening_hours.open_now ? 'Open now' : 'Closed'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedPlace(null)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  {savedIds.has(selectedPlace.place_id) ? (
                    <>
                      <button
                        onClick={() => {
                          const saved = savedPlaces.find(p => p.google_place_id === selectedPlace.place_id)
                          if (saved) handleRemove(saved.id, saved.google_place_id)
                        }}
                        className="flex-1 h-9 rounded-full border border-border text-xs font-medium flex items-center justify-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-primary fill-primary" /> Saved
                      </button>
                      <button
                        onClick={() => {
                          const saved = savedPlaces.find(p => p.google_place_id === selectedPlace.place_id)
                          if (saved) setAddItinPlace({ id: saved.id, name: saved.name })
                        }}
                        className="flex-1 h-9 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97]">
                        <CalendarPlus className="w-3.5 h-3.5" /> Add to plan
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleSave(selectedPlace)} disabled={isPending}
                      className="flex-1 h-9 rounded-full bg-foreground text-background text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] disabled:opacity-50">
                      <Heart className="w-3.5 h-3.5" /> Save place
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results list */}
        <div className="px-4">
          {sortedList.length === 0 && !loading ? (
            <div className="border border-dashed border-border rounded-xl px-4 py-10 text-center">
              <Navigation className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {!mapsReady ? 'Loading map…' : !centerLat ? 'Add a destination to discover places' : 'No places found nearby'}
              </p>
            </div>
          ) : (
            <>
              {sortedList.length > 0 && (
                <p className="eyebrow mb-2">{searchMode ? 'Search results' : `Nearby · ${sortedList.length}`}</p>
              )}
              <div className="space-y-0">
                {sortedList.map((r, i) => {
                  const saved = savedIds.has(r.place_id)
                  const cat = inferCategory(r.types)
                  const savedRecord = savedPlaces.find(p => p.google_place_id === r.place_id)
                  return (
                    <motion.div
                      key={r.place_id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      onClick={() => { setSelectedPlace(r); if (r.geometry?.location) mapInstanceRef.current?.panTo({ lat: r.geometry.location.lat(), lng: r.geometry.location.lng() }) }}
                      className="flex items-center gap-3 py-3 border-b border-dashed border-border last:border-0 cursor-pointer active:bg-secondary/40 rounded-lg -mx-1 px-1 transition-colors"
                    >
                      {/* Photo or category dot */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
                        {r.photos?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.photos[0].getUrl({ maxWidth: 100 })} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span style={{ color: CATEGORY_COLORS[cat] }} className="text-lg">{CATEGORY_TABS.find(c => c.key === cat)?.icon ?? '●'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate leading-tight">{r.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-muted-foreground">
                          {r.rating && <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{r.rating}</span>}
                          {r.price_level && <span>{priceSymbol(r.price_level)}</span>}
                          {r.opening_hours?.open_now !== undefined && (
                            <span className={r.opening_hours.open_now ? 'text-emerald-500' : 'text-destructive/70'}>
                              {r.opening_hours.open_now ? 'Open' : 'Closed'}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); saved && savedRecord ? handleRemove(savedRecord.id, savedRecord.google_place_id) : handleSave(r) }}
                        disabled={isPending}
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
                        style={{ background: saved ? 'rgba(224,83,58,0.1)' : 'hsl(var(--secondary))' }}>
                        <Heart className={`w-3.5 h-3.5 ${saved ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </>
          )}

          {/* Saved places section (when viewing a filtered category) */}
          {savedPlaces.length > 0 && !searchMode && (
            <div className="mt-6">
              <p className="eyebrow mb-2">Saved · {savedPlaces.length}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {savedPlaces.map(p => (
                  <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="h-24 relative" style={{ background: 'hsl(var(--secondary))' }}>
                      {p.photo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button onClick={() => handleRemove(p.id, p.google_place_id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center">
                        <Heart className="w-3 h-3 text-primary fill-primary" />
                      </button>
                      <div className="absolute bottom-1.5 left-2 font-mono text-[9px] text-white bg-black/40 px-1.5 py-0.5 rounded tracking-[0.08em] capitalize">
                        {p.category}
                      </div>
                    </div>
                    <div className="px-2.5 py-2.5">
                      <p className="font-semibold text-[12.5px] text-foreground truncate">{p.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        {priceSymbol(p.price_level) ?? '—'}
                        {p.rating ? ` · ★ ${p.rating}` : ''}
                      </p>
                      <button
                        onClick={() => setAddItinPlace({ id: p.id, name: p.name })}
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
        </div>

        {/* Add to itinerary sheet */}
        <AnimatePresence>
          {addItinPlace && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] flex items-end"
              onClick={() => setAddItinPlace(null)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                className="bg-card w-full rounded-t-[28px] p-6"
                onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
                <p className="eyebrow mb-1">Add to plan</p>
                <h2 className="font-display italic text-[20px] mb-4 leading-tight">{addItinPlace.name}</h2>

                {/* Day picker */}
                <p className="eyebrow mb-2">Which day?</p>
                <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto">
                  {days.map(d => (
                    <button key={d} onClick={() => setSelectedDay(d)}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors"
                      style={{
                        background: selectedDay === d ? 'hsl(var(--foreground))' : 'hsl(var(--background))',
                        color: selectedDay === d ? 'hsl(var(--background))' : 'hsl(var(--foreground))',
                        borderColor: selectedDay === d ? 'hsl(var(--foreground))' : 'hsl(var(--border))',
                      }}>
                      {formatDay(d)}
                    </button>
                  ))}
                </div>

                {/* Time picker */}
                <p className="eyebrow mb-2">What time?</p>
                <div className="flex items-center gap-2 mb-5 bg-background border border-border rounded-xl px-4 h-12">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="time" value={selectedTime}
                    onChange={e => setSelectedTime(e.target.value)}
                    className="flex-1 bg-transparent text-foreground text-sm font-medium outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setAddItinPlace(null)}
                    className="flex-1 h-12 rounded-full border border-border text-sm font-medium">Cancel</button>
                  <button onClick={handleAddToItinerary} disabled={isPending}
                    className="flex-1 h-12 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform">
                    Add to itinerary
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
