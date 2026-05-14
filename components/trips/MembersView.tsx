'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Shield, Eye, MoreVertical, UserX, ArrowRightLeft, ToggleLeft, ToggleRight, LogOut, UserPlus, Bell } from 'lucide-react'
import NextLink from 'next/link'
import { removeMember, changeRole, transferOwnership, updateTripPermissions, leaveTrip } from '@/app/actions/members'
import { useT } from '@/lib/i18n'

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

export default function MembersView({ tripId, myRole, members, permissions: initialPerms, currentUserId, canInvite }: Props) {
  const router = useRouter()
  const t = useT()
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
    startTransition(async () => { await leaveTrip(tripId) })
  }

  function togglePerm(key: keyof typeof perms) {
    const next = { ...perms, [key]: !perms[key] }
    setPerms(next)
    startTransition(async () => { await updateTripPermissions(tripId, next) })
  }

  const permRows: [keyof Permissions, string][] = [
    ['members_can_edit_info', t.members.permissions.membersCanEditInfo],
    ['members_can_add_itinerary', t.members.permissions.membersCanAddItinerary],
    ['members_can_invite', t.members.permissions.membersCanInvite],
    ['itinerary_visible_to_viewers', t.members.permissions.itineraryVisibleToViewers],
  ]

  function roleLabel(role: Member['role']) {
    if (role === 'owner') return 'Owner'
    if (role === 'member') return 'Editor'
    return 'Viewer'
  }

  function roleBadgeClass(role: Member['role']) {
    if (role === 'owner') return 'text-primary border-primary'
    if (role === 'member') return 'text-foreground border-border'
    return 'text-muted-foreground border-border'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="min-h-screen bg-background pb-32"
      onClick={() => setOpenMenu(null)}
    >
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-0.5">{t.members.people(members.length)}</p>
          <h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">{t.members.title}</h1>
        </div>
        {canInvite && (
          <button onClick={() => router.push(`/trips/${tripId}/invite`)}
            className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 active:scale-[0.98] transition-transform">
            <UserPlus className="w-3.5 h-3.5" /> Invite
          </button>
        )}
      </div>

      {/* Headcount card */}
      <div className="px-4 mb-5">
        <div className="border border-dashed border-border rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-display italic text-[26px] leading-tight tracking-[-0.01em]">{members.length} of us</p>
            <p className="eyebrow mt-1">on this trip</p>
          </div>
          {/* Avatar stack */}
          <div className="flex items-center">
            {members.slice(0, 5).map((m, i) => {
              const initials = m.users.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
              return (
                <div key={m.id} className="w-8 h-8 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center overflow-hidden"
                  style={{ marginLeft: i === 0 ? 0 : -10, zIndex: members.length - i }}>
                  {m.users.avatar_url
                    ? <img src={m.users.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[10px] font-semibold text-primary">{initials}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 mx-4 mb-4">{error}</motion.p>
      )}

      {/* Members list */}
      <div className="px-4 mb-6">
        <p className="eyebrow mb-3 px-1">Members · {members.length}</p>
        <div>
          {members.map(m => {
            const isMe = m.user_id === currentUserId
            const initials = m.users.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
            return (
              <div key={m.id} className="relative flex items-center gap-3 py-3 border-b border-dashed border-border last:border-0">
                <NextLink href={isMe ? '/profile' : `/profile/${m.user_id}`}
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 overflow-hidden">
                  {m.users.avatar_url
                    ? <img src={m.users.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="font-display italic text-primary-foreground text-lg leading-none">{initials[0]}</span>}
                </NextLink>

                <NextLink href={isMe ? '/profile' : `/profile/${m.user_id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-[14px] text-foreground tracking-[-0.01em] truncate">
                      {m.users.display_name}
                    </p>
                    {isMe && <span className="font-mono text-[8px] text-muted-foreground tracking-[0.18em] uppercase">You</span>}
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5 tracking-[0.03em]">{m.users.email}</p>
                </NextLink>

                <span className={`font-mono text-[9px] tracking-[0.15em] uppercase px-2 py-1 rounded border ${roleBadgeClass(m.role)}`}>
                  {roleLabel(m.role)}
                </span>

                {isOwner && !isMe && (
                  <button
                    onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === m.id ? null : m.id) }}
                    className="p-1.5 rounded-xl active:bg-muted transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}

                <AnimatePresence>
                  {openMenu === m.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-14 z-10 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-44"
                      onClick={e => e.stopPropagation()}
                    >
                      {m.role !== 'member' && (
                        <button onClick={() => handleChangeRole(m.user_id, 'member')}
                          className="flex items-center gap-2 w-full px-4 py-3 text-sm active:bg-muted transition-colors">
                          <Shield className="w-4 h-4 text-primary" /> {t.members.actions.makeMember}
                        </button>
                      )}
                      {m.role !== 'viewer' && (
                        <button onClick={() => handleChangeRole(m.user_id, 'viewer')}
                          className="flex items-center gap-2 w-full px-4 py-3 text-sm active:bg-muted transition-colors">
                          <Eye className="w-4 h-4 text-muted-foreground" /> {t.members.actions.makeViewer}
                        </button>
                      )}
                      <button onClick={() => { setOpenMenu(null); setTransferTarget(m.user_id) }}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm active:bg-muted transition-colors">
                        <ArrowRightLeft className="w-4 h-4 text-amber-500" /> {t.members.actions.transferOwnership}
                      </button>
                      <button onClick={() => handleRemove(m.user_id)}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-destructive active:bg-destructive/10 transition-colors">
                        <UserX className="w-4 h-4" /> {t.members.actions.remove}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {/* Permissions (owner only) */}
      {isOwner && (
        <div className="px-4 mb-5">
          <p className="eyebrow mb-3 px-1">{t.members.permissions.heading}</p>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {permRows.map(([key, label], i) => (
              <button key={key} onClick={() => togglePerm(key)}
                className={`flex items-center justify-between w-full px-4 py-4 text-sm ${i < permRows.length - 1 ? 'border-b border-dashed border-border' : ''} active:bg-muted/50 transition-colors`}>
                <span className="font-medium text-left text-[13.5px]">{label}</span>
                {perms[key]
                  ? <ToggleRight className="w-6 h-6 text-primary shrink-0" />
                  : <ToggleLeft className="w-6 h-6 text-muted-foreground shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 space-y-2">
        {!isOwner && (
          <button onClick={() => setShowLeave(true)}
            className="w-full h-12 rounded-full border border-destructive/40 text-destructive font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <LogOut className="w-4 h-4" /> {t.members.actions.leaveTrip}
          </button>
        )}
      </div>

      {/* Leave confirmation */}
      <AnimatePresence>
        {showLeave && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setShowLeave(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="bg-card w-full rounded-t-[28px] p-6"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <h2 className="font-display italic text-[22px] mb-2">{t.members.confirmLeave.title}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t.members.confirmLeave.body}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLeave(false)}
                  className="flex-1 h-12 rounded-full border border-border text-sm font-medium">{t.members.confirmLeave.cancel}</button>
                <button onClick={handleLeave} disabled={isPending}
                  className="flex-1 h-12 rounded-full bg-destructive text-white text-sm font-semibold disabled:opacity-50">{t.members.confirmLeave.confirm}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer confirmation */}
      <AnimatePresence>
        {transferTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end"
            onClick={() => setTransferTarget(null)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="bg-card w-full rounded-t-[28px] p-6"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <h2 className="font-display italic text-[22px] mb-2">{t.members.confirmTransfer.title}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t.members.confirmTransfer.body(members.find(m => m.user_id === transferTarget)?.users.display_name ?? '')}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setTransferTarget(null)}
                  className="flex-1 h-12 rounded-full border border-border text-sm font-medium">{t.members.confirmTransfer.cancel}</button>
                <button onClick={() => handleTransfer(transferTarget!)} disabled={isPending}
                  className="flex-1 h-12 rounded-full bg-amber-500 text-white text-sm font-semibold disabled:opacity-50">{t.members.confirmTransfer.confirm}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
