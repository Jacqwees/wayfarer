import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileView from '@/components/profile/ProfileView'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: privacy } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { count: tripCount } = await supabase
    .from('trip_members')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return <ProfileView profile={profile} privacy={privacy} tripCount={tripCount ?? 0} />
}
