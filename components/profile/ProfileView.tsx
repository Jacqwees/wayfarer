'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Loader2, LogOut, MapPin, Phone, FileText,
  Pencil, Check, X, Settings, Bell, Moon, Coins,
} from 'lucide-react'
import { updateProfile, updateAvatar, signOut } from '@/app/actions/profile'
import { getUploadUrl } from '@/app/actions/trips'
import { useT } from '@/lib/i18n'
import AppearanceSheet from '@/components/shared/AppearanceSheet'

type Visibility = 'trip' | 'friend' | 'private'

function joinedLabel(createdAt: string | null) {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  return `joined ${d.toLocaleDateString('en-GB', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
}

function StatCol({ num, label }: { num: string | number; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-3">
      <span className="font-display italic text-[24px] leading-none tracking-[-0.01em] text-foreground">
        {num}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mt-1">{label}</span>
    </div>
  )
}

function StatDivider() {
  return <div className="w-px bg-border my-2" />
}

function SettingsRow({
  icon: Icon, label, sub, danger, onClick,
}: {
  icon: React.ElementType; label: string; sub: string; danger?: boolean; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 border-b border-dashed border-border last:border-0 active:bg-muted/50 transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
        <Icon className={`w-3.5 h-3.5 ${danger ? 'text-destructive' : 'text-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13.5px] font-medium leading-tight ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </button>
  )
}

