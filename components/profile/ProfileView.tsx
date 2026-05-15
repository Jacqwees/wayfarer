'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Script from 'next/script'
import {
  Camera, Loader2, LogOut, MapPin, Phone, FileText,
  Pencil, Check, X, Settings, Bell, Moon, Coins,
  Shield, User, ChevronRight,
} from 'lucide-react'
import { updateProfile, updateAvatar, signOut } from '@/app/actions/profile'
import { getUploadUrl } from '@/app/actions/trips'
import { useT } from '@/lib/i18n'
import AppearanceSheet from '@/components/shared/AppearanceSheet'

type Visibility = 'trip' | 'friend' | 'private'

type Stats = {
  trips: number
  countries: number
  daysAway: number
  squad: number
  totalSpent: number
}

function joinedLabel(createdAt: string | null) {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  return `joined ${d.toLocaleDateString('en-GB', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
}

function StatCol({ num, label }: { num: string | number; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-3">
      <span className="font-display italic text-[24px] leading-none tracking-[-0.01em] text-foreground">{num}</span>
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mt-1">{label}</span>
    </div>
  )
}

function SettingsRow({ icon: Icon, label, sub, danger, onClick }: {
  icon: React.ElementType; label: string; sub: string; danger?: boolean; onClick?: () => void
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 py-3.5 border-b border-dashed border-border last:border-0 active:bg-muted/50 transition-colors text-left">
      <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
        <Icon className={`w-3.5 h-3.5 ${danger ? 'text-destructive' : 'text-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13.5px] font-medium leading-tight ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
      {!danger && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
    </button>
  )
}

function VisibilityToggle({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  return (
    <div className="flex gap-2 mt-2">
      {(['trip', 'private'] as Visibility[]).map(v => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className="flex-1 text-xs py-1.5 rounded-full font-medium transition-colors"
          style={{
            background: value === v ? 'hsl(var(--foreground))' : 'hsl(var(--card))',
            color: value === v ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
            border: value === v ? 'none' : '1px solid hsl(var(--border))',
          }}>
          {v === 'trip' ? 'Trip members' : 'Only me'}
        </button>
      ))}
    </div>
  )
}

function FieldRow({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="px-4 py-4 border-b border-dashed border-border last:border-0">
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}

const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/

function validateForm(form: ReturnType<typeof buildInitialForm>): string | null {
  if (!form.display_name.trim() || form.display_name.trim().length < 2)
    return 'Display name needs at least 2 characters'
  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim()))
    return 'Phone looks wrong — try +44 7XXX XXXXXX'
  if (form.emergency_contact_phone.trim() && !PHONE_RE.test(form.emergency_contact_phone.trim()))
    return 'Emergency contact phone looks wrong — include country code e.g. +44…'
  if (form.emergency_contact_name.trim() && !form.emergency_contact_phone.trim())
    return 'Add a phone number for your emergency contact'
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildInitialForm(profile: any, privacy: any) {
  return {
    display_name: profile?.display_name ?? '',
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    bio: profile?.bio ?? '',
    home_city: profile?.home_city ?? '',
    travel_tags: (profile?.travel_tags as string[]) ?? [],
    emergency_contact_name: profile?.emergency_contact_name ?? '',
    emergency_contact_phone: profile?.emergency_contact_phone ?? '',
    emergency_contact_relationship: profile?.emergency_contact_relationship ?? '',
    phone_visibility: (privacy?.phone_visibility ?? 'trip') as Visibility,
    bio_visibility: (privacy?.bio_visibility ?? 'trip') as Visibility,
    home_city_visibility: (privacy?.home_city_visibility ?? 'trip') as Visibility,
  }
}

export default function ProfileView({
  profile, privacy, stats,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any; privacy: any; stats: Stats
}) {
  const router = useRouter()
  const t = useT()
  const ALL_TAGS = t.profile.travelTags as unknown as string[]

  const [editing, setEditing] = useState(false)
  const [showAppearance, setShowAppearance] = useState(false)
  const [showNotifPrefs, setShowNotifPrefs] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [saveError, setSaveError] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState(() => buildInitialForm(profile, privacy))
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url ?? null)

  // Google Places autocomplete for home city
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const mapsLoaded = useRef(false)
  const cityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  function update(k: string, v: unknown) {
    setForm(f => ({ ...f, [k]: v }))
    setValidationError('')
  }

  function toggleTag(tag: string) {
    setForm(f => ({
      ...f,
      travel_tags: f.travel_tags.includes(tag)
        ? f.travel_tags.filter(x => x !== tag)
        : [...f.travel_tags, tag],
    }))
  }

  function handleCityChange(val: string) {
    update('home_city', val)
    if (cityDebounce.current) clearTimeout(cityDebounce.current)
    if (val.length < 2) { setCitySuggestions([]); return }
    cityDebounce.current = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).google?.maps?.places) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new (window as any).google.maps.places.AutocompleteService()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      svc.getPlacePredictions({ input: val, types: ['(cities)'] }, (preds: any[], status: string) => {
        if (status === 'OK') setCitySuggestions(preds.slice(0, 4).map((p: { description: string }) => p.description))
      })
    }, 350)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `avatars/${profile.id}.${ext}`
      const result = await getUploadUrl('avatars', path)
      if (result.error || !result.data) throw new Error(result.error ?? 'Upload error')
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from('avatars').uploadToSignedUrl(result.data.path, result.data.token, file, { contentType: file.type })
      if (uploadError) throw new Error(uploadError.message)
      const url = `https://fkybsfpdhvjitivsylnj.supabase.co/storage/v1/object/public/avatars/${path}?t=${Date.now()}`
      setAvatar(url)
      await updateAvatar(url)
    } catch { /* silent */ }
    setUploading(false)
  }

  function handleSave() {
    const err = validateForm(form)
    if (err) { setValidationError(err); return }
    setValidationError('')
    setSaveError('')
    startTransition(async () => {
      const res = await updateProfile({
        display_name: form.display_name.trim(),
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
        bio: form.bio.trim() || null,
        home_city: form.home_city.trim() || null,
        travel_tags: form.travel_tags,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.trim() || null,
        emergency_contact_relationship: form.emergency_contact_relationship.trim() || null,
        phone_visibility: form.phone_visibility,
        bio_visibility: form.bio_visibility,
        home_city_visibility: form.home_city_visibility,
      })
      if (res?.error) { setSaveError(res.error); return }
      setEditing(false)
    })
  }

  function handleCancel() {
    setForm(buildInitialForm(profile, privacy))
    setValidationError('')
    setSaveError('')
    setEditing(false)
  }

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const eyebrowParts = [form.home_city, joinedLabel(profile?.created_at)].filter(Boolean)
  const hasEmergency = form.emergency_contact_name || form.emergency_contact_phone

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
        strategy="lazyOnload"
        onLoad={() => { mapsLoaded.current = true }}
      />

      <div className="min-h-screen bg-background pb-32">

        {/* ── HERO ─────────────────────────────────────────── */}
        <div className="px-5 pt-14 pb-4 text-center relative">
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={isPending}
            className={`absolute top-14 right-5 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${editing ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
          >
            {isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : editing
                ? <><Check className="w-3.5 h-3.5" /> Save</>
                : <><Pencil className="w-3.5 h-3.5" /> Edit</>}
          </button>

          {/* Avatar */}
          <div className="relative inline-block">
            <button
              onClick={() => editing && fileRef.current?.click()}
              className={`w-[92px] h-[92px] rounded-full bg-primary/20 overflow-hidden relative ${editing ? 'cursor-pointer' : ''}`}
            >
              {avatar
                ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-display italic text-[44px]">
                    {(form.display_name[0] ?? '?').toUpperCase()}
                  </div>}
            </button>
            {editing && (
              <button onClick={() => fileRef.current?.click()}
                className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-foreground border-2 border-background flex items-center justify-center">
                {uploading
                  ? <Loader2 className="w-3 h-3 text-background animate-spin" />
                  : <Camera className="w-3 h-3 text-background" />}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Display name */}
          <div className="mt-3.5">
            {editing ? (
              <input
                value={form.display_name}
                onChange={e => update('display_name', e.target.value)}
                placeholder="Display name"
                maxLength={40}
                className="text-center font-display italic text-[26px] leading-tight tracking-[-0.01em] bg-transparent border-b-2 border-primary outline-none w-full max-w-[240px]"
                autoFocus
              />
            ) : (
              <h1 className="font-display italic text-[26px] leading-tight tracking-[-0.01em] text-foreground">
                {form.display_name}
              </h1>
            )}
            {eyebrowParts.length > 0 && (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1.5">
                {eyebrowParts.join(' · ')}
              </p>
            )}
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* ── STATS ──────────────────────────────────────── */}
          <div className="bg-card border border-border rounded-xl flex overflow-hidden">
            <StatCol num={stats.trips} label="Trips" />
            <div className="w-px bg-border my-2" />
            <StatCol num={stats.countries} label="Countries" />
            <div className="w-px bg-border my-2" />
            <StatCol num={stats.daysAway} label="Days away" />
            <div className="w-px bg-border my-2" />
            <StatCol num={stats.squad} label="Squad" />
          </div>

          {/* ── TOTAL SPENT ─────────────────────────────────── */}
          {stats.totalSpent > 0 && (
            <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="eyebrow mb-0.5">Total spent across all trips</p>
                <p className="font-display italic text-[26px] leading-none tracking-[-0.01em] text-foreground">
                  £{stats.totalSpent.toFixed(0)}
                </p>
              </div>
              <Coins className="w-5 h-5 text-muted-foreground" />
            </div>
          )}

          {/* ── TRAVEL STYLE ────────────────────────────────── */}
          <div>
            <p className="eyebrow mb-2.5 px-1">Travel style</p>
            <AnimatePresence mode="wait">
              {editing ? (
                <motion.div key="edit-tags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
                  {ALL_TAGS.map(tag => {
                    const active = form.travel_tags.includes(tag)
                    return (
                      <button key={tag} type="button" onClick={() => toggleTag(tag)}
                        className="text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors"
                        style={{
                          background: active ? 'hsl(var(--foreground))' : 'hsl(var(--card))',
                          color: active ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
                          border: active ? 'none' : '1px solid hsl(var(--border))',
                        }}>
                        {tag}
                      </button>
                    )
                  })}
                </motion.div>
              ) : (
                <motion.div key="view-tags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
                  {form.travel_tags.length > 0
                    ? form.travel_tags.map(tag => (
                      <span key={tag} className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {tag}
                      </span>
                    ))
                    : <p className="text-sm text-muted-foreground px-1">No travel style set yet</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── ABOUT ───────────────────────────────────────── */}
          <div>
            <p className="eyebrow mb-2.5 px-1">About</p>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Bio */}
              <FieldRow icon={FileText}>
                {editing ? (
                  <>
                    <label className="eyebrow mb-1 block">Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={e => update('bio', e.target.value)}
                      placeholder="Short bio…"
                      rows={2}
                      maxLength={300}
                      className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground"
                    />
                    <p className="font-mono text-[9px] text-muted-foreground mt-1">{form.bio.length}/300</p>
                    <VisibilityToggle value={form.bio_visibility} onChange={v => update('bio_visibility', v)} />
                  </>
                ) : (
                  <span className="text-sm">{form.bio || <span className="text-muted-foreground">No bio yet</span>}</span>
                )}
              </FieldRow>

              {/* Home city */}
              <FieldRow icon={MapPin}>
                {editing ? (
                  <>
                    <label className="eyebrow mb-1 block">Home city</label>
                    <div className="relative">
                      <input
                        value={form.home_city}
                        onChange={e => handleCityChange(e.target.value)}
                        onBlur={() => setTimeout(() => setCitySuggestions([]), 200)}
                        placeholder="Where are you based?"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                      {citySuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                          {citySuggestions.map((s, i) => (
                            <button key={s} type="button"
                              onMouseDown={() => { update('home_city', s); setCitySuggestions([]) }}
                              className={`w-full text-left px-3 py-2.5 text-sm active:bg-muted flex items-center gap-2 ${i < citySuggestions.length - 1 ? 'border-b border-dashed border-border' : ''}`}>
                              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <VisibilityToggle value={form.home_city_visibility} onChange={v => update('home_city_visibility', v)} />
                  </>
                ) : (
                  <span className="text-sm">{form.home_city || <span className="text-muted-foreground">No home city</span>}</span>
                )}
              </FieldRow>

              {/* Phone */}
              <FieldRow icon={Phone}>
                {editing ? (
                  <>
                    <label className="eyebrow mb-1 block">Phone</label>
                    <input
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      placeholder="+44 7XXX XXXXXX"
                      type="tel"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <VisibilityToggle value={form.phone_visibility} onChange={v => update('phone_visibility', v)} />
                  </>
                ) : (
                  <span className="text-sm">{form.phone || <span className="text-muted-foreground">No phone number</span>}</span>
                )}
              </FieldRow>
            </div>
          </div>

          {/* ── PERSONAL DETAILS ────────────────────────────── */}
          <div>
            <p className="eyebrow mb-2.5 px-1">Personal details</p>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Full legal name */}
              <FieldRow icon={User}>
                {editing ? (
                  <>
                    <label className="eyebrow mb-1 block">Full name · as on passport</label>
                    <input
                      value={form.full_name}
                      onChange={e => update('full_name', e.target.value)}
                      placeholder="Jane Elizabeth Smith"
                      autoCapitalize="words"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </>
                ) : (
                  <div>
                    <p className="eyebrow mb-0.5">Full name</p>
                    <span className="text-sm">{form.full_name || <span className="text-muted-foreground">Not set</span>}</span>
                  </div>
                )}
              </FieldRow>

              {/* Emergency contact */}
              <FieldRow icon={Shield}>
                {editing ? (
                  <>
                    <label className="eyebrow mb-2 block">Emergency contact</label>
                    <div className="space-y-3">
                      <input
                        value={form.emergency_contact_name}
                        onChange={e => update('emergency_contact_name', e.target.value)}
                        placeholder="Contact name"
                        autoCapitalize="words"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground border-b border-dashed border-border pb-2"
                      />
                      <input
                        value={form.emergency_contact_relationship}
                        onChange={e => update('emergency_contact_relationship', e.target.value)}
                        placeholder="Relationship · Mum, Partner, Dad…"
                        autoCapitalize="words"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground border-b border-dashed border-border pb-2"
                      />
                      <input
                        value={form.emergency_contact_phone}
                        onChange={e => update('emergency_contact_phone', e.target.value)}
                        placeholder="+44 7XXX XXXXXX"
                        type="tel"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="eyebrow mb-0.5">Emergency contact</p>
                    {hasEmergency ? (
                      <div className="mt-1">
                        <p className="text-sm font-medium text-foreground">
                          {form.emergency_contact_name}
                          {form.emergency_contact_relationship && (
                            <span className="text-muted-foreground font-normal"> · {form.emergency_contact_relationship}</span>
                          )}
                        </p>
                        {form.emergency_contact_phone && (
                          <a href={`tel:${form.emergency_contact_phone}`}
                            className="text-sm text-primary mt-0.5 block">
                            {form.emergency_contact_phone}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                  </div>
                )}
              </FieldRow>
            </div>
          </div>

          {/* ── VALIDATION / SAVE ERROR ─────────────────────── */}
          <AnimatePresence>
            {(validationError || saveError) && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive flex items-start gap-2">
                <X className="w-4 h-4 shrink-0 mt-0.5" />
                {validationError || saveError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── EDIT ACTIONS ────────────────────────────────── */}
          {editing && (
            <div className="space-y-2">
              <button onClick={handleSave} disabled={isPending}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save profile
              </button>
              <button onClick={handleCancel}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          )}

          {/* ── SETTINGS ────────────────────────────────────── */}
          {!editing && (
            <div>
              <p className="eyebrow mb-2.5 px-1">Settings</p>
              <div className="bg-card border border-border rounded-xl px-4">
                <SettingsRow icon={Settings} label="Privacy" sub="What trip members can see" onClick={() => setEditing(true)} />
                <SettingsRow icon={Bell} label="Notifications" sub="Push · email" onClick={() => setShowNotifPrefs(true)} />
                <SettingsRow icon={Moon} label="Appearance" sub="Auto · light · dark" onClick={() => setShowAppearance(true)} />
                <SettingsRow icon={LogOut} label="Sign out" sub="See you soon" danger onClick={handleSignOut} />
              </div>
            </div>
          )}
        </div>

        <AppearanceSheet open={showAppearance} onClose={() => setShowAppearance(false)} />
        <NotificationsSheet open={showNotifPrefs} onClose={() => setShowNotifPrefs(false)} />
      </div>
    </>
  )
}

function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (!open) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setPermission(Notification.permission)
    if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription()).then(sub => setSubscribed(!!sub)).catch(() => {})
    }
  }, [open])

  async function handleEnable() {
    if (!('Notification' in window)) return
    setSubscribing(true)
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted' && 'serviceWorker' in navigator) {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (vapidKey) {
        try {
          const reg = await navigator.serviceWorker.ready
          const padding = '='.repeat((4 - (vapidKey.length % 4)) % 4)
          const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/')
          const raw = atob(base64)
          const buf = new ArrayBuffer(raw.length)
          const arr = new Uint8Array(buf)
          for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
          const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: buf })
          const p256dh = sub.getKey('p256dh')
          const auth = sub.getKey('auth')
          if (p256dh && auth) {
            const toBase64 = (b: ArrayBuffer) => { const bytes = new Uint8Array(b); let s = ''; for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]); return btoa(s) }
            const { savePushSubscription } = await import('@/app/actions/push')
            await savePushSubscription({ endpoint: sub.endpoint, keys: { p256dh: toBase64(p256dh), auth: toBase64(auth) } })
          }
          setSubscribed(true)
        } catch { /* subscription failed */ }
      }
    }
    setSubscribing(false)
  }

  const status = permission === 'granted' ? (subscribed ? 'active' : 'granted-no-sub') : permission

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[70] flex items-end" onClick={onClose}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="bg-card w-full rounded-t-[28px] px-6 pt-6 pb-10"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
            <p className="eyebrow mb-1">Notifications</p>
            <h2 className="font-display italic text-[22px] leading-tight tracking-[-0.01em] mb-5">Stay in the loop</h2>

            <div className="bg-background border border-border rounded-xl px-4 py-4 mb-4">
              <div className="flex items-start gap-3">
                <Bell className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-0.5">Push notifications</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Get notified when squad members add expenses, join trips, or update the plan.
                  </p>
                  <div className="mt-3">
                    {status === 'active' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
                      </span>
                    )}
                    {status === 'granted-no-sub' && (
                      <button onClick={handleEnable} disabled={subscribing}
                        className="text-xs font-semibold text-primary">
                        {subscribing ? 'Setting up…' : 'Finish setup →'}
                      </button>
                    )}
                    {status === 'default' && (
                      <button onClick={handleEnable} disabled={subscribing}
                        className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 active:scale-[0.97] transition-transform">
                        {subscribing ? 'Enabling…' : 'Enable push notifications'}
                      </button>
                    )}
                    {status === 'denied' && (
                      <p className="text-xs text-muted-foreground">
                        Notifications are blocked. Enable them in your device settings → Browser → Notifications.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-background border border-border rounded-xl px-4 py-4">
              <div className="flex items-start gap-3">
                <Bell className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-0.5">Email</p>
                  <p className="text-xs text-muted-foreground">Trip invitations are sent to your email. Sign-in codes also arrive by email.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
