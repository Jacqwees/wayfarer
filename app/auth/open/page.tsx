'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'
import { Suspense } from 'react'

function isWebview() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // Gmail iOS (GSA), Gmail Android (wv), Facebook, Instagram, LinkedIn
  if (/FBAN|FBAV|Instagram|GSA|LinkedInApp/.test(ua)) return true
  // Android WebView flag
  if (/Android/.test(ua) && /wv/.test(ua)) return true
  // iOS browser without Safari/Chrome/Firefox indicators = likely in-app browser
  if (/iPhone|iPad/.test(ua) && !/Safari\//.test(ua) && !/CriOS\//.test(ua) && !/FxiOS\//.test(ua)) return true
  return false
}

function OpenPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/trips'
  const [inWebview, setInWebview] = useState(false)
  const redirected = useRef(false)

  useEffect(() => {
    const webview = isWebview()
    setInWebview(webview)
    if (!webview && !redirected.current) {
      redirected.current = true
      router.replace(next)
    }
  }, [next, router])

  // Non-webview: show a brief "signed in" flash while redirecting
  if (!inWebview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Plane className="w-7 h-7 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Signing you in…</p>
        </motion.div>
      </div>
    )
  }

  // Webview: show instructions to open in the real browser
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-lg">
            <Plane className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <span className="text-xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">You&apos;re signed in!</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Now open SquadStay in your browser to continue.
          </p>
        </div>

        {/* Open button */}
        <a
          href={next}
          className="block w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-base text-center leading-[48px] mb-6 shadow-sm active:scale-[0.98] transition-transform"
        >
          Open SquadStay →
        </a>

        {/* Instructions */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            If the button doesn&apos;t open the app
          </p>
          <div className="space-y-2 text-sm text-foreground">
            <p>
              <span className="font-semibold">iPhone / Gmail:</span>{' '}
              Tap the <span className="font-mono bg-muted px-1 rounded text-xs">🧭</span> Safari icon in the bottom toolbar.
            </p>
            <p>
              <span className="font-semibold">Android / Gmail:</span>{' '}
              Tap <span className="font-mono bg-muted px-1 rounded text-xs">⋮</span> then <em>Open in Chrome</em>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function OpenPage() {
  return (
    <Suspense>
      <OpenPageInner />
    </Suspense>
  )
}
