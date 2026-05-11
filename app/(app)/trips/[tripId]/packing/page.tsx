import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import PackingView from '@/components/trips/PackingView'

export default async function PackingPage({ params }: { params: { tripId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: membership } = await db.from('trip_members').select('role').eq('trip_id', params.tripId).eq('user_id', user.id).single()
  if (!membership) notFound()

  const [{ data: items }, { data: members }] = await Promise.all([
    db.from('packing_items').select('id, label, packed, assigned_to, added_by').eq('trip_id', params.tripId).order('created_at'),
    db.from('trip_members').select('user_id, users(display_name)').eq('trip_id', params.tripId),
  ])

  return (
    <PackingView
      tripId={params.tripId}
      items={(items ?? []) as any}
      members={(members ?? []).map(m => ({ user_id: m.user_id, display_name: (m.users as any)?.display_name ?? '' }))}
      currentUserId={user.id}
      isOwner={membership.role === 'owner'}
    />
  )
}
