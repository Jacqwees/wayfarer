'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { requestOtp } from '@/app/actions/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Suspense } from 'react'
import { ArrowRight } from 'lucide-react'

// Voyage Press hero — Lisbon warm sunset gradient
const HERO_GRADIENT =
  'radial-gradient(120% 80% at 30% 110%, #FFB766 0%, #E8754A 28%, #B33E4F 55%, #4A1F4C 85%)'

type Stage = 'landing' | 'email' | 'code' | 'verifying' | 'error'

const FEATURES = [
  { glyph: '✈', text: 'Shared itinerary, flights & hotel' },
  { glyph: '£', text: 'Expenses split automatically' },
  { glyph: '✓', text: 'Everyone stays in the loop' },
]

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const prefill = params.get('email') ?? ''
  const nextPath = params.get('next') ?? ''

  const [email, setEmail] = useState(prefill)
  const [code, setCode] = useState('')
  // Invitation links pre-fill the email — skip the landing page
  const [stage, setStage] = useState<Stage>(prefill ? 'email' : 'landing')
  const [errorMsg, setErrorMsg] = useState('')
  const [sending, setSending] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (stage === 'email' && !prefill) emailRef.current?.focus()
    if (stage === 'code') codeRef.current?.focus()
  }, [stage, prefill])

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
      setErrorMsg("That code didn't work — check it and try again, or go back.")
      setStage('error')
      return
    }
    router.replace('/auth/setup' + (nextPath ? '?next=' + encodeURIComponent(nextPath) : ''))
  }

  function handleCodeChange(val: string) {
    setCode(val.replace(/\D/g, '').slice(0, 8))
  }

  const sheetVisible = stage !== 'landing'

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden select-none"
      style={{ background: HERO_GRADIENT }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.52) 100%)' }}
      />

      {/* SS stamp + wordmark */}
      <div className="absolute top-14 left-5 z-10 flex flex-col gap-2">
        <div className="w-10 h-10 rounded-full border border-dashed border-white/55 flex items-center justify-center">
          <span className="font-display italic text-white/90 text-lg leading-none">SS</span>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/55">
          squadstay · 2025
        </p>
      </div>

      {/* ── Hero content (landing only) ─────────────────────────── */}
      <AnimatePresence>
        {stage === 'landing' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-x-0 z-10 px-5"
            style={{ bottom: '220px' }}
          >
            <h1
              className="font-display italic text-white leading-[0.92] tracking-[-0.02em]"
              style={{ fontSize: 'clamp(42px, 13vw, 56px)' }}
            >
              where are<br />we off to,<br />together?
            </h1>
            <p className="mt-4 text-white/80 text-sm leading-relaxed max-w-[280px]">
              Plan group holidays with your crew. Split the tab. Settle up before you land.
            </p>

            {/* Feature list */}
            <div className="mt-5 flex flex-col gap-2.5">
              {FEATURES.map((f) => (
                <div key={f.glyph} className="flex items-center gap-3">
                  <span className="font-mono text-white/45 text-xs w-4 flex-shrink-0">{f.glyph}</span>
                  <span className="text-white/80 text-[13px]">{f.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom CTAs (landing only) ──────────────────────────── */}
      <AnimatePresence>
        {stage === 'landing' && (
          <motion.div
            key="ctas"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="absolute inset-x-0 bottom-0 z-10 px-5 pb-10 flex flex-col gap-3"
          >
            <button
              onClick={() => setStage('email')}
              className="w-full h-14 rounded-full bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-xl"
            >
              Get started free
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setStage('email')}
              className="w-full h-12 rounded-full font-medium text-sm border border-white/25 text-white/75 flex items-center justify-center active:scale-[0.98] transition-transform"
            >
              Already a member? Sign in
            </button>
            <p className="text-center text-white/35 text-[11px] pb-1 font-mono tracking-wide">
              NO PASSWORD · JUST A SIGN-IN CODE
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Form bottom sheet ───────────────────────────────────── */}
      <AnimatePresence>
        {sheetVisible && (
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 z-20 bg-background rounded-t-[28px] px-6 pt-5 pb-10"
            style={{ minHeight: '58vh' }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />

            {/* Mini wordmark */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <span className="font-display italic text-primary-foreground text-[15px] leading-none">SS</span>
              </div>
              <span className="font-semibold text-foreground text-[15px] tracking-tight">SquadStay</span>
            </div>

            {/* Perforated divider */}
            <svg height="2" width="100%" className="mb-5">
              <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
            </svg>

            <AnimatePresence mode="wait">

              {/* ── Email form ── */}
              {(stage === 'email' || (stage === 'error' && code === '')) && (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleEmailSubmit}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="font-display italic text-[28px] leading-[0.92] text-foreground">
                      {prefill ? "You're invited." : 'Plan your next trip.'}
                    </h2>
                    <p className="mt-1.5 text-muted-foreground text-sm">
                      {prefill
                        ? 'Enter your email to join the squad.'
                        : "Enter your email — we'll send a sign-in code."}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="eyebrow">Email address</label>
                    <input
                      ref={emailRef}
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus={!prefill}
                      className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
                    />
                  </div>

                  {stage === 'error' && errorMsg && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2"
                    >
                      {errorMsg}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={sending || !email.trim()}
                    className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-sm disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {sending ? 'Sending code…' : 'Send sign-in code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStage('landing'); setErrorMsg('') }}
                    className="w-full text-sm text-muted-foreground text-center pt-0.5"
                  >
                    ← Back
                  </button>
                </motion.form>
              )}

              {/* ── Code form ── */}
              {(stage === 'code' || stage === 'verifying' || (stage === 'error' && code !== '')) && (
                <motion.form
                  key="code"
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 14 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleCodeSubmit}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="font-display italic text-[28px] leading-[0.92] text-foreground">
                      Check your inbox.
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Code sent to{' '}
                      <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="code" className="eyebrow">Sign-in code</label>
                    <input
                      ref={codeRef}
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder="·  ·  ·  ·  ·  ·"
                      maxLength={8}
                      autoFocus
                      className="w-full h-16 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-[28px] font-mono tracking-[0.4em] text-center"
                    />
                  </div>

                  {stage === 'error' && errorMsg && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2"
                    >
                      {errorMsg}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={code.length < 4 || stage === 'verifying'}
                    className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-sm disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {stage === 'verifying' ? 'Signing in…' : 'Sign in →'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setCode(''); setStage('email'); setErrorMsg('') }}
                    className="w-full text-sm text-muted-foreground text-center pt-0.5"
                  >
                    Wrong email or resend code ← Back
                  </button>
                </motion.form>
              )}

            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
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
