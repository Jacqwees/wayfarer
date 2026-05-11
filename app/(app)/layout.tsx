import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/shared/BottomNav'
import RealtimeProvider from '@/components/shared/RealtimeProvider'
import PushSubscriber from '@/components/shared/PushSubscriber'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return (
    <div className="relative min-h-screen">
      <RealtimeProvider userId={user.id} />
      <PushSubscriber />
      {children}
      <BottomNav unreadCount={unreadCount ?? 0} />
    </div>
  )
}
