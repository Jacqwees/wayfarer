'use client'

import { cn } from '@/lib/utils'

const KEYFRAMES = `
  @keyframes ss-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes ss-pulse { 0%, 100% { opacity: 0.15; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
  @keyframes ss-sweep { 0% { left: -4px; } 100% { left: 100%; } }
  @keyframes ss-route {
    0%   { transform: translate(12px, 35px) rotate(-50deg); opacity: 0; }
    15%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { transform: translate(102px, 35px) rotate(20deg); opacity: 0; }
  }
  @keyframes ss-rise {
    0%, 100% { transform: translateY(40%); opacity: 0.4; }
    50%       { transform: translateY(-15%); opacity: 1; }
  }
  @keyframes ss-bounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-6px); }
  }
`

let injected = false
function ensureKeyframes() {
  if (injected || typeof document === 'undefined') return
  injected = true
  const s = document.createElement('style')
  s.id = 'ss-spinner-keyframes'
  s.textContent = KEYFRAMES
  document.head.appendChild(s)
}

// ── L1 · Plane orbit (default) ────────────────────────────────
export function SpinnerOrbit({ size = 120, className }: { size?: number; className?: string }) {
  ensureKeyframes()
  const r = size * 0.42
  const cx = size / 2
  const speed = 2.4

  return (
    <div className={cn('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
      {/* dashed orbit ring */}
      <svg width={size} height={size} className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
      </svg>
      {/* spinning trail arc */}
      <svg
        width={size} height={size}
        className="absolute inset-0"
        style={{ transform: 'rotate(-90deg)', animation: `ss-spin ${speed}s linear infinite` }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`ss-trail-${size}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cx} r={r} fill="none"
          stroke={`url(#ss-trail-${size})`} strokeWidth="2"
          strokeDasharray={`${r * Math.PI * 0.5} ${r * Math.PI * 2}`}
          strokeLinecap="round"
        />
      </svg>
      {/* plane on orbit */}
      <div
        className="absolute inset-0"
        style={{ animation: `ss-spin ${speed}s linear infinite` }}
      >
        <div
          className="absolute"
          style={{
            top: cx - r,
            left: cx,
            transform: 'translate(-50%, -50%) rotate(45deg)',
          }}
        >
          <svg width={Math.round(size * 0.18)} height={Math.round(size * 0.18)} viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21 3 L 13 9.5 L 3 7 L 5.5 9.5 L 11 11 L 7 14 L 4 13 L 5 15.5 L 8 17 L 9.5 20 L 12 17 L 13.5 12 L 16 17.5 L 18.5 19 L 16 9 L 21 3 Z"
              fill="hsl(var(--primary))"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ── L2 · Squad dot chase (members) ───────────────────────────
export function SpinnerSquad({ size = 120, className }: { size?: number; className?: string }) {
  ensureKeyframes()
  const r = size * 0.35
  const cx = size / 2
  const speed = 1.6
  const colors = ['hsl(var(--primary))', '#E89AAE', '#D9923B', '#5B7556']

  return (
    <div className={cn('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
      {colors.map((col, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            animation: `ss-spin ${speed}s cubic-bezier(.6,0,.4,1) infinite`,
            animationDelay: `${-i * speed / 5}s`,
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              top: cx - r,
              left: cx,
              transform: 'translate(-50%, -50%)',
              width: size * 0.13,
              height: size * 0.13,
              background: col,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ── L3 · Plane formation (flights) ───────────────────────────
export function SpinnerFormation({ size = 120, className }: { size?: number; className?: string }) {
  ensureKeyframes()
  const r = size * 0.32
  const cx = size / 2
  const speed = 2.8

  return (
    <div className={cn('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
      <div className="absolute inset-0" style={{ animation: `ss-spin ${speed}s linear infinite` }}>
        {[0, 120, 240].map(deg => (
          <div key={deg} className="absolute inset-0" style={{ transform: `rotate(${deg}deg)` }}>
            <div
              className="absolute"
              style={{
                top: cx - r,
                left: cx,
                transform: `translate(-50%, -50%) rotate(135deg)`,
              }}
            >
              <svg width={Math.round(size * 0.2)} height={Math.round(size * 0.2)} viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M21 3 L 13 9.5 L 3 7 L 5.5 9.5 L 11 11 L 7 14 L 4 13 L 5 15.5 L 8 17 L 9.5 20 L 12 17 L 13.5 12 L 16 17.5 L 18.5 19 L 16 9 L 21 3 Z"
                  fill="hsl(var(--primary))"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── L4 · Compass pulse (places) ──────────────────────────────
export function SpinnerCompass({ size = 120, className }: { size?: number; className?: string }) {
  ensureKeyframes()

  return (
    <div className={cn('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="38" fill="none" stroke="hsl(var(--border))" strokeWidth="0.8" />
        {[0, 90, 180, 270].map((deg, i) => (
          <g key={deg} transform={`rotate(${deg} 50 50)`}>
            <path
              d="M50 14 L 54 50 L 50 50 Z"
              fill="hsl(var(--primary))"
              opacity="0.2"
              style={{
                animation: 'ss-pulse 1.6s ease-in-out infinite',
                animationDelay: `${i * 0.4}s`,
                transformOrigin: '50% 50%',
              }}
            />
          </g>
        ))}
        <circle cx="50" cy="50" r="3" fill="hsl(var(--foreground))" />
      </svg>
    </div>
  )
}

// ── L5 · Boarding scan (itinerary / flight confirm) ───────────
export function SpinnerScan({ size = 120, className }: { size?: number; className?: string }) {
  ensureKeyframes()

  return (
    <div
      className={cn('relative flex items-center justify-center flex-shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width: size * 0.7,
          height: size * 0.45,
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 6,
        }}
      >
        <div className="absolute rounded" style={{ top: 8, left: 10, right: 10, height: 4, background: 'hsl(var(--border))' }} />
        <div className="absolute rounded" style={{ top: 18, left: 10, width: '60%', height: 3, background: 'hsl(var(--muted))' }} />
        <div
          className="absolute"
          style={{
            bottom: 8, left: 10, right: 10, height: 10,
            background: 'repeating-linear-gradient(90deg, hsl(var(--foreground)) 0 2px, transparent 2px 4px)',
          }}
        />
        {/* sweep line */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            width: 4,
            background: 'linear-gradient(180deg, hsl(var(--primary) / 0), hsl(var(--primary)), hsl(var(--primary) / 0))',
            animation: 'ss-sweep 1.4s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  )
}

// ── L6 · A → B route (hotel / destination) ───────────────────
export function SpinnerRoute({ size = 120, className }: { size?: number; className?: string }) {
  ensureKeyframes()

  return (
    <div
      className={cn('relative flex items-center justify-center flex-shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size * 0.6} viewBox="0 0 120 70" aria-hidden="true">
        <defs>
          <linearGradient id="ss-rt" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.3)" />
          </linearGradient>
        </defs>
        {/* A */}
        <circle cx="12" cy="35" r="5" fill="hsl(var(--foreground))" />
        {/* B */}
        <circle cx="108" cy="35" r="5" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" />
        {/* dashed path */}
        <path d="M 18 35 Q 60 5 102 35" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 4" />
        {/* moving plane */}
        <g style={{ animation: 'ss-route 2.2s cubic-bezier(.5,0,.5,1) infinite' }}>
          <g transform="translate(-12, -12) rotate(-30)">
            <path
              d="M21 3 L 13 9.5 L 3 7 L 5.5 9.5 L 11 11 L 7 14 L 4 13 L 5 15.5 L 8 17 L 9.5 20 L 12 17 L 13.5 12 L 16 17.5 L 18.5 19 L 16 9 L 21 3 Z"
              fill="hsl(var(--primary))"
            />
          </g>
        </g>
      </svg>
    </div>
  )
}

// ── L7 · Sun rise (empty states / onboarding) ─────────────────
export function SpinnerSun({ size = 120, className }: { size?: number; className?: string }) {
  ensureKeyframes()

  return (
    <div
      className={cn('relative flex items-end justify-center flex-shrink-0 overflow-hidden', className)}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.45,
          height: size * 0.45,
          background: 'hsl(var(--primary))',
          bottom: size * 0.4,
          animation: 'ss-rise 2.2s ease-in-out infinite',
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: size * 0.4,
          left: 0,
          right: 0,
          height: 1,
          background: 'hsl(var(--border))',
        }}
      />
    </div>
  )
}

// ── L8 · Suitcase bounce (packing) ───────────────────────────
export function SpinnerSuitcase({ size = 120, className }: { size?: number; className?: string }) {
  ensureKeyframes()
  const colors = ['hsl(var(--primary))', '#D9923B', '#5B7556']

  return (
    <div
      className={cn('relative flex items-center justify-center flex-shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <div className="flex flex-col items-center" style={{ gap: 4 }}>
        {colors.map((col, i) => (
          <div
            key={i}
            className="relative rounded"
            style={{
              width: size * 0.42 - i * size * 0.06,
              height: size * 0.13,
              background: col,
              animation: 'ss-bounce 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          >
            <span
              className="absolute rounded-t"
              style={{
                top: -3,
                left: '40%',
                width: '20%',
                height: 4,
                background: col,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Small inline spinner ──────────────────────────────────────
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  ensureKeyframes()
  const r = size * 0.38
  const cx = size / 2

  return (
    <div className={cn('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
      </svg>
      <div
        className="absolute inset-0"
        style={{ animation: 'ss-spin 1.8s linear infinite' }}
      >
        <div
          className="absolute"
          style={{
            top: cx - r,
            left: cx,
            transform: 'translate(-50%, -50%) rotate(45deg)',
          }}
        >
          <svg width={Math.round(size * 0.36)} height={Math.round(size * 0.36)} viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21 3 L 13 9.5 L 3 7 L 5.5 9.5 L 11 11 L 7 14 L 4 13 L 5 15.5 L 8 17 L 9.5 20 L 12 17 L 13.5 12 L 16 17.5 L 18.5 19 L 16 9 L 21 3 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ── Full-screen loading overlay ───────────────────────────────
type SpinnerVariant = 'default' | 'squad' | 'flights' | 'places' | 'itinerary' | 'hotel' | 'packing' | 'empty'

const VARIANT_META: Record<SpinnerVariant, { label: string; sub: string }> = {
  default:   { label: 'Loading',           sub: 'one moment' },
  squad:     { label: 'Loading your crew', sub: 'getting the squad' },
  flights:   { label: 'Checking flights',  sub: 'taking off' },
  places:    { label: 'Finding places',    sub: 'finding nearby' },
  itinerary: { label: 'Loading plans',     sub: 'confirming flights' },
  hotel:     { label: 'Loading stay',      sub: 'booking destination' },
  packing:   { label: 'Loading packing',   sub: 'packing list' },
  empty:     { label: 'Getting started',   sub: 'first trip onboarding' },
}

export function PageSpinner({
  variant = 'default',
  label,
  className,
}: {
  variant?: SpinnerVariant
  label?: string
  className?: string
}) {
  const meta = VARIANT_META[variant]
  const text = label ?? meta.label

  return (
    <div className={cn('min-h-screen bg-background flex flex-col items-center justify-center gap-6', className)}>
      {variant === 'default'   && <SpinnerOrbit     size={64} />}
      {variant === 'squad'     && <SpinnerSquad      size={64} />}
      {variant === 'flights'   && <SpinnerFormation  size={64} />}
      {variant === 'places'    && <SpinnerCompass    size={64} />}
      {variant === 'itinerary' && <SpinnerScan       size={64} />}
      {variant === 'hotel'     && <SpinnerRoute      size={64} />}
      {variant === 'packing'   && <SpinnerSuitcase   size={64} />}
      {variant === 'empty'     && <SpinnerSun        size={64} />}

      <div className="flex flex-col items-center gap-1">
        <p className="eyebrow">{text}</p>
        <p className="eyebrow" style={{ opacity: 0.5 }}>{meta.sub}</p>
      </div>
    </div>
  )
}
