import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
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

  const db = createServiceClient()
  const [{ data: trip }, { data: pending }] = await Promise.all([
    db.from('trips').select('name').eq('id', params.tripId).single(),
    db.from('invitations').select('id, invited_email, invited_role, created_at').eq('trip_id', params.tripId).eq('status', 'pending').order('created_at', { ascending: false }),
  ])

  return (
    <InviteForm
      tripId={params.tripId}
      tripName={trip?.name ?? ''}
      pendingInvitations={(pending ?? []) as { id: string; invited_email: string; invited_role: string; created_at: string }[]}
    />
  )
}
