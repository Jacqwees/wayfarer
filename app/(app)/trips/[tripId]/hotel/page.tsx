import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import HotelView from '@/components/trips/HotelView'

export default async function HotelPage({ params }: { params: { tripId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('trip_members').select('role').eq('trip_id', params.tripId).eq('user_id', user.id).single()
  if (!membership) notFound()

  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .eq('trip_id', params.tripId)
    .order('check_in_date')

  const canEdit = membership.role === 'owner' || membership.role === 'member'

  return <HotelView tripId={params.tripId} hotels={hotels ?? []} canEdit={canEdit} />
}
