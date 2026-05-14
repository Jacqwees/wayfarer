import Link from 'next/link'
import { Plane, Hotel, Calendar, MapPin, Receipt, Users, Smartphone } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export const metadata = {
  title: 'SquadStay — Plan your group trip, together',
  description: 'The group holiday planner your squad deserves. Flights, hotel, itinerary, expenses and more — all in one place.',
}

const FEATURES = [
  { icon: Plane,    title: 'Flights',    desc: 'Log outbound and return flights for the whole group.', color: 'text-sky-500' },
  { icon: Hotel,    title: 'Hotel',      desc: 'Save your accommodation with Maps link and check-in details.', color: 'text-amber-600' },
  { icon: Calendar, title: 'Itinerary',  desc: 'Build a day-by-day plan everyone can see and edit.', color: 'text-primary' },
  { icon: Receipt,  title: 'Expenses',   desc: 'Split costs fairly and settle up with minimal transfers.', color: 'text-emerald-600' },
  { icon: MapPin,   title: 'Places',     desc: 'Discover and save things to do near your destination.', color: 'text-primary' },
  { icon: Users,    title: 'Members',    desc: 'Invite your crew by email and manage who can edit what.', color: 'text-violet-500' },
]

const STEPS = [
  { n: '01', title: 'Create a trip',    desc: 'Name it, pick your destination, set the dates, and upload a cover photo.' },
  { n: '02', title: 'Invite the squad', desc: 'Send email invites — your crew gets a direct link straight into the trip.' },
  { n: '03', title: 'Plan together',    desc: 'Everyone can add flights, hotel, itinerary stops, and split expenses in real time.' },
]

