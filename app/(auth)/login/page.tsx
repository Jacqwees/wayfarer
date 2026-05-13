'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { requestOtp, ensureUserSetup } from '@/app/actions/auth'
import { Plane } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Suspense } from 'react'

type Stage = 'email' | 'code' | 'verifying' | 'error'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState<Stage>('email')
  const [errorMsg, setErrorMsg] = useState('')
  const [sending, setSending] = useState(false)
  const codeInputRef = useRef<HTMLInputElement>(null)

  // Focus code input when it appears
  useEffect(() => {
    if (stage === 'code') codeInputRef.current?.focus()
  }, [stage])

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || sending) return
    setSending(true)
    setErrorMsg('')

    const result = await requestOtp(email.trim())
    setSending(false)

    if (result.error) {
      setErrorMsg(result.error)
      setStage('error')
    } else {
      setStage('code')
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length < 4 || stage === 'verifying') return
    setStage('verifying')
    setErrorMsg('')

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'magiclink',
    })

    if (error) {
      setErrorMsg('That code didn\'t work. Check it and try again, or go back and resend.')
      setStage('error')
      return
    }

    // Server-side: create profile if new user, convert invitations
    const setup = await ensureUserSetup()
    if (setup.error) {
      setErrorMsg(setup.error)
      setStage('error')
      return
    }

    if (!setup.onboardingComplete) {
      router.replace('/onboarding')
    } else {
      router.replace('/trips')
    }
  }

  function handleCodeChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 8)
    setCode(digits)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <Plane className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">SquadStay</h1>
          <p className="text-muted-foreground text-sm mt-1">Plan trips. Share memories.</p>
        </div>

        <AnimatePresence mode="wait">

          {/* Email stage */}
          {(stage === 'email' || (stage === 'error' && code === '')) && (
            <motion.form
              key="email"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              onSubmit={handleEmailSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
                />
              </div>

              {stage === 'error' && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {errorMsg}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={sending || !email.trim()}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {sending ? 'Sending code…' : 'Send sign-in code'}
              </button>

              <p className="text-center text-xs text-muted-foreground pt-1">
                We&apos;ll email you a sign-in code — no password needed.
              </p>
            </motion.form>
          )}

          {/* Code entry stage */}
          {(stage === 'code' || stage === 'verifying' || (stage === 'error' && code !== '')) && (
            <motion.form
              key="code"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              onSubmit={handleCodeSubmit}
              className="space-y-4"
            >
              <div className="text-center mb-2">
                <p className="text-sm text-muted-foreground">
                  We sent a sign-in code to{' '}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium text-foreground">
                  Enter your code
                </label>
                <input
                  ref={codeInputRef}
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="00000000"
                  maxLength={8}
                  className="w-full h-14 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-2xl font-mono tracking-[0.3em] text-center"
                />
              </div>

              {stage === 'error' && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {errorMsg}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={code.length < 4 || stage === 'verifying'}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {stage === 'verifying' ? 'Signing in…' : 'Sign in'}
              </button>

              <button
                type="button"
                onClick={() => { setCode(''); setStage('email'); setErrorMsg('') }}
                className="w-full text-sm text-muted-foreground text-center underline-offset-2 hover:underline"
              >
                Use a different email or resend code
              </button>
            </motion.form>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
