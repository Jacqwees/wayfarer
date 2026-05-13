'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, MapPin, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

function joinedLabel(createdAt: string | null) {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  return `joined ${d.toLocaleDateString('en-GB', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
}

function StatCol({ num, label }: { num: string | number; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-3">
      <span className="font-display italic text-[24px] leading-none tracking-[-0.01em] text-foreground">{num}</span>
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mt-1">{label}</span>
    </div>
  )
}

type PublicStats = { trips: number; countries: number; daysAway: number; squad: number }

export default function PublicProfileView({
  profile,
  visibleBio,
  visibleHomeCity,
  stats,
}: {
  profile: { id: string; display_name: string; avatar_url: string | null; created_at: string | null }
  visibleBio: string | null
  visibleHomeCity: string | null
  stats: PublicStats
}) {
  const router = useRouter()

  const eyebrow = [
    visibleHomeCity,
    joinedLabel(profile.created_at),
  ].filter(Boolean).join(' · ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="min-h-screen bg-background pb-32"
    >
      {/* Back */}
      <div className="px-5 pt-14 pb-2">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground -ml-1">
          <ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span>
        </button>
      </div>

      {/* Hero */}
      <div className="px-5 pb-4 text-center">
        <div className="inline-block">
          <div className="w-[92px] h-[92px] rounded-full bg-primary/20 overflow-hidden">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-display italic text-[44px]">
                {(profile.display_name[0] ?? '?').toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <h1 className="font-display italic text-[26px] leading-tight tracking-[-0.01em] text-foreground mt-3.5">
          {profile.display_name}
        </h1>
        {eyebrow && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1.5">{eyebrow}</p>
        )}
      </div>

      <div className="px-4 space-y-4">
        {/* Stats row */}
        <div className="bg-card border border-border rounded-2xl flex overflow-hidden">
          <StatCol num={stats.trips} label="Trips" />
          <div className="w-px bg-border my-2" />
          <StatCol num={stats.countries} label="Countries" />
          <div className="w-px bg-border my-2" />
          <StatCol num={stats.daysAway} label="Days away" />
          <div className="w-px bg-border my-2" />
          <StatCol num={stats.squad} label="Squad" />
        </div>

        {/* Bio */}
        {visibleBio && (
          <div className="bg-card border border-border rounded-2xl px-4 py-4">
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed">{visibleBio}</p>
            </div>
          </div>
        )}

        {/* Travel tags */}
        {(profile as any).travel_tags?.length > 0 && (
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mb-2.5 px-1">Travel style</p>
            <div className="flex flex-wrap gap-2">
              {((profile as any).travel_tags as string[]).map(tag => (
                <span key={tag} className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  ● {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
