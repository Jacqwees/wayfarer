import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_complete) redirect(searchParams.next || '/trips')

  return <OnboardingFlow userId={user.id} initialEmail={user.email ?? ''} next={searchParams.next} />
}
