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
}

const STEPS = ['name', 'details', 'notifications', 'ready'] as const

export default function OnboardingFlow({
  userId,
  initialEmail,
}: {
  userId: string
  initialEmail: string
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
      onboarding_complete: true,
    }).eq('id', userId)

    await supabase.from('privacy_settings').update({
      phone_visibility: data.phone_visibility,
      bio_visibility: data.bio_visibility,
      home_city_visibility: data.home_city_visibility,
    }).eq('user_id', userId)

    // Check for pending invites
    const { data: invites } = await supabase
      .from('invitations')
      .select('id')
      .eq('invited_email', initialEmail.toLowerCase())
      .eq('status', 'pending')
      .limit(1)

    setHasPendingInvites((invites?.length ?? 0) > 0)
    setSaving(false)
    setStep(3) // ready screen
  }

  const totalSteps = STEPS.length - 1 // 'ready' doesn't count

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar — hidden on ready screen */}
      {step < totalSteps && (
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      )}

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
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
