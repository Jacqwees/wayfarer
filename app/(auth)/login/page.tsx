'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plane } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('loading')
    setErrorMsg('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrorMsg(error.message)
      setState('error')
    } else {
      setState('sent')
    }
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
          {state === 'sent' ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-3"
            >
              <div className="text-4xl">✉️</div>
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We sent a sign-in link to{' '}
                <span className="font-medium text-foreground">{email}</span>.
                Tap it to continue.
              </p>
              <button
                onClick={() => setState('idle')}
                className="text-primary text-sm underline-offset-2 hover:underline mt-2"
              >
                Use a different email
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
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

              {state === 'error' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
                >
                  {errorMsg}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={state === 'loading' || !email.trim()}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {state === 'loading' ? 'Sending link…' : 'Continue with email'}
              </button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                We&apos;ll email you a magic link — no password needed.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
