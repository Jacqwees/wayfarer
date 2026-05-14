'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LogoMark } from '@/components/shared/Logo'
import { Spinner } from '@/components/shared/Spinner'
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
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      update({ avatar_url: urlData.publicUrl })
    }
    setUploading(false)
  }

  return (
    <motion.div {...slide} transition={{ duration: 0.3, ease: 'easeOut' }} className="flex flex-col flex-1">

      {/* Logo mark */}
      <div className="flex justify-center mb-8">
        <LogoMark size={36} />
      </div>

      <p className="eyebrow mb-2">step 01 · 04</p>
      <h1 className="font-display italic text-[36px] leading-[0.95] tracking-[-0.01em] mb-1.5">
        Who&apos;s packing?
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed mb-8">
        How your squad sees you in trips.
      </p>

      {/* Avatar picker */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-[72px] h-[72px] rounded-full bg-primary flex items-center justify-center overflow-hidden group active:scale-[0.97] transition-transform flex-shrink-0"
        >
          {data.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatar_url} alt="Your avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="font-display italic text-primary-foreground text-[32px] leading-none">
              {(data.display_name?.[0] ?? '?').toUpperCase()}
            </span>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity rounded-full">
            <Camera className="w-5 h-5 text-white" />
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <Spinner size={20} className="text-white" />
            </div>
          )}
          {/* Plus badge */}
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-foreground border-2 border-background flex items-center justify-center pointer-events-none">
            <User className="w-3 h-3 text-background" />
          </div>
        </button>

        <div>
          <p className="eyebrow mb-1">Display photo</p>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-[180px]">
            Tap to add a photo — your squad will see this
          </p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
      </div>

      {/* Perforated divider */}
      <svg height="2" width="100%" className="mb-6" aria-hidden="true">
        <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
      </svg>

      {/* Name input */}
      <div className="space-y-1.5 mb-auto">
        <label className="eyebrow">Your name</label>
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
        className="mt-8 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        Next →
      </button>
    </motion.div>
  )
}
