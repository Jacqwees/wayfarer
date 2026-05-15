'use client'

/**
 * WhatsNewGate — renders nothing visually, but on mount checks whether
 * the user has seen the current changelog version. If not, it navigates
 * to /whats-new so they see what changed.
 *
 * Stored in localStorage as 'squadstay_changelog_seen'.
 * The gate is intentionally non-blocking: if localStorage throws it fails silently.
 */

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { CURRENT_VERSION } from '@/lib/changelog'

export default function WhatsNewGate() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't redirect if we're already on the what's new page
    if (pathname === '/whats-new') return

    try {
      const seen = localStorage.getItem('squadstay_changelog_seen')
      if (seen !== CURRENT_VERSION) {
        router.push('/whats-new')
      }
    } catch {
      // localStorage unavailable — skip silently
    }
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
