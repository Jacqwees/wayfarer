'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import StepName from './StepName'
import StepDetails from './StepDetails'
import StepNotifications from './StepNotifications'
import StepReady from './StepReady'

export type OnboardingData = {
  display_name: string
  avatar_url: string | null
  phone: string
  bio: string
  home_city: string
  phone_visibility: 'trip' | 'friend' | 'private'
  bio_visibility: 'trip' | 'friend' | 'private'
  home_city_visibility: 'trip' | 'friend' | 'private'
  travel_tags: string[]
  budget_tier: 'Backpack' | 'Comfort' | 'Plush'
}

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="rounded-full transition-all duration-200"
          style={{
            width: i === step ? 22 : 6,
            height: 6,
            background:
              i === step
                ? 'hsl(var(--primary))'
                : i < step
                  ? 'hsl(var(--foreground))'
                  : 'hsl(var(--border))',
          }}
        />
      ))}
    </div>
  )
}

const STEPS = ['name', 'details', 'notifications', 'ready'] as const

export default function OnboardingFlow({
  userId,
  initialEmail,
  next,
}: {
  userId: string
  initialEmail: string
  next?: string
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [hasPendingInvites, setHasPendingInvites] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    display_name: initialEmail.split('@')[0],
    avatar_url: null,
    phone: '',
    bio: '',
    home_city: '',
    phone_visibility: 'trip',
    bio_visibility: 'trip',
    home_city_visibility: 'trip',
    travel_tags: [],
    budget_tier: 'Comfort',
  })

  function update(patch: Partial<OnboardingData>) {
    setData((d) => ({ ...d, ...patch }))
  }

  async function finish() {
    setSaving(true)
    const supabase = createClient()

    await supabase.from('users').update({
      display_name: data.display_name.trim() || initialEmail.split('@')[0],
      avatar_url: data.avatar_url,
      phone: data.phone.trim() || null,
      bio: data.bio.trim() || null,
      home_city: data.home_city.trim() || null,
      // @ts-expect-error — travel_tags column exists but supabase types may not reflect it
      travel_tags: data.travel_tags.length > 0 ? data.travel_tags : null,
      onboarding_complete: true,
    }).eq('id', userId)

    await supabase.from('privacy_settings').update({
      phone_visibility: data.phone_visibility,
      bio_visibility: data.bio_visibility,
      home_city_visibility: data.home_city_visibility,
    }).eq('user_id', userId)

    const { data: invites } = await supabase
      .from('invitations')
      .select('id')
      .eq('invited_email', initialEmail.toLowerCase())
      .eq('status', 'pending')
      .limit(1)

    setHasPendingInvites((invites?.length ?? 0) > 0)
    setSaving(false)
    setStep(3)
  }

  const totalSteps = STEPS.length - 1

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepName
              key="name"
              data={data}
              update={update}
              userId={userId}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <StepDetails
              key="details"
              data={data}
              update={update}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepNotifications
              key="notifications"
              onBack={() => setStep(1)}
              onNext={finish}
              saving={saving}
            />
          )}
          {step === 3 && (
            <StepReady
              key="ready"
              displayName={data.display_name}
              hasPendingInvites={hasPendingInvites}
              onCreateTrip={() => router.push('/trips/new')}
              onCheckInvites={() => router.push('/notifications')}
              onJoinTrip={next ? () => router.push(next) : undefined}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Progress dots — shown on steps 0–2 */}
      {step < totalSteps && (
        <div className="pb-8 flex justify-center">
          <ProgressDots step={step} total={totalSteps} />
        </div>
      )}
    </div>
  )
}
