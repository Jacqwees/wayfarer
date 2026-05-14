'use client'

import { cn } from '@/lib/utils'

// I6 — Pin cluster (sage bg, white pin, 3 squad-coloured dots inside)
export function LogoMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 220 220"
      width={size}
      height={size}
      className={cn('flex-shrink-0', className)}
      aria-hidden="true"
    >
      <rect width="220" height="220" rx={Math.round(220 * 0.218)} fill="#5B7556" />
      <path
        d="M110 200 C 110 200, 50 130, 50 86 a 60 60 0 1 1 120 0 C 170 130, 110 200, 110 200 Z"
        fill="#F4EDE0"
      />
      <circle cx="90"  cy="80"  r="11" fill="#E0533A" />
      <circle cx="130" cy="80"  r="11" fill="#D9923B" />
      <circle cx="110" cy="108" r="11" fill="#5B7556" />
    </svg>
  )
}

// F2 — Squad dots (2×2 grid: coral, pink, amber, sage) — for favicon/small mark
export function FaviconMark({
  size = 16,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={cn('flex-shrink-0', className)}
      aria-hidden="true"
    >
      <circle cx="5"  cy="5"  r="2.6" fill="#E0533A" />
      <circle cx="11" cy="5"  r="2.6" fill="#E89AAE" />
      <circle cx="5"  cy="11" r="2.6" fill="#D9923B" />
      <circle cx="11" cy="11" r="2.6" fill="#5B7556" />
    </svg>
  )
}

// W5 — Horizon wordmark: dot cluster on horizon line + "squadstay" + tagline
export function LogoWordmark({
  size = 24,
  className,
  showTagline = false,
}: {
  size?: number
  className?: string
  showTagline?: boolean
}) {
  return (
    <div className={cn('flex flex-col items-center select-none', className)} style={{ gap: size * 0.1 }}>
      {/* horizon line with sun/squad dot cluster */}
      <svg
        viewBox="0 0 200 14"
        width={size * 5}
        height={size * 0.5}
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        <line x1="0" y1="10" x2="200" y2="10" stroke="hsl(var(--border))" strokeWidth="1" />
        <circle cx="78"  cy="10" r="5.5" fill="hsl(var(--primary))" />
        <circle cx="90"  cy="10" r="3.5" fill="#D9923B" />
        <circle cx="99"  cy="10" r="2.5" fill="#5B7556" />
        <circle cx="106" cy="10" r="2"   fill="#E89AAE" />
      </svg>
      {/* main wordmark */}
      <span
        className="font-sans font-semibold text-foreground leading-none tracking-tighter"
        style={{ fontSize: size, letterSpacing: '-0.05em' }}
      >
        squadstay
      </span>
      {showTagline && (
        <span
          className="font-mono text-muted-foreground uppercase"
          style={{ fontSize: size * 0.28, letterSpacing: '0.4em', marginTop: size * 0.12 }}
        >
          group · holidays · simplified
        </span>
      )}
    </div>
  )
}

// Horizontal lockup: I6 mark + inline "squadstay" text (compact, for nav)
export function Logo({
  size = 28,
  className,
  hideWordmark = false,
}: {
  size?: number
  className?: string
  hideWordmark?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoMark size={Math.round(size * 0.9)} />
      {!hideWordmark && (
        <span
          className="font-sans font-semibold text-foreground leading-none tracking-tighter select-none"
          style={{ fontSize: size, letterSpacing: '-0.05em' }}
        >
          squadstay
        </span>
      )}
    </div>
  )
}

// App icon: I6 pin cluster in a rounded square container
export function AppIcon({
  size = 48,
  variant = 'pin',
  className,
}: {
  size?: number
  variant?: 'pin' | 'outline' | 'dots'
  className?: string
}) {
  const radius = Math.round(size * 0.225)

  if (variant === 'dots') {
    return (
      <div
        className={cn('flex items-center justify-center flex-shrink-0 bg-card border border-border', className)}
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <FaviconMark size={Math.round(size * 0.55)} />
      </div>
    )
  }

  if (variant === 'outline') {
    return (
      <div
        className={cn('flex items-center justify-center flex-shrink-0 bg-background border border-border', className)}
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <LogoMark size={Math.round(size * 0.7)} />
      </div>
    )
  }

  // default 'pin' — sage background from I6, no extra container needed since LogoMark has bg
  return (
    <div
      className={cn('flex-shrink-0 overflow-hidden', className)}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <LogoMark size={size} />
    </div>
  )
}
