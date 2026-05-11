import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ExpensesView from '@/components/trips/ExpensesView'

export default async function ExpensesPage({ params }: { params: { tripId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('trip_members').select('role').eq('trip_id', params.tripId).eq('user_id', user.id).single()
  if (!membership) notFound()

  if (membership.role === 'viewer') redirect(`/trips/${params.tripId}`)

  const { data: members } = await supabase
    .from('trip_members')
    .select('user_id, users(display_name, avatar_url)')
    .eq('trip_id', params.tripId)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, expense_splits(*)')
    .eq('trip_id', params.tripId)
    .order('created_at', { ascending: false })

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('trip_id', params.tripId)
    .order('created_at', { ascending: false })

  const membersFlat = (members ?? []).map(m => ({
    user_id: m.user_id,
    display_name: (m.users as any)?.display_name ?? '',
    avatar_url: (m.users as any)?.avatar_url ?? null,
  }))

  return (
    <ExpensesView
      tripId={params.tripId}
      currentUserId={user.id}
      members={membersFlat}
      expenses={(expenses ?? []) as any}
      payments={payments ?? []}
    />
  )
}