function Perforation({ className }: { className?: string }) {
  return (
    <svg height="2" width="100%" aria-hidden="true" className={className}>
      <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
    </svg>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Logo size={22} />
          <Link
            href="/login"
            className="h-9 px-5 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1.5 active:scale-[0.98] transition-transform"
          >
            Open app
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, hsl(var(--secondary)) 0%, hsl(var(--background)) 60%)',
          minHeight: 'clamp(480px, 72vh, 660px)',
        }}
      >
        {/* Background scatter: faint horizon lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {[
            { top: '18%', opacity: 0.04 },
            { top: '38%', opacity: 0.035 },
            { top: '62%', opacity: 0.03 },
          ].map((l, i) => (
            <div key={i} className="absolute left-0 right-0" style={{ top: l.top, opacity: l.opacity }}>
              <svg height="2" width="100%">
                <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--foreground))" strokeWidth="1" strokeDasharray="3 5" />
              </svg>
            </div>
          ))}
        </div>

        <div className="relative max-w-5xl mx-auto px-5 pt-16 pb-20 flex flex-col items-center text-center gap-8">

          {/* W5 horizon mark */}
          <div className="flex flex-col items-center gap-2">
            <svg viewBox="0 0 280 14" width="280" height="14" aria-hidden="true" style={{ overflow: 'visible' }}>
              <line x1="0" y1="10" x2="280" y2="10" stroke="hsl(var(--border))" strokeWidth="1" />
              <circle cx="110" cy="10" r="5.5" fill="hsl(var(--primary))" />
              <circle cx="122" cy="10" r="3.5" fill="#D9923B" />
              <circle cx="131" cy="10" r="2.5" fill="#5B7556" />
              <circle cx="138" cy="10" r="2"   fill="#E89AAE" />
            </svg>
            <p className="eyebrow">Group · Holidays · Simplified</p>
          </div>

          {/* Headline */}
          <h1
            className="font-display italic text-foreground"
            style={{ fontSize: 'clamp(36px, 8vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: 700 }}
          >
            Plan your group trip,{' '}
            <span className="text-primary">together.</span>
          </h1>

          <p className="text-muted-foreground max-w-md leading-relaxed" style={{ fontSize: 'clamp(15px, 2.5vw, 18px)' }}>
            Flights, hotel, itinerary, expenses, and places to explore — all in one app your whole squad can actually use.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
            <Link
              href="/login"
              className="w-full sm:w-auto flex-1 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
            >
              Start planning free
            </Link>
            <a
              href="#install"
              className="w-full sm:w-auto flex-1 h-12 px-6 rounded-full border border-border text-foreground font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Smartphone className="w-4 h-4" />
              Add to home screen
            </a>
          </div>

          {/* Social proof */}
          <p className="text-muted-foreground text-sm">
            Free to use · Works offline · No app store needed
          </p>
        </div>
      </section>

      {/* ── Features grid ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <div className="text-center mb-12">
          <p className="eyebrow mb-3">Everything you need</p>
          <h2 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">
            Built for how squads actually travel
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">{title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Perforated divider ───────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5">
        <Perforation />
      </div>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <div className="text-center mb-12">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">
            Up and running in minutes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <span
                  className="font-mono text-primary font-medium flex-shrink-0"
                  style={{ fontSize: 13, letterSpacing: '0.1em', marginTop: 2 }}
                >
                  {n}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Perforated divider ───────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5">
        <Perforation />
      </div>

      {/* ── Install CTA ──────────────────────────────────────── */}
      <section id="install" className="py-20">
        <div className="max-w-2xl mx-auto px-5 text-center flex flex-col items-center gap-8">

          {/* SS stamp circle */}
          <div className="w-16 h-16 rounded-full border border-dashed border-border flex items-center justify-center">
            <span className="font-display italic text-foreground text-2xl leading-none">SS</span>
          </div>

          <div>
            <p className="eyebrow mb-3">Installable PWA</p>
            <h2 className="font-display italic text-[32px] leading-tight tracking-[-0.01em] mb-4">
              Works like an app
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
              No app store required. Add SquadStay to your home screen for the full experience — works offline, sends push notifications, and feels native on iOS and Android.
            </p>
          </div>

          {/* Install steps — boarding-pass card */}
          <div className="bg-card border border-border rounded-xl w-full max-w-sm overflow-hidden">
            <div className="px-5 pt-5 pb-0">
              <p className="eyebrow mb-4">Add to Home Screen</p>
              <div className="space-y-3 pb-0">
                {[
                  { n: 1, step: 'Open squadstay.co.uk in Safari (iOS) or Chrome (Android)' },
                  { n: 2, step: 'Tap the Share button (iOS) or menu (Android)' },
                  { n: 3, step: 'Select "Add to Home Screen" and tap Add' },
                ].map(({ n, step }) => (
                  <div key={n} className="flex gap-3 items-start pb-3 border-b border-dashed border-border last:border-0">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="font-mono text-[10px] font-semibold">{n}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Perforation */}
            <div className="relative my-4 mx-0">
              <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-background border border-border" />
              <div className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-background border border-border" />
              <Perforation className="px-5" />
            </div>
            <div className="px-5 pb-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">squadstay · est 2026</p>
            </div>
          </div>

          {/* Store badges — coming soon */}
          <div className="flex gap-3 flex-wrap justify-center">
            {[
              { label: 'App Store',    path: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z' },
              { label: 'Google Play', path: 'M3.18 23.72c.28.14.59.17.9.09l12.43-7.17L13.9 14l-10.72 9.72zm17.64-10.29-3.27-1.89-3.28 2.97 3.28 2.97 3.29-1.89c.93-.54.93-1.62-.02-2.16zM3.07.39C2.81.54 2.62.81 2.62 1.17v21.67c0 .35.19.63.45.78L14.08 12 3.07.39zm10.83 11.61 2.62-2.62-11.45-6.6 8.83 9.22z' },
            ].map(({ label, path }) => (
              <div key={label} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-card/60 border border-border opacity-40 cursor-not-allowed select-none">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-foreground">
                  <path d={path} />
                </svg>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">Coming soon</p>
                  <p className="text-xs font-semibold leading-none">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/login"
            className="h-12 px-8 rounded-full bg-primary text-primary-foreground font-semibold text-base flex items-center gap-2 active:scale-[0.98] transition-transform"
          >
            Open the app →
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-dashed border-border">
        <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={20} />
          <p className="text-muted-foreground text-xs text-center font-mono tracking-wide uppercase">
            © 2026 SquadStay · Made for group travellers
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
