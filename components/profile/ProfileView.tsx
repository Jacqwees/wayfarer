'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Camera, Loader2, LogOut, MapPin, Phone, FileText, Pencil, Check, X, ChevronRight } from 'lucide-react'
import { updateProfile, updateAvatar, signOut } from '@/app/actions/profile'
import { getUploadUrl } from '@/app/actions/trips'

type Visibility = 'trip' | 'friend' | 'private'

function VisibilityBadge({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  const opts: { v: Visibility; label: string }[] = [{ v: 'trip', label: 'Trip members' }, { v: 'private', label: 'Only me' }]
  return (
    <div className="flex gap-2 mt-1.5">
      {opts.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors ${value === o.v ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-muted-foreground bg-card'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function ProfileView({ profile, privacy, tripCount }: { profile: any; privacy: any; tripCount: number }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    display_name: profile?.display_name ?? '',
    phone: profile?.phone ?? '',
    bio: profile?.bio ?? '',
    home_city: profile?.home_city ?? '',
    phone_visibility: (privacy?.phone_visibility ?? 'trip') as Visibility,
    bio_visibility: (privacy?.bio_visibility ?? 'trip') as Visibility,
    home_city_visibility: (privacy?.home_city_visibility ?? 'trip') as Visibility,
  })
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url ?? null)

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${profile.id}.${ext}`
      const signed = await getUploadUrl('avatars', path)
      if (!signed) throw new Error('Upload error')
      await fetch(signed.signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      const url = `https://fkybsfpdhvjitivsylnj.supabase.co/storage/v1/object/public/avatars/${path}?t=${Date.now()}`
      setAvatar(url)
      await updateAvatar(url)
    } catch { /* silent */ }
    setUploading(false)
  }

  async function handleSave() {
    startTransition(async () => {
      await updateProfile({ ...form, phone: form.phone || null, bio: form.bio || null, home_city: form.home_city || null })
      setEditing(false)
    })
  }

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-5 pt-14 pb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={isPending}
          className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${editing ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editing ? <><Check className="w-3.5 h-3.5" /> Save</> : <><Pencil className="w-3.5 h-3.5" /> Edit</>}
        </button>
      </div>

      <div className="px-5 space-y-6">
        {/* Avatar + name */}
        <motion.div layout className="flex flex-col items-center gap-4">
          <div className="relative">
            <button onClick={() => fileRef.current?.click()} className="w-24 h-24 rounded-full bg-muted overflow-hidden relative group">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold">
                  {form.display_name[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {editing ? (
            <input
              value={form.display_name}
              onChange={e => update('display_name', e.target.value)}
              className="text-center text-xl font-bold bg-transparent border-b-2 border-primary outline-none w-full max-w-[200px]"
              autoFocus
            />
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-bold">{form.display_name}</h2>
              <p className="text-muted-foreground text-sm">{profile?.email}</p>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-0 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-muted-foreground">Trips</span>
            <span className="font-semibold">{tripCount}</span>
          </div>
        </div>

        {/* Details */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {/* Phone */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              {editing ? (
                <input value={form.phone} onChange={e => update('phone', e.target.value)}
                  placeholder="Phone number" type="tel"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              ) : (
                <span className="text-sm flex-1 text-foreground">{form.phone || <span className="text-muted-foreground">No phone number</span>}</span>
              )}
            </div>
            {editing && <VisibilityBadge value={form.phone_visibility} onChange={v => update('phone_visibility', v)} />}
          </div>

          {/* Bio */}
          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              {editing ? (
                <textarea value={form.bio} onChange={e => update('bio', e.target.value)}
                  placeholder="Write a short bio…" rows={2}
                  className="flex-1 bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground" />
              ) : (
                <span className="text-sm flex-1 text-foreground">{form.bio || <span className="text-muted-foreground">No bio yet</span>}</span>
              )}
            </div>
            {editing && <VisibilityBadge value={form.bio_visibility} onChange={v => update('bio_visibility', v)} />}
          </div>

          {/* Home city */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              {editing ? (
                <input value={form.home_city} onChange={e => update('home_city', e.target.value)}
                  placeholder="Home city"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              ) : (
                <span className="text-sm flex-1 text-foreground">{form.home_city || <span className="text-muted-foreground">No home city</span>}</span>
              )}
            </div>
            {editing && <VisibilityBadge value={form.home_city_visibility} onChange={v => update('home_city_visibility', v)} />}
          </div>
        </div>

        {editing && (
          <button onClick={() => setEditing(false)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
            <X className="w-4 h-4" /> Cancel
          </button>
        )}

        {/* Sign out */}
        {!editing && (
          <button onClick={handleSignOut}
            className="w-full flex items-center justify-between px-5 py-4 bg-card border border-border rounded-2xl text-destructive active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign out</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40" />
          </button>
        )}
      </div>
    </div>
  )
}