function VisibilityBadge({ value, onChange, tripLabel, privateLabel }: { value: Visibility; onChange: (v: Visibility) => void; tripLabel: string; privateLabel: string }) {
  return (
    <div className="flex gap-2 mt-1.5">
      {(['trip', 'private'] as Visibility[]).map(v => (
        <button
          key={v} type="button" onClick={() => onChange(v)}
          className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors ${value === v ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-muted-foreground bg-card'}`}
        >
          {v === 'trip' ? tripLabel : privateLabel}
        </button>
      ))}
    </div>
  )
}

type Stats = {
  trips: number
  countries: number
  daysAway: number
  squad: number
  totalSpent: number
}

export default function ProfileView({
  profile,
  privacy,
  stats,
}: {
  profile: any
  privacy: any
  stats: Stats
}) {
  const router = useRouter()
  const t = useT()
  const ALL_TAGS = t.profile.travelTags as unknown as string[]
  const [editing, setEditing] = useState(false)
  const [showAppearance, setShowAppearance] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    display_name: profile?.display_name ?? '',
    phone: profile?.phone ?? '',
    bio: profile?.bio ?? '',
    home_city: profile?.home_city ?? '',
    travel_tags: (profile?.travel_tags as string[]) ?? [],
    phone_visibility: (privacy?.phone_visibility ?? 'trip') as Visibility,
    bio_visibility: (privacy?.bio_visibility ?? 'trip') as Visibility,
    home_city_visibility: (privacy?.home_city_visibility ?? 'trip') as Visibility,
  })
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url ?? null)

  function update(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  function toggleTag(tag: string) {
    setForm(f => ({
      ...f,
      travel_tags: f.travel_tags.includes(tag)
        ? f.travel_tags.filter(t => t !== tag)
        : [...f.travel_tags, tag],
    }))
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

  async function handleSave() {
    startTransition(async () => {
      await updateProfile({
        display_name: form.display_name,
        phone: form.phone || null,
        bio: form.bio || null,
        home_city: form.home_city || null,
        travel_tags: form.travel_tags,
        phone_visibility: form.phone_visibility,
        bio_visibility: form.bio_visibility,
        home_city_visibility: form.home_city_visibility,
      })
      setEditing(false)
    })
  }

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const eyebrow = [
    form.home_city,
    joinedLabel(profile?.created_at),
  ].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-background pb-32">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="px-5 pt-14 pb-4 text-center relative">
        {/* Edit / Save button */}
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={isPending}
          className={`absolute top-14 right-5 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${editing ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
        >
          {isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : editing
              ? <><Check className="w-3.5 h-3.5" /> {t.profile.saveProfile}</>
              : <><Pencil className="w-3.5 h-3.5" /> {t.profile.editProfile}</>}
        </button>

        {/* Avatar */}
        <div className="relative inline-block">
          <button
            onClick={() => editing && fileRef.current?.click()}
            className="w-[92px] h-[92px] rounded-full bg-primary/20 overflow-hidden relative"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-display italic text-[44px]">
                {(form.display_name[0] ?? '?').toUpperCase()}
              </div>
            )}
          </button>
          {editing && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-foreground border-2 border-background flex items-center justify-center"
            >
              {uploading
                ? <Loader2 className="w-3 h-3 text-background animate-spin" />
                : <Camera className="w-3 h-3 text-background" />}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Name */}
        <div className="mt-3.5">
          {editing ? (
            <input
              value={form.display_name}
              onChange={e => update('display_name', e.target.value)}
              className="text-center font-display italic text-[26px] leading-tight tracking-[-0.01em] bg-transparent border-b-2 border-primary outline-none w-full max-w-[220px]"
              autoFocus
            />
          ) : (
            <h1 className="font-display italic text-[26px] leading-tight tracking-[-0.01em] text-foreground">
              {form.display_name}
            </h1>
          )}
          {eyebrow && (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1.5">{eyebrow}</p>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ── STATS ROW ─────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl flex overflow-hidden">
          <StatCol num={stats.trips} label={t.profile.stats.trips} />
          <StatDivider />
          <StatCol num={stats.countries} label={t.profile.stats.countries} />
          <StatDivider />
          <StatCol num={stats.daysAway} label={t.profile.stats.daysAway} />
          <StatDivider />
          <StatCol num={stats.squad} label={t.profile.stats.squad} />
        </div>

        {/* ── SPENDING ACROSS ALL TRIPS ─────────────────────── */}
        {stats.totalSpent > 0 && (
          <div className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mb-0.5">{t.profile.totalSpent}</p>
              <p className="font-display italic text-[26px] leading-none tracking-[-0.01em] text-foreground">
                £{stats.totalSpent.toFixed(0)}
              </p>
            </div>
            <Coins className="w-5 h-5 text-muted-foreground" />
          </div>
        )}

        {/* ── TRAVEL STYLE TAGS ─────────────────────────────── */}
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mb-2.5 px-1">{t.profile.travelStyle}</p>
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div key="edit-tags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
                {ALL_TAGS.map(tag => {
                  const active = form.travel_tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'}`}
                    >
                      {active ? '● ' : ''}{tag}
                    </button>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div key="view-tags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
                {form.travel_tags.length > 0
                  ? form.travel_tags.map(tag => (
                    <span key={tag} className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      ● {tag}
                    </span>
                  ))
                  : !editing && (
                    <p className="text-sm text-muted-foreground px-1">{t.profile.noTravelStyle}</p>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── BIO & DETAILS ─────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {/* Bio */}
          <div className="px-4 py-4">
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              {editing ? (
                <textarea
                  value={form.bio}
                  onChange={e => update('bio', e.target.value)}
                  placeholder={t.profile.bioPlaceholder}
                  rows={2}
                  className="flex-1 bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground"
                />
              ) : (
                <span className="text-sm flex-1">{form.bio || <span className="text-muted-foreground">{t.profile.noBio}</span>}</span>
              )}
            </div>
            {editing && <VisibilityBadge value={form.bio_visibility} onChange={v => update('bio_visibility', v)} tripLabel={t.profile.visibility.tripMembers} privateLabel={t.profile.visibility.onlyMe} />}
          </div>

          {/* Home city */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              {editing ? (
                <input
                  value={form.home_city}
                  onChange={e => update('home_city', e.target.value)}
                  placeholder={t.profile.homeCityPlaceholder}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              ) : (
                <span className="text-sm flex-1">{form.home_city || <span className="text-muted-foreground">{t.profile.noHomeCity}</span>}</span>
              )}
            </div>
            {editing && <VisibilityBadge value={form.home_city_visibility} onChange={v => update('home_city_visibility', v)} tripLabel={t.profile.visibility.tripMembers} privateLabel={t.profile.visibility.onlyMe} />}
          </div>

          {/* Phone */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              {editing ? (
                <input
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder={t.profile.phonePlaceholder}
                  type="tel"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              ) : (
                <span className="text-sm flex-1">{form.phone || <span className="text-muted-foreground">{t.profile.noPhone}</span>}</span>
              )}
            </div>
            {editing && <VisibilityBadge value={form.phone_visibility} onChange={v => update('phone_visibility', v)} tripLabel={t.profile.visibility.tripMembers} privateLabel={t.profile.visibility.onlyMe} />}
          </div>
        </div>

        {editing && (
          <button
            onClick={() => setEditing(false)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground"
          >
            <X className="w-4 h-4" /> {t.profile.cancelEdit}
          </button>
        )}

        {/* ── SETTINGS ──────────────────────────────────────── */}
        {!editing && (
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mb-2 px-1">{t.profile.settings.heading}</p>
            <div className="bg-card border border-border rounded-2xl px-4">
              <SettingsRow
                icon={Settings}
                label={t.profile.settings.privacyLabel}
                sub={t.profile.settings.privacySub}
                onClick={() => setEditing(true)}
              />
              <SettingsRow
                icon={Bell}
                label={t.profile.settings.notificationsLabel}
                sub={t.profile.settings.notificationsSub}
              />
              <SettingsRow
                icon={Moon}
                label={t.profile.settings.appearanceLabel}
                sub={t.profile.settings.appearanceSub}
                onClick={() => setShowAppearance(true)}
              />
              <SettingsRow
                icon={LogOut}
                label={t.profile.settings.signOut}
                sub={t.profile.settings.signOutSub}
                danger
                onClick={handleSignOut}
              />
            </div>
          </div>
        )}
      </div>

      <AppearanceSheet open={showAppearance} onClose={() => setShowAppearance(false)} />
    </div>
  )
}
