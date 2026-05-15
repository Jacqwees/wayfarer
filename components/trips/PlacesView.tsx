'use client'

import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Star, Heart, CalendarPlus, X, Loader2, MapPin,
  Navigation, Clock, Bus, Footprints,
} from 'lucide-react'
import Script from 'next/script'
import { savePlace, removePlace, addPlaceToItinerary } from '@/app/actions/places'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// Unified card type used by the detail panel
type CardPlace = {
  google_place_id: string
  name: string
  lat: number
  lng: number
  rating: number | null
  price_level: number | null
  photo_url: string | null
  open_now: boolean | null
  vicinity: string | null
  types: string[]
  savedRecord: Place | null
}

type WalkInfo = {
  walkDuration: string
  walkDistance: string
  transitDuration?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ~5 km/h walking speed
function walkEstimate(km: number): { text: string; busNeeded: boolean } {
  const mins = Math.round(km / 5 * 60)
  if (mins <= 2) return { text: '< 2 min walk', busNeeded: false }
  const distStr = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
  if (mins <= 20) return { text: `~${mins} min walk · ${distStr}`, busNeeded: false }
  return { text: `~${mins} min walk · ${distStr}`, busNeeded: true }
}

function nearbyToCard(r: NearbyResult, savedPlaces: Place[]): CardPlace {
  const lat = r.geometry.location.lat()
  const lng = r.geometry.location.lng()
  return {
    google_place_id: r.place_id,
    name: r.name,
    lat, lng,
    rating: r.rating ?? null,
    price_level: r.price_level ?? null,
    photo_url: r.photos?.[0]?.getUrl({ maxWidth: 600 }) ?? null,
    open_now: r.opening_hours?.open_now ?? null,
    vicinity: r.vicinity ?? null,
    types: r.types ?? [],
    savedRecord: savedPlaces.find(p => p.google_place_id === r.place_id) ?? null,
  }
}

function savedToCard(p: Place): CardPlace {
  return {
    google_place_id: p.google_place_id,
    name: p.name,
    lat: p.lat, lng: p.lng,
    rating: p.rating,
    price_level: p.price_level,
    photo_url: p.photo_url,
    open_now: null,
    vicinity: null,
    types: [p.category],
    savedRecord: p,
  }
}

declare global {
  interface Window { google: typeof google }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlacesView({ tripId, savedPlaces: initial, destination, hotelLat, hotelLng, days }: Props) {
  const [isPending, startTransition] = useTransition()
  const [mapsReady, setMapsReady] = useState(false)

  // Mode
  const [viewMode, setViewMode] = useState<'discover' | 'saved'>('discover')

  // Discover state
  const [activeTab, setActiveTab] = useState<typeof CATEGORY_TABS[number]['key']>('all')
  const [nearbyResults, setNearbyResults] = useState<NearbyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState(false)
  const [searchResults, setSearchResults] = useState<NearbyResult[]>([])

  // Shared state
  const [savedPlaces, setSavedPlaces] = useState(initial)
  const [detailCard, setDetailCard] = useState<CardPlace | null>(null)
  const [addItinPlace, setAddItinPlace] = useState<{ id: string; name: string } | null>(null)
  const [selectedDay, setSelectedDay] = useState(days[0] ?? '')
  const [selectedTime, setSelectedTime] = useState('10:00')

  // Walk info
  const [walkInfo, setWalkInfo] = useState<WalkInfo | null>(null)
  const [loadingWalk, setLoadingWalk] = useState(false)

  // Map refs
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])        // nearby markers
  const savedMarkersRef = useRef<google.maps.Marker[]>([])   // saved mode markers
  const routeLineRef = useRef<google.maps.Polyline | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const centerLat = hotelLat ?? destination.lat
  const centerLng = hotelLng ?? destination.lng

  const savedIds = new Set(savedPlaces.map(p => p.google_place_id))

  // ─── Map init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return
    if (!centerLat || !centerLng) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: 15,
      disableDefaultUI: true,
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

    // Hotel / destination anchor pin
    new window.google.maps.Marker({
      position: { lat: centerLat, lng: centerLng },
      map,
      title: hotelLat ? 'Your hotel' : destination.name,
      zIndex: 20,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: '#1B1A18',
        fillOpacity: 1,
        strokeColor: '#FCF8EE',
        strokeWeight: 2.5,
      },
      label: {
        text: hotelLat ? 'H' : '●',
        color: '#FCF8EE',
        fontSize: '9px',
        fontWeight: 'bold',
      },
    })

    doNearbySearch(map, 'all')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady])

  // ─── Markers ─────────────────────────────────────────────────────────────────

  function clearMarkers() {
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
  }

  function clearSavedMarkers() {
    savedMarkersRef.current.forEach(m => m.setMap(null))
    savedMarkersRef.current = []
  }

  function clearRoute() {
    if (routeLineRef.current) { routeLineRef.current.setMap(null); routeLineRef.current = null }
  }

  function drawRoute(destLat: number, destLng: number) {
    if (!mapInstanceRef.current || !centerLat || !centerLng) return
    clearRoute()
    routeLineRef.current = new window.google.maps.Polyline({
      path: [
        { lat: centerLat, lng: centerLng },
        { lat: destLat, lng: destLng },
      ],
      map: mapInstanceRef.current,
      strokeColor: '#E0533A',
      strokeOpacity: 0,
      icons: [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.7, scale: 3, strokeColor: '#E0533A' },
        offset: '0',
        repeat: '12px',
      }],
    })
    // Fit both points in view
    const bounds = new window.google.maps.LatLngBounds()
    bounds.extend({ lat: centerLat, lng: centerLng })
    bounds.extend({ lat: destLat, lng: destLng })
    mapInstanceRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
  }

  // ─── Walk time ────────────────────────────────────────────────────────────────

  function fetchWalkInfo(destLat: number, destLng: number) {
    if (!centerLat || !centerLng || !window.google?.maps) return
    setLoadingWalk(true)
    setWalkInfo(null)

    const svc = new window.google.maps.DirectionsService()
    svc.route(
      { origin: { lat: centerLat, lng: centerLng }, destination: { lat: destLat, lng: destLng }, travelMode: window.google.maps.TravelMode.WALKING },
      (result, status) => {
        if (status === 'OK' && result?.routes[0]?.legs[0]) {
          const leg = result.routes[0].legs[0]
          const walkMins = Math.round((leg.duration?.value ?? 0) / 60)
          const walkDuration = leg.duration?.text ?? `${walkMins} min`
          const walkDistance = leg.distance?.text ?? ''

          if (walkMins > 20) {
            // Also check transit
            svc.route(
              { origin: { lat: centerLat!, lng: centerLng! }, destination: { lat: destLat, lng: destLng }, travelMode: window.google.maps.TravelMode.TRANSIT },
              (tr, ts) => {
                setLoadingWalk(false)
                let transitDuration: string | undefined
                if (ts === 'OK' && tr?.routes[0]?.legs[0]) {
                  const tMins = Math.round((tr.routes[0].legs[0].duration?.value ?? 0) / 60)
                  transitDuration = `${tMins} min by transit`
                }
                setWalkInfo({ walkDuration, walkDistance, transitDuration })
              }
            )
          } else {
            setLoadingWalk(false)
            setWalkInfo({ walkDuration, walkDistance })
          }
        } else {
          setLoadingWalk(false)
        }
      }
    )
  }

  // ─── Selection ────────────────────────────────────────────────────────────────

  function selectCard(card: CardPlace) {
    setDetailCard(card)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: card.lat, lng: card.lng })
    }
    if (centerLat && centerLng) {
      drawRoute(card.lat, card.lng)
      fetchWalkInfo(card.lat, card.lng)
    }
  }

  function clearSelection() {
    setDetailCard(null)
    setWalkInfo(null)
    setLoadingWalk(false)
    clearRoute()
    if (mapInstanceRef.current && centerLat && centerLng) {
      mapInstanceRef.current.panTo({ lat: centerLat, lng: centerLng })
      mapInstanceRef.current.setZoom(15)
    }
  }

  // ─── Mode switching ───────────────────────────────────────────────────────────

  function enterSavedMode() {
    clearMarkers()
    clearRoute()
    setDetailCard(null)
    setWalkInfo(null)
    clearSavedMarkers()

    if (mapInstanceRef.current) {
      savedPlaces.forEach(p => {
        const color = CATEGORY_COLORS[p.category] ?? '#928873'
        const marker = new window.google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map: mapInstanceRef.current!,
          title: p.name,
          zIndex: 5,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: '#FCF8EE',
            strokeWeight: 2,
          },
        })
        marker.addListener('click', () => selectCard(savedToCard(p)))
        savedMarkersRef.current.push(marker)
      })
      if (centerLat && centerLng) {
        mapInstanceRef.current.panTo({ lat: centerLat, lng: centerLng })
        mapInstanceRef.current.setZoom(savedPlaces.length > 0 ? 14 : 15)
      }
    }
  }

  function enterDiscoverMode() {
    clearSavedMarkers()
    clearRoute()
    setDetailCard(null)
    setWalkInfo(null)
    if (mapInstanceRef.current) {
      doNearbySearch(mapInstanceRef.current, activeTab)
    }
  }

  function handleModeChange(mode: 'discover' | 'saved') {
    if (mode === viewMode) return
    setViewMode(mode)
    if (mode === 'saved') enterSavedMode()
    else enterDiscoverMode()
  }

  // ─── Nearby search ────────────────────────────────────────────────────────────

  const doNearbySearch = useCallback((map: google.maps.Map, tab: typeof CATEGORY_TABS[number]['key']) => {
    if (!serviceRef.current || !centerLat || !centerLng) return
    const tabDef = CATEGORY_TABS.find(t => t.key === tab)
    const types = tabDef?.types ?? []

    setLoading(true)
    clearMarkers()
    setNearbyResults([])
    setDetailCard(null)
    setWalkInfo(null)
    clearRoute()

    const request: google.maps.places.PlaceSearchRequest = {
      location: new window.google.maps.LatLng(centerLat, centerLng),
      radius: 1500,
      ...(types.length ? { type: types[0] as string } : {}),
      ...(tab !== 'all' ? { keyword: tabDef?.label } : {}),
    }

    serviceRef.current.nearbySearch(request, (results, status) => {
      setLoading(false)
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) return

      const top = results.slice(0, 20)
      setNearbyResults(top as NearbyResult[])

      top.forEach(place => {
        if (!place.geometry?.location) return
        const cat = inferCategory(place.types)
        const color = CATEGORY_COLORS[cat] ?? '#928873'
        const isSaved = savedIds.has(place.place_id ?? '')
        const pos = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          title: place.name ?? '',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: isSaved ? 9 : 6,
            fillColor: isSaved ? '#E0533A' : color,
            fillOpacity: 0.9,
            strokeColor: '#FCF8EE',
            strokeWeight: 1.5,
          },
          zIndex: isSaved ? 5 : 1,
        })
        const r = place as NearbyResult
        marker.addListener('click', () => {
          selectCard(nearbyToCard({ ...r, marker }, savedPlaces))
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
    if (mapInstanceRef.current) doNearbySearch(mapInstanceRef.current, tab)
  }

  function doSearch() {
    if (!serviceRef.current || !query.trim() || !centerLat || !centerLng) return
    setLoading(true)
    setSearchResults([])
    setSearchMode(true)
    clearMarkers()
    clearRoute()
    setDetailCard(null)
    setWalkInfo(null)

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
            selectCard(nearbyToCard(place, savedPlaces))
            mapInstanceRef.current?.panTo(pos)
          })
          markersRef.current.push(marker)
        })
      }
    )
  }

  // ─── Save / remove ────────────────────────────────────────────────────────────

  function handleSaveFromCard(card: CardPlace) {
    startTransition(async () => {
      const res = await savePlace(tripId, {
        google_place_id: card.google_place_id,
        name: card.name,
        category: inferCategory(card.types),
        lat: card.lat,
        lng: card.lng,
        price_level: card.price_level,
        rating: card.rating,
        photo_url: card.photo_url,
      })
      if (!res.error) {
        const newRecord: Place = {
          id: Math.random().toString(),
          google_place_id: card.google_place_id,
          name: card.name,
          category: inferCategory(card.types),
          lat: card.lat,
          lng: card.lng,
          price_level: card.price_level,
          rating: card.rating,
          photo_url: card.photo_url,
          added_to_itinerary: false,
          added_by: '',
        }
        setSavedPlaces(p => [...p, newRecord])
        setDetailCard(prev => prev ? { ...prev, savedRecord: newRecord } : prev)
        // Update marker to coral
        markersRef.current.forEach(m => {
          if (m.getTitle() === card.name) {
            m.setIcon({ path: window.google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: '#E0533A', fillOpacity: 0.9, strokeColor: '#FCF8EE', strokeWeight: 1.5 })
            m.setZIndex(5)
          }
        })
      }
    })
  }

  function handleRemove(id: string, googlePlaceId: string) {
    startTransition(async () => {
      await removePlace(tripId, id)
      setSavedPlaces(p => p.filter(x => x.id !== id))
      if (detailCard?.google_place_id === googlePlaceId) {
        setDetailCard(prev => prev ? { ...prev, savedRecord: null } : prev)
      }
      // Revert marker colour in discover mode
      if (viewMode === 'discover') {
        markersRef.current.forEach(m => {
          if (detailCard && m.getTitle() === detailCard.name) {
            const cat = inferCategory(detailCard.types)
            m.setIcon({ path: window.google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: CATEGORY_COLORS[cat] ?? '#928873', fillOpacity: 0.9, strokeColor: '#FCF8EE', strokeWeight: 1.5 })
            m.setZIndex(1)
          }
        })
      }
      // Remove from saved markers in saved mode
      if (viewMode === 'saved') {
        savedMarkersRef.current = savedMarkersRef.current.filter(m => {
          if (m.getTitle() === detailCard?.name) { m.setMap(null); return false }
          return true
        })
        if (detailCard?.google_place_id === googlePlaceId) clearSelection()
      }
    })
  }

  function handleAddToItinerary() {
    if (!addItinPlace || !selectedDay) return
    startTransition(async () => {
      await addPlaceToItinerary(tripId, addItinPlace.id, selectedDay, selectedTime)
      setSavedPlaces(p => p.map(x => x.id === addItinPlace.id ? { ...x, added_to_itinerary: true } : x))
      setDetailCard(prev => prev ? { ...prev, savedRecord: prev.savedRecord ? { ...prev.savedRecord, added_to_itinerary: true } : null } : prev)
      setAddItinPlace(null)
    })
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const displayList = searchMode ? searchResults : nearbyResults
  const sortedList = [
    ...displayList.filter(r => savedIds.has(r.place_id)),
    ...displayList.filter(r => !savedIds.has(r.place_id)),
  ]

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setMapsReady(true)}
        strategy="afterInteractive"
      />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
        className="min-h-screen bg-background flex flex-col pb-28">

        {/* Header */}
        <div className="px-5 pt-14 pb-3">
          <p className="eyebrow mb-0.5">near {destination.name.split(',')[0]}</p>
          <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">
            {viewMode === 'saved' ? 'Saved places' : 'Discover'}
          </h1>
        </div>

        {/* Mode toggle */}
        <div className="px-4 mb-3">
          <div className="flex gap-1 bg-secondary rounded-full p-1">
            <button
              onClick={() => handleModeChange('discover')}
              className="flex-1 h-8 rounded-full text-xs font-semibold transition-colors"
              style={{
                background: viewMode === 'discover' ? 'hsl(var(--foreground))' : 'transparent',
                color: viewMode === 'discover' ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
              }}>
              Discover
            </button>
            <button
              onClick={() => handleModeChange('saved')}
              className="flex-1 h-8 rounded-full text-xs font-semibold transition-colors"
              style={{
                background: viewMode === 'saved' ? 'hsl(var(--foreground))' : 'transparent',
                color: viewMode === 'saved' ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
              }}>
              Saved {savedPlaces.length > 0 ? `(${savedPlaces.length})` : ''}
            </button>
          </div>
        </div>

        {/* Discover-only controls */}
        {viewMode === 'discover' && (
          <>
            {/* Search bar */}
            <div className="px-4 mb-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value)
                    if (!e.target.value) {
                      setSearchMode(false)
                      if (mapInstanceRef.current) doNearbySearch(mapInstanceRef.current, activeTab)
                    }
                  }}
                  onKeyDown={e => e.key === 'Enter' && doSearch()}
                  placeholder="Search bars, beaches, museums…"
                  disabled={!mapsReady}
                  className="w-full h-11 pl-10 pr-20 rounded-full border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
                {query && (
                  <button onClick={doSearch} disabled={!mapsReady || !query.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary disabled:opacity-40 flex items-center gap-1">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                  </button>
                )}
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
          </>
        )}

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
            {(loading && viewMode === 'discover') && (
              <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                <span className="text-[10px] font-mono text-muted-foreground">Loading…</span>
              </div>
            )}
          </div>
        </div>

        {/* Detail card — shared between modes */}
        <AnimatePresence>
          {detailCard && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="mx-4 mb-3 bg-card border border-border rounded-2xl overflow-hidden shadow-lg"
            >
              {detailCard.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detailCard.photo_url} alt="" className="w-full h-32 object-cover" />
              )}
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-display italic text-[18px] leading-tight truncate">{detailCard.name}</p>
                    {detailCard.vicinity && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{detailCard.vicinity}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[11px] flex-wrap">
                      {detailCard.rating && (
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500" />{detailCard.rating}
                        </span>
                      )}
                      {detailCard.price_level && (
                        <span className="text-muted-foreground">{priceSymbol(detailCard.price_level)}</span>
                      )}
                      {detailCard.open_now !== null && (
                        <span className={detailCard.open_now ? 'text-emerald-500' : 'text-destructive'}>
                          {detailCard.open_now ? 'Open now' : 'Closed'}
                        </span>
                      )}
                    </div>

                    {/* Walk / transit info */}
                    {centerLat && (
                      <div className="mt-2 min-h-[18px]">
                        {loadingWalk ? (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                            <Loader2 className="w-3 h-3 animate-spin" /> Getting directions…
                          </span>
                        ) : walkInfo ? (
                          <div className="space-y-0.5">
                            <span className="flex items-center gap-1 text-[11px] text-foreground font-mono">
                              <Footprints className="w-3 h-3 text-muted-foreground shrink-0" />
                              {walkInfo.walkDuration}
                              {walkInfo.walkDistance && <span className="text-muted-foreground">· {walkInfo.walkDistance}</span>}
                            </span>
                            {walkInfo.transitDuration && (
                              <span className="flex items-center gap-1 text-[11px] text-sky font-mono">
                                <Bus className="w-3 h-3 shrink-0" /> or {walkInfo.transitDuration}
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <button onClick={clearSelection} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                  {detailCard.savedRecord ? (
                    <>
                      <button
                        onClick={() => detailCard.savedRecord && handleRemove(detailCard.savedRecord.id, detailCard.google_place_id)}
                        className="flex-1 h-9 rounded-full border border-border text-xs font-medium flex items-center justify-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-primary fill-primary" /> Saved
                      </button>
                      <button
                        onClick={() => detailCard.savedRecord && setAddItinPlace({ id: detailCard.savedRecord.id, name: detailCard.name })}
                        disabled={detailCard.savedRecord.added_to_itinerary}
                        className="flex-1 h-9 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] disabled:opacity-50">
                        <CalendarPlus className="w-3.5 h-3.5" />
                        {detailCard.savedRecord.added_to_itinerary ? 'In plan' : 'Add to plan'}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleSaveFromCard(detailCard)} disabled={isPending}
                      className="flex-1 h-9 rounded-full bg-foreground text-background text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] disabled:opacity-50">
                      <Heart className="w-3.5 h-3.5" /> Save place
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SAVED MODE — full list ────────────────────────────────────────── */}
        {viewMode === 'saved' && (
          <div className="px-4">
            {savedPlaces.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl px-4 py-12 text-center">
                <Heart className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No places saved yet</p>
                <button onClick={() => handleModeChange('discover')}
                  className="mt-4 h-9 px-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold active:scale-[0.97]">
                  Discover places
                </button>
              </div>
            ) : (
              <>
                <p className="eyebrow mb-3">{savedPlaces.length} {savedPlaces.length === 1 ? 'place' : 'places'} saved</p>
                <div className="space-y-2">
                  {savedPlaces.map((p, i) => {
                    const km = (centerLat && centerLng) ? haversineKm(centerLat, centerLng, p.lat, p.lng) : null
                    const walk = km !== null ? walkEstimate(km) : null
                    const cat = p.category
                    const isSelected = detailCard?.google_place_id === p.google_place_id

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.25) }}
                        onClick={() => selectCard(savedToCard(p))}
                        className="bg-card border rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                        style={{ borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                      >
                        <div className="flex gap-0">
                          {/* Photo */}
                          <div className="w-20 h-20 shrink-0 bg-secondary relative">
                            {p.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span style={{ color: CATEGORY_COLORS[cat] }} className="text-2xl">
                                  {CATEGORY_TABS.find(c => c.key === cat)?.icon ?? '●'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 px-3 py-2.5">
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-sm font-semibold text-foreground leading-tight line-clamp-1">{p.name}</p>
                              <button
                                onClick={e => { e.stopPropagation(); handleRemove(p.id, p.google_place_id) }}
                                disabled={isPending}
                                className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 -mt-0.5">
                                <Heart className="w-3 h-3 text-primary fill-primary" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-muted-foreground">
                              <span style={{ color: CATEGORY_COLORS[cat] }} className="capitalize">{cat}</span>
                              {p.rating && <span className="flex items-center gap-0.5 text-amber-500"><Star className="w-2.5 h-2.5 fill-amber-400" />{p.rating}</span>}
                              {p.price_level && <span>{priceSymbol(p.price_level)}</span>}
                            </div>

                            {/* Distance / walk */}
                            {walk && (
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                                  <Footprints className="w-2.5 h-2.5 shrink-0" /> {walk.text}
                                </span>
                                {walk.busNeeded && (
                                  <span className="flex items-center gap-0.5 text-[10px] font-mono text-sky">
                                    <Bus className="w-2.5 h-2.5" /> bus recommended
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Add to plan */}
                            <button
                              onClick={e => { e.stopPropagation(); setAddItinPlace({ id: p.id, name: p.name }) }}
                              disabled={p.added_to_itinerary || isPending}
                              className={`mt-1.5 flex items-center gap-1 text-[10px] font-semibold transition-colors ${p.added_to_itinerary ? 'text-muted-foreground' : 'text-primary'}`}>
                              <CalendarPlus className="w-3 h-3" />
                              {p.added_to_itinerary ? 'Added to plan' : '+ Add to plan'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── DISCOVER MODE — results list ──────────────────────────────────── */}
        {viewMode === 'discover' && (
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
                    const isSelected = detailCard?.google_place_id === r.place_id

                    return (
                      <motion.div
                        key={r.place_id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        onClick={() => {
                          selectCard(nearbyToCard(r, savedPlaces))
                          if (r.geometry?.location) mapInstanceRef.current?.panTo({ lat: r.geometry.location.lat(), lng: r.geometry.location.lng() })
                        }}
                        className={`flex items-center gap-3 py-3 border-b border-dashed border-border last:border-0 cursor-pointer rounded-lg -mx-1 px-1 transition-colors ${isSelected ? 'bg-primary/5' : 'active:bg-secondary/40'}`}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
                          {r.photos?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.photos[0].getUrl({ maxWidth: 100 })} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span style={{ color: CATEGORY_COLORS[cat] }} className="text-lg">
                              {CATEGORY_TABS.find(c => c.key === cat)?.icon ?? '●'}
                            </span>
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
                          onClick={e => {
                            e.stopPropagation()
                            if (saved && savedRecord) handleRemove(savedRecord.id, savedRecord.google_place_id)
                            else selectCard(nearbyToCard(r, savedPlaces))
                          }}
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
          </div>
        )}

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

                <p className="eyebrow mb-2">What time?</p>
                <div className="flex items-center gap-2 mb-5 bg-background border border-border rounded-xl px-4 h-12">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input type="time" value={selectedTime}
                    onChange={e => setSelectedTime(e.target.value)}
                    className="flex-1 bg-transparent text-foreground text-sm font-medium outline-none" />
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
