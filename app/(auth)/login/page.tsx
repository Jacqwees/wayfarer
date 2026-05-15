'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { requestOtp } from '@/app/actions/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Suspense } from 'react'

const HERO_GRADIENT =
  'radial-gradient(120% 80% at 30% 110%, #FFB766 0%, #E8754A 28%, #B33E4F 55%, #4A1F4C 85%)'

type Mode = 'signup' | 'signin'
type Stage = 'form' | 'code' | 'verifying' | 'error'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const prefillEmail = params.get('email') ?? ''
  const prefillMode = (params.get('mode') as Mode) ?? 'signup'
  const nextPath = params.get('next') ?? ''

  const [mode, setMode] = useState<Mode>(prefillMode)
  const [stage, setStage] = useState<Stage>('form')
  const [email, setEmail] = useState(prefillEmail)
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [errorMsg, setErrorMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [resent, setResent] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const digitRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (stage === 'form') emailRef.current?.focus()
    if (stage === 'code') digitRefs.current[0]?.focus()
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

  async function handleCodeSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const code = digits.join('')
    if (code.length < 6 || stage === 'verifying') return
    setStage('verifying')
    setErrorMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type: 'magiclink',
    })
    if (error) {
      setErrorMsg("That code didn't work — check it and try again.")
      setStage('error')
      return
    }
    router.replace('/auth/setup' + (nextPath ? '?next=' + encodeURIComponent(nextPath) : ''))
  }

  function handleDigitInput(idx: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = digit
    setDigits(next)
    setErrorMsg('')
    if (digit && idx < 5) digitRefs.current[idx + 1]?.focus()
    if (digit && idx === 5) {
      // auto-submit when last digit filled
      const code = next.join('')
      if (code.length === 6) handleCodeSubmit()
    }
  }

  function handleDigitKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits]
      next[idx - 1] = ''
      setDigits(next)
      digitRefs.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    const focusIdx = Math.min(pasted.length, 5)
    digitRefs.current[focusIdx]?.focus()
    if (pasted.length === 6) handleCodeSubmit()
  }

  async function handleResend() {
    if (resent) return
    await requestOtp(email.trim())
    setResent(true)
    setTimeout(() => setResent(false), 2400)
  }

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden"
      style={{ background: HERO_GRADIENT }}
    >
      {/* Gradient overlays */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(80% 60% at 50% 0%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* ── Poster top bar ─────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-5">
        <a href="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ border: '1.2px dashed rgba(252,248,238,0.7)' }}
          >
            <span className="font-display italic text-white/90 text-[15px] leading-none">SS</span>
          </div>
          <span className="font-semibold text-white text-[15px] tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            squad<span style={{ color: '#FFB766' }}>stay</span>
          </span>
        </a>
        <a
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70 font-medium"
        >
          ← Home
        </a>
      </div>

      {/* ── Floating mini postcards ─────────────────────── */}
      <div className="absolute top-14 right-5 z-10 pointer-events-none" style={{ width: 120 }}>
        {/* Amalfi postcard */}
        <div
          className="absolute overflow-hidden rounded-[4px] shadow-xl"
          style={{
            top: 46, right: 0, width: 110,
            border: '1px solid rgba(255,255,255,0.5)',
            transform: 'rotate(6deg)',
            background: '#FCF8EE',
          }}
        >
          {/* yellow tape */}
          <div style={{
            position: 'absolute', top: -4, left: 12,
            width: 30, height: 10, background: 'rgba(248,236,184,0.6)',
            transform: 'rotate(-4deg)', borderRadius: 1,
          }} />
          <div style={{ aspectRatio: '4/3', background: 'radial-gradient(110% 90% at 50% 100%, #FFE7B0 0%, #F5A35E 25%, #D9494B 55%, #1C3C5A 92%)' }} />
          <div className="flex justify-between items-baseline px-2 py-1">
            <span className="font-display italic text-[11px]" style={{ color: '#1B1A18' }}>Amalfi</span>
            <span className="font-mono text-[7px] uppercase tracking-[0.15em]" style={{ color: '#928873' }}>5d · 4 ppl</span>
          </div>
        </div>
        {/* Kyoto postcard */}
        <div
          className="absolute overflow-hidden rounded-[4px] shadow-xl"
          style={{
            top: 66, right: 70, width: 96,
            border: '1px solid rgba(255,255,255,0.5)',
            transform: 'rotate(-8deg)',
            background: '#FCF8EE',
          }}
        >
          <div style={{ aspectRatio: '4/3', background: 'radial-gradient(120% 90% at 70% 0%, #F4B5C8 0%, #C26F8B 30%, #5E3A6E 60%, #1D1B3A 90%)' }} />
          <div className="flex justify-between items-baseline px-2 py-1">
            <span className="font-display italic text-[11px]" style={{ color: '#1B1A18' }}>Kyoto</span>
            <span className="font-mono text-[7px] uppercase tracking-[0.15em]" style={{ color: '#928873' }}>spring</span>
          </div>
        </div>
        {/* SS postmark circle */}
        <div
          className="absolute flex items-center justify-center text-center"
          style={{
            top: 70, right: 158, width: 70, height: 70, borderRadius: '50%',
            border: '1.2px dashed rgba(252,248,238,0.5)',
            color: 'rgba(252,248,238,0.85)',
            transform: 'rotate(-12deg)',
          }}
        >
          <div>
            <div className="font-display italic text-[22px] text-white leading-none" style={{ letterSpacing: '-0.01em' }}>SS</div>
            <div className="font-mono text-[7px] uppercase tracking-[0.22em] leading-relaxed" style={{ color: 'rgba(252,248,238,0.85)' }}>Plan · Go{'\n'}Settle</div>
          </div>
        </div>
      </div>

      {/* ── Hero headline ───────────────────────────────── */}
      <div className="relative z-10 px-6 mt-20 mb-8">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] mb-5" style={{ color: 'rgba(252,248,238,0.78)' }}>
          Welcome aboard, traveller
        </p>
        <h1
          className="font-display italic text-white leading-[0.92]"
          style={{ fontSize: 56, letterSpacing: '-0.025em', maxWidth: '11ch', textWrap: 'balance' }}
        >
          where are we off to, together?
        </h1>
        <p className="mt-4 text-sm leading-relaxed max-w-[28ch]" style={{ color: 'rgba(252,248,238,0.88)' }}>
          Plan group holidays with your crew. Share the itinerary, split the tab, settle up before you land.
        </p>
        <ul className="mt-5 flex flex-col gap-2.5 list-none p-0">
          {[
            { svg: <path d="M22 16.92l-9 5.08L4 17V9l9-5 9 5z" />, text: 'Shared itinerary, flights & hotel' },
            { svg: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />, text: 'Expenses split automatically' },
            { svg: <path d="M20 6L9 17l-5-5" />, text: 'Everyone stays in the loop' },
          ].map((f, i) => (
            <li key={i} className="flex items-center gap-3" style={{ color: 'rgba(252,248,238,0.95)', fontSize: 13.5 }}>
              <span
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(252,248,238,0.16)', border: '1px solid rgba(252,248,238,0.25)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{f.svg}</svg>
              </span>
              {f.text}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Form panel ──────────────────────────────────── */}
      <div
        className="relative z-20"
        style={{
          background: '#F4EDE0',
          borderRadius: '24px 24px 0 0',
          marginTop: -22,
          paddingBottom: 40,
          boxShadow: '0 -20px 40px -20px rgba(0,0,0,0.25)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div style={{ width: 42, height: 4, borderRadius: 2, background: '#D9CFB9' }} />
        </div>

        <div className="px-6 pt-1">
          {/* Mode toggle */}
          <div
            className="flex w-full mt-3.5 mb-6"
            style={{ background: '#F7F0E1', border: '1px solid #E5DCC7', borderRadius: 999, padding: 3 }}
          >
            {(['signup', 'signin'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setStage('form'); setErrorMsg('') }}
                className="flex-1 py-2.5 text-[13px] font-medium transition-all"
                style={{
                  borderRadius: 999,
                  border: 'none',
                  background: mode === m ? '#1B1A18' : 'transparent',
                  color: mode === m ? '#FCF8EE' : '#5C544A',
                  boxShadow: mode === m ? '0 3px 8px -3px rgba(0,0,0,0.25)' : 'none',
                }}
              >
                {m === 'signup' ? 'Sign up' : 'Sign in'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── Email form state ── */}
            {(stage === 'form' || (stage === 'error' && digits.every(d => d === ''))) && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                {/* Eyebrow + title */}
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] mb-2.5" style={{ color: '#928873' }}>
                  {mode === 'signup' ? 'Start free · 60 seconds' : 'Welcome back'}
                </p>
                <h2 className="font-display text-[32px] leading-[1.02] mb-2.5" style={{ color: '#1B1A18', letterSpacing: '-0.02em', textWrap: 'balance' }}>
                  {mode === 'signup'
                    ? <><em>Begin</em> the trip,<br />not the spreadsheet.</>
                    : <><em>Right where</em><br />you left off.</>}
                </h2>
                <p className="text-[14.5px] leading-relaxed mb-6" style={{ color: '#5C544A', textWrap: 'pretty' }}>
                  {mode === 'signup'
                    ? "No card, no app store. We'll email a 6-digit code to sign you in."
                    : "We'll email a 6-digit sign-in code. No passwords to forget."}
                </p>

                {/* SSO */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {[
                    {
                      label: 'Google',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      ),
                    },
                    {
                      label: 'Apple',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                      ),
                    },
                  ].map(({ label, icon }) => (
                    <button
                      key={label}
                      className="flex items-center justify-center gap-2.5 py-3 text-[14px] font-medium transition-colors"
                      style={{ background: '#FCF8EE', border: '1px solid #D9CFB9', borderRadius: 12, color: '#1B1A18' }}
                      onClick={() => {/* SSO not wired yet */}}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>

                {/* Dashed OR divider */}
                <div
                  className="flex items-center gap-3 my-4 font-mono text-[9.5px] uppercase tracking-[0.22em]"
                  style={{ color: '#928873' }}
                >
                  <div className="flex-1 h-px" style={{ background: 'repeating-linear-gradient(to right, #D9CFB9 0, #D9CFB9 4px, transparent 4px, transparent 8px)' }} />
                  or with email
                  <div className="flex-1 h-px" style={{ background: 'repeating-linear-gradient(to right, #D9CFB9 0, #D9CFB9 4px, transparent 4px, transparent 8px)' }} />
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  {mode === 'signup' && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'first', label: 'First name', placeholder: 'Jamie', autoComplete: 'given-name' },
                        { id: 'last', label: 'Last name', placeholder: 'Morrow', autoComplete: 'family-name' },
                      ].map(({ id, label, placeholder, autoComplete }) => (
                        <div key={id}>
                          <label htmlFor={id} className="block font-mono text-[9.5px] uppercase tracking-[0.22em] mb-1.5" style={{ color: '#928873' }}>
                            {label}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#928873' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>
                            </span>
                            <input
                              id={id}
                              type="text"
                              placeholder={placeholder}
                              autoComplete={autoComplete}
                              className="w-full pl-9 pr-3.5 py-3.5 text-[15px] outline-none transition-all"
                              style={{ background: '#FCF8EE', border: '1px solid #D9CFB9', borderRadius: 12, color: '#1B1A18', fontFamily: 'inherit' }}
                              onFocus={e => { e.currentTarget.style.borderColor = '#E0533A'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(224,83,58,0.12)' }}
                              onBlur={e => { e.currentTarget.style.borderColor = '#D9CFB9'; e.currentTarget.style.boxShadow = 'none' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label htmlFor="email-input" className="block font-mono text-[9.5px] uppercase tracking-[0.22em] mb-1.5" style={{ color: '#928873' }}>
                      {mode === 'signup' ? 'Your email' : 'Email'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#928873' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                      </span>
                      <input
                        ref={emailRef}
                        id="email-input"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="jamie@yourcrew.co"
                        autoComplete="email"
                        required
                        className="w-full pl-10 pr-3.5 py-3.5 text-[15px] outline-none transition-all"
                        style={{ background: '#FCF8EE', border: '1px solid #D9CFB9', borderRadius: 12, color: '#1B1A18', fontFamily: 'inherit' }}
                        onFocus={e => { e.currentTarget.style.borderColor = '#E0533A'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(224,83,58,0.12)' }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#D9CFB9'; e.currentTarget.style.boxShadow = 'none' }}
                      />
                    </div>
                  </div>

                  {stage === 'error' && errorMsg && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm px-3 py-2 rounded-xl"
                      style={{ color: '#A53A26', background: 'rgba(224,83,58,0.08)' }}
                    >
                      {errorMsg}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={sending || !email.trim()}
                    className="w-full flex items-center justify-center gap-2 font-semibold text-[15px] transition-all active:scale-[0.985]"
                    style={{
                      height: 52, borderRadius: 14, marginTop: 4,
                      background: sending || !email.trim() ? '#928873' : '#E0533A',
                      color: '#FCF8EE', border: 'none',
                    }}
                  >
                    Send me a sign-in code
                    <span className="inline-block transition-transform" style={{ transform: 'translateX(0)' }}>→</span>
                  </button>

                  <div className="flex items-center justify-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em] mt-2" style={{ color: '#928873' }}>
                    <span>No password</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#928873', display: 'inline-block' }} />
                    <span>6-digit code</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#928873', display: 'inline-block' }} />
                    <span>15 min</span>
                  </div>
                </form>

                <div className="mt-5 pt-4 text-center text-[12px] leading-relaxed" style={{ borderTop: '1px dashed #D9CFB9', color: '#5C544A' }}>
                  {mode === 'signup'
                    ? <>By signing up you agree to our{' '}<a href="#" style={{ color: '#E0533A', fontWeight: 500 }}>Terms</a>{' '}&amp;{' '}<a href="#" style={{ color: '#E0533A', fontWeight: 500 }}>Privacy</a>. We don&apos;t sell your data.</>
                    : <>Trouble signing in? <a href="mailto:hello@squadstay.co.uk" style={{ color: '#E0533A', fontWeight: 500 }}>Email us</a>.</>}
                </div>
              </motion.div>
            )}

            {/* ── Code entry state ── */}
            {(stage === 'code' || stage === 'verifying' || (stage === 'error' && digits.some(d => d !== ''))) && (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center text-center"
              >
                {/* Envelope badge */}
                <div
                  className="flex items-center justify-center mb-4 relative"
                  style={{ width: 76, height: 76, borderRadius: '50%', background: '#FCF8EE', border: '1.4px dashed #E0533A', color: '#E0533A' }}
                >
                  <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '1px solid #E5DCC7' }} />
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </div>

                <p className="font-mono text-[10px] uppercase tracking-[0.24em] mb-1.5" style={{ color: '#928873' }}>Code sent</p>
                <h3 className="font-display italic text-[28px] leading-[1.1] mb-3" style={{ color: '#1B1A18', letterSpacing: '-0.02em' }}>
                  Check your inbox.
                </h3>
                <p className="text-[14px] leading-relaxed mb-3 max-w-[32ch]" style={{ color: '#5C544A' }}>
                  We just emailed a 6-digit code to the address below. Good for 15 minutes.
                </p>
                <div
                  className="font-mono text-[12px] mb-4 px-3.5 py-2 rounded-full"
                  style={{ background: '#FCF8EE', border: '1px solid #D9CFB9', color: '#1B1A18' }}
                >
                  {email}
                </div>

                {/* 6-digit boxes */}
                <div className="flex items-center gap-2 mb-2" onPaste={handlePaste}>
                  {[0, 1, 2].map(i => (
                    <input
                      key={i}
                      ref={el => { digitRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      autoComplete={i === 0 ? 'one-time-code' : undefined}
                      value={digits[i]}
                      onChange={e => handleDigitInput(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      className="text-center outline-none transition-all"
                      style={{
                        width: 40, height: 52, borderRadius: 10,
                        border: `1px solid ${digits[i] ? '#E0533A' : '#D9CFB9'}`,
                        background: digits[i] ? '#fff' : '#FCF8EE',
                        fontFamily: '"Newsreader", serif', fontStyle: 'italic',
                        fontSize: 28, color: '#1B1A18',
                        boxShadow: digits[i] ? '0 0 0 4px rgba(224,83,58,0.12)' : 'none',
                      }}
                    />
                  ))}
                  <span style={{ color: '#928873', fontSize: 22, padding: '0 2px' }}>·</span>
                  {[3, 4, 5].map(i => (
                    <input
                      key={i}
                      ref={el => { digitRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digits[i]}
                      onChange={e => handleDigitInput(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      className="text-center outline-none transition-all"
                      style={{
                        width: 40, height: 52, borderRadius: 10,
                        border: `1px solid ${digits[i] ? '#E0533A' : '#D9CFB9'}`,
                        background: digits[i] ? '#fff' : '#FCF8EE',
                        fontFamily: '"Newsreader", serif', fontStyle: 'italic',
                        fontSize: 28, color: '#1B1A18',
                        boxShadow: digits[i] ? '0 0 0 4px rgba(224,83,58,0.12)' : 'none',
                      }}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {stage === 'error' && errorMsg && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[12px] font-mono tracking-[0.04em] mb-2"
                      style={{ color: '#A53A26' }}
                    >
                      {errorMsg}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => handleCodeSubmit()}
                  disabled={digits.join('').length < 6 || stage === 'verifying'}
                  className="flex items-center justify-center gap-2 font-semibold text-[15px] transition-all active:scale-[0.985] w-full max-w-xs"
                  style={{
                    height: 52, borderRadius: 14, marginTop: 6,
                    background: digits.join('').length < 6 ? '#928873' : '#E0533A',
                    color: '#FCF8EE', border: 'none', opacity: stage === 'verifying' ? 0.7 : 1,
                  }}
                >
                  {stage === 'verifying' ? 'Signing you in…' : <>Verify &amp; sign in →</>}
                </button>

                <div className="flex items-center gap-2 mt-4" style={{ color: '#D9CFB9', fontSize: 12 }}>
                  <button
                    className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-medium"
                    style={{ color: '#E0533A', background: 'none', border: 'none', padding: '8px' }}
                    onClick={() => { setDigits(['', '', '', '', '', '']); setStage('form'); setErrorMsg('') }}
                  >
                    ↻ Use a different email
                  </button>
                  <span>·</span>
                  <button
                    className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-medium"
                    style={{ color: resent ? '#5B7556' : '#E0533A', background: 'none', border: 'none', padding: '8px' }}
                    onClick={handleResend}
                  >
                    {resent ? 'Sent ✓' : 'Resend code'}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
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
