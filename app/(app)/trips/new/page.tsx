import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewTripForm from '@/components/trips/NewTripForm'

export default async function NewTripPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="min-h-screen bg-background">
      <NewTripForm userId={user.id} />
    </div>
  )
}
