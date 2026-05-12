'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Crown, Shield, Eye, MoreVertical, UserX, ArrowRightLeft, Link, ToggleLeft, ToggleRight, LogOut } from 'lucide-react'
import { removeMember, changeRole, transferOwnership, updateTripPermissions, leaveTrip } from '@/app/actions/members'

type Member = {
  id: string
  user_id: string
  role: 'owner' | 'member' | 'viewer'
  users: { display_name: string; avatar_url: string | null; email: string }
}

type Permissions = {
  members_can_edit_info: boolean
  members_can_add_itinerary: boolean
  members_can_invite: boolean
  itinerary_visible_to_viewers: boolean
}

type Props = {
  tripId: string
  myRole: 'owner' | 'member' | 'viewer'
  members: Member[]
  permissions: Permissions
  currentUserId: string
  canInvite: boolean
}

const roleIcon = { owner: Crown, member: Shield, viewer: Eye }
const roleLabel = { owner: 'Owner', member: 'Member', viewer: 'Viewer' }
const roleColor = { owner: 'text-amber-500', member: 'text-primary', viewer: 'text-muted-foreground' }

export default function MembersView({ tripId, myRole, members, permissions: initialPerms, currentUserId, canInvite }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [transferTarget, setTransferTarget] = useState<string | null>(null)
  const [showLeave, setShowLeave] = useState(false)
  const [error, setError] = useState('')
  const [perms, setPerms] = useState(initialPerms)

  const isOwner = myRole === 'owner'

  function handleRemove(userId: string) {
    setOpenMenu(null)
    startTransition(async () => {
      const res = await removeMember(tripId, userId)
      if (res.error) setError(res.error)
    })
  }

  function handleChangeRole(userId: string, role: 'member' | 'viewer') {
    setOpenMenu(null)
    startTransition(async () => {
      const res = await changeRole(tripId, userId, role)
      if (res.error) setError(res.error)
    })
  }

  function handleTransfer(userId: string) {
    setTransferTarget(null)
    startTransition(async () => {
      const res = await transferOwnership(tripId, userId)
      if (res.error) setError(res.error)
    })
  }

  function handleLeave() {
    startTransition(async () => {
      await leaveTrip(tripId)
    })
  }

  function togglePerm(key: keyof typeof perms) {
    const next = { ...perms, [key]: !perms[key] }
    setPerms(next)
    startTransition(async () => {
      await updateTripPermissions(tripId, next)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="min-h-screen bg-background px-5 pt-14 pb-32 max-w-mobile mx-auto"
      onClick={() => setOpenMenu(null)}
    >
      <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground mb-6 -ml-1">
        <ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span>
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-0.5">{members.length} people</p>
          <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">Members</h1>
        </div>
      </div>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 mb-4">{error}</motion.p>
      )}

      <div className="space-y-2 mb-8">
        {members.map(m => {
          const Icon = roleIcon[m.role]
          const isMe = m.user_id === currentUserId
          const initials = m.users.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

          return (
            <div key={m.id} className="relative flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {m.users.avatar_url
                  ? <img src={m.users.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-sm font-semibold text-primary">{initials}</span>}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{m.users.display_name}{isMe ? ' (you)' : ''}</p>
                <div className={`flex items-center gap-1 text-xs ${roleColor[m.role]}`}>
                  <Icon className="w-3 h-3" />
                  <span>{roleLabel[m.role]}</span>
                </div>
              </div>

              {isOwner && !isMe && (
                <button
                  onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === m.id ? null : m.id) }}
                  className="p-1.5 rounded-xl hover:bg-muted transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              )}

              <AnimatePresence>
                {openMenu === m.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-3 top-12 z-10 bg-card border border-border rounded-lg shadow-lg overflow-hidden min-w-44"
                    onClick={e => e.stopPropagation()}
                  >
                    {m.role !== 'member' && (
                      <button onClick={() => handleChangeRole(m.user_id, 'member')}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-muted transition-colors">
                        <Shield className="w-4 h-4 text-primary" /> Make member
                      </button>
                    )}
                    {m.role !== 'viewer' && (
                      <button onClick={() => handleChangeRole(m.user_id, 'viewer')}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-muted transition-colors">
                        <Eye className="w-4 h-4 text-muted-foreground" /> Make viewer
                      </button>
                    )}
                    <button onClick={() => { setOpenMenu(null); setTransferTarget(m.user_id) }}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-muted transition-colors">
                      <ArrowRightLeft className="w-4 h-4 text-amber-500" /> Transfer ownership
                    </button>
                    <button onClick={() => handleRemove(m.user_id)}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                      <UserX className="w-4 h-4" /> Remove
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {isOwner && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Permissions</p>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {([
              ['members_can_edit_info', 'Members can edit trip info'],
              ['members_can_add_itinerary', 'Members can add itinerary items'],
              ['members_can_invite', 'Members can invite others'],
              ['itinerary_visible_to_viewers', 'Itinerary visible to viewers'],
            ] as const).map(([key, label], i, arr) => (
              <button key={key} onClick={() => togglePerm(key)}
                className={`flex items-center justify-between w-full px-4 py-4 text-sm ${i < arr.length - 1 ? 'border-b border-border' : ''} hover:bg-muted/50 transition-colors`}>
                <span className="font-medium text-left">{label}</span>
                {perms[key]
                  ? <ToggleRight className="w-6 h-6 text-primary shrink-0" />
                  : <ToggleLeft className="w-6 h-6 text-muted-foreground shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {canInvite && (
        <button onClick={() => router.push(`/trips/${tripId}/invite`)}
          className="mt-4 w-full h-12 rounded-full border border-primary text-primary font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <Link className="w-4 h-4" /> Invite someone
        </button>
      )}

      {!isOwner && (
        <button onClick={() => setShowLeave(true)}
          className="mt-3 w-full h-12 rounded-full border border-destructive/40 text-destructive font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <LogOut className="w-4 h-4" /> Leave trip
        </button>
      )}

      {/* Leave trip confirmation */}
      <AnimatePresence>
        {showLeave && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setShowLeave(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-card w-full rounded-t-3xl p-6 max-w-mobile mx-auto"
              onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-2">Leave this trip?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                You&apos;ll lose access to all trip content. The owner can re-invite you.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowLeave(false)}
                  className="flex-1 h-12 rounded-2xl border border-border text-sm font-medium">Stay</button>
                <button onClick={handleLeave} disabled={isPending}
                  className="flex-1 h-12 rounded-2xl bg-destructive text-white text-sm font-semibold disabled:opacity-50">
                  Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer ownership confirmation */}
      <AnimatePresence>
        {transferTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setTransferTarget(null)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-card w-full rounded-t-3xl p-6 max-w-mobile mx-auto"
              onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-2">Transfer ownership?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {members.find(m => m.user_id === transferTarget)?.users.display_name} will become the new owner. You&apos;ll become a member.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setTransferTarget(null)}
                  className="flex-1 h-12 rounded-2xl border border-border text-sm font-medium">Cancel</button>
                <button onClick={() => handleTransfer(transferTarget!)}
                  disabled={isPending}
                  className="flex-1 h-12 rounded-2xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-50">
                  Transfer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
