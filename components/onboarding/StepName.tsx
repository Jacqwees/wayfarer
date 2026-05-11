'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { OnboardingData } from './OnboardingFlow'

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

export default function StepName({
  data,
  update,
  userId,
  onNext,
}: {
  data: OnboardingData
  update: (p: Partial<OnboardingData>) => void
  userId: string
  onNext: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}.${ext}`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      update({ avatar_url: urlData.publicUrl })
    }
    setUploading(false)
  }

  return (
    <motion.div {...slide} transition={{ duration: 0.3, ease: 'easeOut' }} className="flex flex-col flex-1">
      <h1 className="text-2xl font-bold mb-1">Welcome to Wayfarer 👋</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Let&apos;s set up your profile so your travel crew can find you.
      </p>

      {/* Avatar picker */}
      <div className="flex justify-center mb-8">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden group"
        >
          {data.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-muted-foreground" />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatar}
        />
      </div>

      <div className="space-y-2 mb-auto">
        <label className="text-sm font-medium">Display name</label>
        <input
          type="text"
          value={data.display_name}
          onChange={(e) => update({ display_name: e.target.value })}
          placeholder="What should we call you?"
          className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
          autoFocus
        />
      </div>

      <button
        onClick={onNext}
        disabled={!data.display_name.trim()}
        className="mt-8 w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
      >
        Continue
      </button>
    </motion.div>
  )
}
