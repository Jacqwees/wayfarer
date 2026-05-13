import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function JoinPage({ params }: { params: { token: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not signed in — send to login, preserving the join link as `next`
  if (!user) {
    redirect(`/login?next=/join/${params.token}`)
  }

  const db = createServiceClient()

  // Validate the token
  const { data: link } = await db
    .from('trip_invite_links' as any)
    .select('trip_id, role')
    .eq('id', params.token)
    .maybeSingle() as { data: { trip_id: string; role: 'member' | 'viewer' } | null }

  if (!link) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="text-5xl">🔗</div>
        <h1 className="font-display italic text-[28px] leading-tight tracking-[-0.01em]">Link not found</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          This invite link is invalid or has been removed by the trip owner.
        </p>
        <Link href="/trips" className="mt-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center">
          Go to my trips
        </Link>
      </div>
    )
  }

  const { data: trip } = await db
    .from('trips').select('name').eq('id', link.trip_id).single()

  // Check if already a member — idempotent join
  const { data: existing } = await db
    .from('trip_members').select('id').eq('trip_id', link.trip_id).eq('user_id', user.id).maybeSingle()

  if (!existing) {
    // Add the user to the trip
    await db.from('trip_members').insert({
      trip_id: link.trip_id,
      user_id: user.id,
      role: link.role,
    })

    // Notify existing members (fire and forget — don't block the redirect)
    const { data: members } = await db
      .from('trip_members').select('user_id').eq('trip_id', link.trip_id).neq('user_id', user.id)
    const { data: profile } = await db
      .from('users').select('display_name').eq('id', user.id).single()

    if (members && members.length > 0) {
      await db.from('notifications').insert(
        members.map((m: any) => ({
          user_id: m.user_id,
          type: 'member_joined',
          trip_id: link.trip_id,
          message: `${profile?.display_name ?? 'Someone'} joined ${trip?.name ?? 'the trip'} via invite link`,
        }))
      )
    }
  }

  // Redirect straight to the trip dashboard
  redirect(`/trips/${link.trip_id}`)
}
