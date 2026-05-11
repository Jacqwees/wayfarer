import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import MembersView from '@/components/trips/MembersView'

export default async function MembersPage({ params }: { params: { tripId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('trip_members').select('role').eq('trip_id', params.tripId).eq('user_id', user.id).single()
  if (!membership) notFound()

  const { data: members } = await supabase
    .from('trip_members')
    .select('id, user_id, role, users(display_name, avatar_url, email)')
    .eq('trip_id', params.tripId)
    .order('joined_at')

  const { data: permissions } = await supabase
    .from('trip_permissions')
    .select('members_can_edit_info, members_can_add_itinerary, members_can_invite, itinerary_visible_to_viewers')
    .eq('trip_id', params.tripId)
    .single()

  const perms = permissions ?? { members_can_edit_info: false, members_can_add_itinerary: false, members_can_invite: false, itinerary_visible_to_viewers: false }
  const canInvite = membership.role === 'owner' || (membership.role === 'member' && perms.members_can_invite)

  return (
    <MembersView
      tripId={params.tripId}
      myRole={membership.role}
      members={(members ?? []) as any}
      permissions={perms}
      currentUserId={user.id}
      canInvite={canInvite}
    />
  )
}
