import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import InviteForm from '@/components/trips/InviteForm'

export default async function InvitePage({ params }: { params: { tripId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase.from('trip_members').select('role').eq('trip_id', params.tripId).eq('user_id', user.id).single()
  if (!membership) notFound()

  const { data: perms } = await supabase.from('trip_permissions').select('members_can_invite').eq('trip_id', params.tripId).single()
  if (membership.role !== 'owner' && !perms?.members_can_invite) redirect(`/trips/${params.tripId}`)

  const { data: trip } = await supabase.from('trips').select('name').eq('id', params.tripId).single()

  return <InviteForm tripId={params.tripId} tripName={trip?.name ?? ''} />
}
