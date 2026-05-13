import { redirect } from 'next/navigation'
import { ensureUserSetup } from '@/app/actions/auth'

/**
 * Server-side setup gate, visited immediately after OTP verification.
 *
 * Why a separate route? verifyOtp (client-side, implicit flow) syncs the
 * session to cookies asynchronously via onAuthStateChange. Calling
 * ensureUserSetup() as a server action immediately after verifyOtp races
 * that sync and often sees no session. By navigating here first, a full
 * browser request is made, the session is guaranteed to be in cookies, and
 * the server action runs correctly.
 */
export default async function SetupPage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  const setup = await ensureUserSetup()

  if (setup.error) {
    // Not authenticated (session never arrived) — back to login
    redirect('/login')
  }

  const next = searchParams.next ?? ''

  if (!setup.onboardingComplete) {
    // New user — go through onboarding, carrying the next param so it
    // survives through to the ready screen
    redirect('/onboarding' + (next ? '?next=' + encodeURIComponent(next) : ''))
  }

  // Existing user — go to the intended destination (or /trips)
  redirect(next || '/trips')
}
