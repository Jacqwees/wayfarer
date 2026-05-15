'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

// ── Destination gradients ───────────────────────────────────
const G = {
  lisbon:   'radial-gradient(120% 80% at 30% 110%, #FFB766 0%, #E8754A 28%, #B33E4F 55%, #4A1F4C 85%)',
  kyoto:    'radial-gradient(120% 90% at 70% 0%, #F4B5C8 0%, #C26F8B 30%, #5E3A6E 60%, #1D1B3A 90%)',
  tulum:    'radial-gradient(120% 90% at 30% 0%, #C9F0E0 0%, #6FC8B2 25%, #3F6D88 55%, #1A2B45 92%)',
  amalfi:   'radial-gradient(110% 90% at 50% 100%, #FFE7B0 0%, #F5A35E 25%, #D9494B 55%, #1C3C5A 92%)',
  iceland:  'radial-gradient(120% 90% at 50% 50%, #C9E8F5 0%, #6FA4C2 30%, #2A4A6E 60%, #0F1F38 90%)',
  marrakech:'radial-gradient(120% 90% at 50% 50%, #FFC58A 0%, #E07A3C 30%, #8B2F2A 60%, #2D1414 92%)',
}

// ── Helpers ─────────────────────────────────────────────────
function DashedLine({ className }: { className?: string }) {
  return (
    <svg height="2" width="100%" aria-hidden className={className}>
      <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
    </svg>
  )
}

// ── Reveal hook ──────────────────────────────────────────────
function useReveal(ref: React.RefObject<HTMLElement | null>, delay = 0) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); obs.disconnect() }
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref, delay])
  return visible
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const vis = useReveal(ref, delay)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(.2,.8,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Postcard ─────────────────────────────────────────────────
function Postcard({
  gradient, place, meta, rotate, style,
  stamp,
}: {
  gradient: string; place: string; meta: string; rotate: number;
  style?: React.CSSProperties; stamp?: string
}) {
  return (
    <div
      style={{
        background: '#FCF8EE',
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid #E5DCC7',
        boxShadow: '0 18px 40px -16px rgba(40,20,0,0.35)',
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      <div style={{ background: gradient, aspectRatio: '4/3', position: 'relative' }}>
        {stamp && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(8px)',
            borderRadius: 4, padding: '3px 8px',
            fontFamily: '"Geist Mono", monospace', fontSize: 9, letterSpacing: '0.22em',
            color: '#1B1A18', textTransform: 'uppercase', fontWeight: 500,
          }}>
            {stamp}
          </div>
        )}
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 18, letterSpacing: '-0.015em', color: '#1B1A18' }}>{place}</span>
        <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9, letterSpacing: '0.2em', color: '#928873', textTransform: 'uppercase' }}>{meta}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <div style={{ background: '#F4EDE0', color: '#1B1A18', minHeight: '100vh' }}>

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(244,237,224,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5DCC7',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '1.2px dashed rgba(27,26,24,0.4)',
              display: 'grid', placeItems: 'center',
              fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 14, color: '#1B1A18',
            }}>S</div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.03em', color: '#1B1A18' }}>
              squad<span style={{ color: '#E0533A' }}>stay</span>
            </span>
          </a>
          {/* Desktop nav links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            {[['#features', 'Features'], ['#how', 'How it works'], ['#install', 'Install']].map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: 14, fontWeight: 500, color: '#5C544A', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/login?mode=signin" className="hidden md:block" style={{ fontSize: 14, fontWeight: 500, color: '#5C544A', textDecoration: 'none' }}>Sign in</Link>
            <Link
              href="/login?mode=signup"
              style={{
                height: 36, padding: '0 18px', borderRadius: 999,
                background: '#E0533A', color: '#FCF8EE',
                fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              Open app →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{ padding: '0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          {/* Mobile: stacked. Desktop: two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center" style={{ paddingTop: 48, paddingBottom: 56 }}>

            {/* Left: copy */}
            <div>
              {/* Eyebrow row with squad dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: '#D9CFB9' }} />
                <div style={{ display: 'flex', gap: 5 }}>
                  {['#E0533A', '#E89AAE', '#6FA4C2', '#D9923B', '#5B7556'].map((c, i) => (
                    <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9, letterSpacing: '0.2em', color: '#928873', textTransform: 'uppercase' }}>
                  Group · Holidays · Simplified
                </span>
                <div style={{ flex: 1, height: 1, background: '#D9CFB9' }} />
              </div>

              <h1 style={{
                fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontWeight: 400,
                fontSize: 'clamp(40px, 7vw, 68px)', lineHeight: 1.0,
                letterSpacing: '-0.025em', margin: '0 0 20px', color: '#1B1A18',
              }}>
                Plan your group trip,{' '}
                <span style={{ color: '#E0533A' }}>together.</span>
              </h1>

              <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.55, color: '#5C544A', maxWidth: 480, margin: '0 0 32px' }}>
                Flights, hotel, itinerary, expenses, and places to explore — all in one app your whole squad can actually use. No spreadsheets.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
                <Link
                  href="/login?mode=signup"
                  style={{
                    height: 52, borderRadius: 999, background: '#E0533A',
                    color: '#FCF8EE', fontWeight: 600, fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    textDecoration: 'none', boxShadow: '0 4px 20px -6px rgba(224,83,58,0.5)',
                  }}
                >
                  Start planning, free →
                </Link>
                <a
                  href="#install"
                  style={{
                    height: 46, borderRadius: 999,
                    border: '1px solid #D9CFB9', color: '#5C544A',
                    fontWeight: 500, fontSize: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    textDecoration: 'none',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><circle cx="12" cy="18" r="0.5" fill="currentColor" /></svg>
                  Add to home screen
                </a>
              </div>

              <p style={{ marginTop: 18, fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.18em', color: '#928873', textTransform: 'uppercase' }}>
                Free forever · Works offline · No app store
              </p>
            </div>

            {/* Right: postcard collage */}
            <div className="relative hidden sm:block" style={{ height: 480 }}>
              <Postcard gradient={G.lisbon}    place="Lisbon, 2026"  meta="JM · SK · +3"  rotate={4}  style={{ position: 'absolute', top: '2%',  right: '0%', width: '55%' }} stamp="Trip 042 · 5 days" />
              <Postcard gradient={G.kyoto}     place="Kyoto, spring" meta="£412 pp"        rotate={-6} style={{ position: 'absolute', top: '20%', left: '0%', width: '50%' }} stamp="Cherry blossom" />
              <Postcard gradient={G.tulum}     place="Tulum & coast" meta="Booked · paid"  rotate={3}  style={{ position: 'absolute', top: '50%', right: '5%', width: '52%' }} stamp="7 nights" />
              <Postcard gradient={G.iceland}   place="Reykjavík"     meta="Drafting"       rotate={-3} style={{ position: 'absolute', top: '68%', left: '5%', width: '42%' }} stamp="Winter '26" />

              {/* Squad chip */}
              <div style={{
                position: 'absolute', top: '8%', left: '20%',
                background: '#FCF8EE', border: '1px solid #D9CFB9',
                borderRadius: 999, padding: '6px 14px 6px 6px',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 14px 26px -10px rgba(60,40,20,0.2)', zIndex: 6,
              }}>
                <div style={{ display: 'flex' }}>
                  {[{ bg: '#E0533A', l: 'JM' }, { bg: '#E89AAE', l: 'SK' }, { bg: '#6FA4C2', l: 'AL' }, { bg: '#D9923B', l: 'TR' }, { bg: '#5B7556', l: 'MN' }].map(({ bg, l }, i) => (
                    <span key={i} style={{
                      width: 28, height: 28, borderRadius: '50%', marginLeft: i === 0 ? 0 : -8,
                      border: '2px solid #FCF8EE', background: bg,
                      display: 'grid', placeItems: 'center',
                      fontFamily: '"Geist", sans-serif', fontSize: 11, fontWeight: 600, color: '#FCF8EE',
                    }}>{l}</span>
                  ))}
                </div>
                <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 11, letterSpacing: '0.1em', color: '#5C544A' }}>
                  The <b style={{ color: '#1B1A18' }}>squad</b> · all in
                </span>
              </div>

              {/* Price stamp */}
              <div style={{
                position: 'absolute', bottom: '6%', right: '2%',
                background: '#1B1A18', color: '#FCF8EE',
                padding: '14px 18px', borderRadius: 6,
                transform: 'rotate(6deg)',
                boxShadow: '0 14px 30px -10px rgba(0,0,0,0.4)', zIndex: 7,
              }}>
                <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9, letterSpacing: '0.22em', opacity: 0.65, textTransform: 'uppercase' }}>Split evenly</div>
                <div style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 26, letterSpacing: '-0.01em', marginTop: 2 }}>£87 each</div>
                <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.1em', opacity: 0.7, marginTop: 2 }}>5 ppl · settled</div>
              </div>
            </div>

            {/* Mobile-only: simpler postcard stack */}
            <div className="block sm:hidden relative" style={{ height: 260 }}>
              <Postcard gradient={G.lisbon} place="Lisbon, 2026" meta="5 days" rotate={4} style={{ position: 'absolute', top: 0, left: '15%', width: '68%' }} stamp="Trip 042" />
              <Postcard gradient={G.kyoto}  place="Kyoto"        meta="£412 pp" rotate={-5} style={{ position: 'absolute', top: '30%', left: '0%', width: '55%' }} />
              <Postcard gradient={G.tulum}  place="Tulum"        meta="Booked"  rotate={3}  style={{ position: 'absolute', top: '28%', right: '0%', width: '50%' }} />
            </div>

          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #E5DCC7', borderBottom: '1px solid #E5DCC7', background: '#EBE2D1', padding: '18px 0', overflow: 'hidden' }}>
        <style>{`
          @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
          .marquee-track { display: flex; gap: 52px; white-space: nowrap; animation: marquee 55s linear infinite; }
          .marquee-track span { display: inline-flex; align-items: center; gap: 52px; }
        `}</style>
        <div className="marquee-track" style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 'clamp(18px,3vw,26px)', color: '#1B1A18', letterSpacing: '-0.01em' }}>
          {[1, 2].map(n => (
            <span key={n}>
              {['Lisbon', 'Kyoto', 'Amalfi', 'Tulum', 'Reykjavík', 'Marrakech', 'Patagonia', 'Ubud', 'Porto', 'Hanoi', 'Cape Town', 'Mexico City'].map(city => (
                <span key={city}>{city} <span style={{ color: '#E0533A', fontFamily: '"Geist", sans-serif', fontStyle: 'normal', fontSize: 12 }}>✦</span></span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── SHOWCASE — phone mockup ───────────────────────── */}
      <section id="showcase" style={{ background: '#EBE2D1', borderBottom: '1px solid #E5DCC7', padding: 'clamp(60px, 8vw, 120px) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Copy */}
            <Reveal className="order-2 lg:order-1">
              <p style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.22em', color: '#928873', textTransform: 'uppercase', marginBottom: 12 }}>
                Always synced
              </p>
              <h2 style={{ fontFamily: '"Newsreader", serif', fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.0, letterSpacing: '-0.025em', margin: '0 0 20px', color: '#1B1A18' }}>
                The trip <em style={{ fontStyle: 'italic', color: '#E0533A' }}>lives</em> where everyone is.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: '#5C544A', margin: '0 0 24px', maxWidth: 480 }}>
                Open the app and you&apos;re on day three in Lisbon, seeing the same itinerary as Sam, Alex, and the rest. Edit a stop, add a flight — everyone sees it in real time.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, title: 'Real-time itinerary', desc: 'Day-by-day plan everyone can edit. Sub-30-second sync.' },
                  { icon: <path d="M2 6h20M2 12h20M2 18h20" />, title: 'Polls without the chaos', desc: '"Beach day or city walk?" — settle it in 30 seconds.' },
                  { icon: <><path d="M5 12V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" /><path d="M3 12h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>, title: 'Boarding cards, side-by-side', desc: "Everyone's flight on one screen." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 12, background: '#FCF8EE', border: '1px solid #E5DCC7' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EBE2D1', display: 'grid', placeItems: 'center', flexShrink: 0, color: '#E0533A' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
                    </div>
                    <div>
                      <b style={{ display: 'block', fontSize: 14, marginBottom: 2, color: '#1B1A18' }}>{title}</b>
                      <span style={{ color: '#5C544A', fontSize: 13, lineHeight: 1.4 }}>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Phone frame */}
            <Reveal delay={120} className="flex justify-center order-1 lg:order-2">
              <div style={{
                width: 300, height: 620,
                background: '#1B1A18', borderRadius: 44, padding: 12,
                boxShadow: '0 60px 100px -40px rgba(40,20,0,0.35), 0 20px 40px -20px rgba(40,20,0,0.2)',
                position: 'relative',
              }}>
                {/* Notch */}
                <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', width: 90, height: 26, background: '#1B1A18', borderRadius: 20, zIndex: 3 }} />
                <div style={{ width: '100%', height: '100%', borderRadius: 34, background: '#F4EDE0', overflow: 'hidden' }}>
                  {/* Status bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 22px 6px', fontSize: 12, fontWeight: 600 }}>
                    <span>9:41</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="6" width="2" height="4" /><rect x="3" y="4" width="2" height="6" /><rect x="6" y="2" width="2" height="8" /><rect x="9" y="0" width="2" height="10" /></svg>
                    </div>
                  </div>
                  {/* Trip header */}
                  <div style={{ padding: '24px 22px 14px' }}>
                    <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9, letterSpacing: '0.22em', color: '#928873', textTransform: 'uppercase', marginBottom: 4 }}>Trip · 042</div>
                    <div style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1, color: '#1B1A18' }}>Lisbon, together</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, fontFamily: '"Geist Mono", monospace', fontSize: 10, color: '#5C544A', letterSpacing: '0.06em' }}>
                      <span>MAR 14 → 19</span><span style={{ color: '#D9CFB9' }}>·</span><span>5 NIGHTS</span>
                    </div>
                  </div>
                  {/* Squad */}
                  <div style={{ display: 'flex', padding: '0 22px 16px', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex' }}>
                      {[{ bg: '#E0533A', l: 'JM' }, { bg: '#E89AAE', l: 'SK' }, { bg: '#6FA4C2', l: 'AL' }, { bg: '#D9923B', l: 'TR' }, { bg: '#5B7556', l: 'MN' }].map(({ bg, l }, i) => (
                        <span key={i} style={{ width: 24, height: 24, borderRadius: '50%', marginLeft: i === 0 ? 0 : -5, border: '2px solid #F4EDE0', background: bg, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 600, color: '#FCF8EE' }}>{l}</span>
                      ))}
                    </div>
                  </div>
                  {/* Day card */}
                  {[
                    { day: 'Day two · Alfama', num: '02', events: [{ t: '10:00', w: 'Pastéis de Belém', who: 'Jamie added' }, { t: '14:30', w: 'Tram 28 → Castelo', who: 'Sam added' }] },
                    { day: 'Day three · Sintra', num: '03', events: [{ t: '09:00', w: 'Park Bar · sunrise', who: 'Alex added' }] },
                  ].map(({ day, num, events }) => (
                    <div key={day} style={{ margin: '0 18px 12px', padding: 14, background: '#FCF8EE', border: '1px solid #E5DCC7', borderRadius: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                        <span style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 15, color: '#1B1A18' }}>{day}</span>
                        <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9, color: '#E0533A', letterSpacing: '0.15em' }}>{num}</span>
                      </div>
                      {events.map(({ t, w, who }) => (
                        <div key={w} style={{ display: 'flex', gap: 8, padding: '5px 0', borderTop: '1px dashed #E5DCC7', fontSize: 12 }}>
                          <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, color: '#928873', width: 40, flexShrink: 0, paddingTop: 1 }}>{t}</span>
                          <div>
                            <div style={{ color: '#1B1A18', fontWeight: 500 }}>{w}</div>
                            <div style={{ color: '#5C544A', fontSize: 10 }}>{who}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" style={{ padding: 'clamp(60px, 8vw, 120px) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <p style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.22em', color: '#928873', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>Everything you need</p>
            <h2 style={{ fontFamily: '"Newsreader", serif', fontWeight: 400, fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.0, letterSpacing: '-0.025em', margin: '0 0 52px', textAlign: 'center', color: '#1B1A18' }}>
              Built for how squads <em style={{ fontStyle: 'italic', color: '#E0533A' }}>actually</em> travel.
            </h2>
          </Reveal>

          {/* Grid: 2 large + 4 small on desktop, 1-col on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Money — large */}
            <Reveal className="sm:col-span-2 lg:col-span-2" delay={0}>
              <div style={{ background: '#FCF8EE', border: '1px solid #E5DCC7', borderRadius: 18, padding: 28, position: 'relative', overflow: 'hidden' }}>
                <span style={{ position: 'absolute', top: 20, right: 20, fontFamily: '"Geist Mono", monospace', fontSize: 9, color: '#928873', letterSpacing: '0.18em', textTransform: 'uppercase' }}>01 · Money</span>
                <h3 style={{ fontFamily: '"Newsreader", serif', fontWeight: 400, fontSize: 26, letterSpacing: '-0.015em', margin: '0 0 8px', color: '#1B1A18' }}>
                  Split expenses, <em style={{ fontStyle: 'italic', color: '#E0533A' }}>settle before you land.</em>
                </h3>
                <p style={{ color: '#5C544A', fontSize: 14, lineHeight: 1.5, margin: '0 0 18px' }}>Log what you spend, see who owes what, minimise transfers.</p>
                <div style={{ background: '#EBE2D1', border: '1px dashed #D9CFB9', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { name: 'Hotel · Baixa', paid: 'JM', pos: null, neg: '−£127' },
                    { name: 'Dinner · Time Out', paid: 'SK', pos: '+£43', neg: null },
                    { name: 'Tram passes · 5×', paid: 'AL', pos: '+£12', neg: null },
                    { name: 'Airport taxi', paid: 'TR', pos: '+£9', neg: null },
                  ].map(({ name, paid, pos, neg }) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <div>
                        <b style={{ fontWeight: 600 }}>{name}</b>
                        <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, color: '#928873', marginLeft: 8, letterSpacing: '0.05em' }}>{paid}</span>
                      </div>
                      <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 13, color: pos ? '#5B7556' : '#A53A26', fontWeight: 500 }}>
                        {pos ?? neg}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Flights */}
            <Reveal delay={60}>
              <div style={{ background: '#FCF8EE', border: '1px solid #E5DCC7', borderRadius: 18, padding: 28, position: 'relative' }}>
                <span style={{ position: 'absolute', top: 20, right: 20, fontFamily: '"Geist Mono", monospace', fontSize: 9, color: '#928873', letterSpacing: '0.18em', textTransform: 'uppercase' }}>02</span>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EBE2D1', display: 'grid', placeItems: 'center', marginBottom: 16, color: '#E0533A' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5c-1.5-1.5-3.5-1.5-5 0L11 6 2.8 4.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 1.5 1.5 2 2L8 19l1-1v-3l3-2 3.5 7.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>
                </div>
                <h3 style={{ fontFamily: '"Newsreader", serif', fontWeight: 400, fontSize: 24, letterSpacing: '-0.015em', margin: '0 0 8px' }}>Flights</h3>
                <p style={{ color: '#5C544A', fontSize: 14, lineHeight: 1.5, margin: 0 }}>Log everyone&apos;s outbound and return. Gate changes pushed live.</p>
              </div>
            </Reveal>

            {/* Stay */}
            <Reveal delay={80}>
              <div style={{ background: '#FCF8EE', border: '1px solid #E5DCC7', borderRadius: 18, padding: 28, position: 'relative' }}>
                <span style={{ position: 'absolute', top: 20, right: 20, fontFamily: '"Geist Mono", monospace', fontSize: 9, color: '#928873', letterSpacing: '0.18em', textTransform: 'uppercase' }}>03</span>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EBE2D1', display: 'grid', placeItems: 'center', marginBottom: 16, color: '#E0533A' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                </div>
                <h3 style={{ fontFamily: '"Newsreader", serif', fontWeight: 400, fontSize: 24, letterSpacing: '-0.015em', margin: '0 0 8px' }}>Stay</h3>
                <p style={{ color: '#5C544A', fontSize: 14, lineHeight: 1.5, margin: 0 }}>Save your accommodation with check-in details visible to everyone.</p>
              </div>
            </Reveal>

            {/* Discover — large */}
            <Reveal className="sm:col-span-2 lg:col-span-2" delay={100}>
              <div style={{ background: '#FCF8EE', border: '1px solid #E5DCC7', borderRadius: 18, padding: 28, position: 'relative', overflow: 'hidden' }}>
                <span style={{ position: 'absolute', top: 20, right: 20, fontFamily: '"Geist Mono", monospace', fontSize: 9, color: '#928873', letterSpacing: '0.18em', textTransform: 'uppercase' }}>04 · Discover</span>
                <h3 style={{ fontFamily: '"Newsreader", serif', fontWeight: 400, fontSize: 26, letterSpacing: '-0.015em', margin: '0 0 8px', color: '#1B1A18' }}>
                  Places to go, <em style={{ fontStyle: 'italic', color: '#E0533A' }}>built by you.</em>
                </h3>
                <p style={{ color: '#5C544A', fontSize: 14, lineHeight: 1.5, margin: '0 0 18px' }}>Everyone drops pins, everyone can see them.</p>
                <div style={{ aspectRatio: '16/7', background: G.tulum, borderRadius: 12, position: 'relative' }}>
                  {[{ t: '22%', l: '18%' }, { t: '45%', l: '38%' }, { t: '30%', l: '60%' }, { t: '55%', l: '78%' }, { t: '18%', l: '85%' }].map((p, i) => (
                    <div key={i} style={{ position: 'absolute', top: p.t, left: p.l, width: 14, height: 14, borderRadius: '50%', background: '#FCF8EE', boxShadow: '0 0 0 2px #E0533A' }}>
                      <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: '#E0533A' }} />
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Squad */}
            <Reveal delay={120}>
              <div style={{ background: '#FCF8EE', border: '1px solid #E5DCC7', borderRadius: 18, padding: 28, position: 'relative' }}>
                <span style={{ position: 'absolute', top: 20, right: 20, fontFamily: '"Geist Mono", monospace', fontSize: 9, color: '#928873', letterSpacing: '0.18em', textTransform: 'uppercase' }}>05</span>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EBE2D1', display: 'grid', placeItems: 'center', marginBottom: 16, color: '#E0533A' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <h3 style={{ fontFamily: '"Newsreader", serif', fontWeight: 400, fontSize: 24, letterSpacing: '-0.015em', margin: '0 0 8px' }}>Squad</h3>
                <p style={{ color: '#5C544A', fontSize: 14, lineHeight: 1.5, margin: 0 }}>Invite by link. Everyone on the same page from day one.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SETTLE-UP ────────────────────────────────────── */}
      <section style={{ background: '#EBE2D1', borderTop: '1px solid #E5DCC7', borderBottom: '1px solid #E5DCC7', padding: 'clamp(60px, 8vw, 120px) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <Reveal>
              <p style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.22em', color: '#928873', textTransform: 'uppercase', marginBottom: 12 }}>Settling up · math, gone</p>
              <h2 style={{ fontFamily: '"Newsreader", serif', fontWeight: 400, fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.0, letterSpacing: '-0.025em', margin: '0 0 20px', color: '#1B1A18' }}>
                Three transfers.<br />Squad-wide. Done.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: '#5C544A', maxWidth: 480 }}>
                SquadStay calculates the minimum number of payments to settle everything — no back-and-forth, no spreadsheet, no drama.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <div style={{ background: '#FCF8EE', border: '1px solid #E5DCC7', borderRadius: 24, padding: 28 }}>
                {/* Stacked bar */}
                <div style={{ height: 20, borderRadius: 6, overflow: 'hidden', display: 'flex', marginBottom: 22 }}>
                  {[{ w: '28%', bg: '#E0533A' }, { w: '22%', bg: '#E89AAE' }, { w: '20%', bg: '#6FA4C2' }, { w: '18%', bg: '#D9923B' }, { w: '12%', bg: '#5B7556' }].map(({ w, bg }, i) => (
                    <div key={i} style={{ width: w, background: bg }} />
                  ))}
                </div>
                {[
                  { name: 'Jamie', paid: '£340', spent: '£212', net: '+£128', pos: true },
                  { name: 'Sam',   paid: '£180', spent: '£212', net: '−£32',  pos: false },
                  { name: 'Alex',  paid: '£220', spent: '£212', net: '+£8',   pos: true },
                  { name: 'Tom',   paid: '£150', spent: '£212', net: '−£62',  pos: false },
                  { name: 'Mia',   paid: '£160', spent: '£212', net: '−£52',  pos: false },
                ].map(({ name, paid, spent, net, pos }) => (
                  <div key={name} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: '1px dashed #E5DCC7' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EBE2D1', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, color: '#5C544A' }}>
                      {name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14, color: '#1B1A18' }}>{name}</div>
                      <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 11, color: '#928873', letterSpacing: '0.05em' }}>paid {paid} · spent {spent}</div>
                    </div>
                    <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 14, fontWeight: 500, color: pos ? '#5B7556' : '#A53A26' }}>{net}</span>
                  </div>
                ))}
                <div style={{ background: '#1B1A18', color: '#FCF8EE', borderRadius: 14, padding: '16px 20px', marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9, letterSpacing: '0.22em', opacity: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>Result</div>
                    <div style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 22, letterSpacing: '-0.01em' }}>3 transfers</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 9, letterSpacing: '0.22em', opacity: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>Total squared</div>
                    <div style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 22, letterSpacing: '-0.01em' }}>£1,050</div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how" style={{ padding: 'clamp(60px, 8vw, 120px) 0', background: '#FCF8EE', borderBottom: '1px solid #E5DCC7' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <Reveal className="text-center mb-14">
            <p style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.22em', color: '#928873', textTransform: 'uppercase', marginBottom: 12 }}>How it works</p>
            <h2 style={{ fontFamily: '"Newsreader", serif', fontWeight: 400, fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.0, letterSpacing: '-0.025em', margin: 0, color: '#1B1A18' }}>
              Up and running in minutes.
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting dashed line on desktop */}
            <div className="hidden md:block absolute" style={{ top: 38, left: '8%', right: '8%', height: 1, background: 'repeating-linear-gradient(to right, #D9CFB9 0, #D9CFB9 6px, transparent 6px, transparent 12px)' }} />
            {[
              { n: '01', title: 'Create a trip', desc: 'Name it, pick your destination, set the dates, and add a cover photo.', tag: '⏱ 20 seconds' },
              { n: '02', title: 'Invite the squad', desc: 'Share a link — your crew taps it and lands straight inside the trip.', tag: '✉ One tap each' },
              { n: '03', title: 'Plan together', desc: 'Add flights, hotel, itinerary stops, and split expenses in real time.', tag: '✈ All hands on deck' },
            ].map(({ n, title, desc, tag }, i) => (
              <Reveal key={n} delay={i * 80}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 76, height: 76, borderRadius: '50%', border: '1px dashed #E0533A', background: '#F4EDE0', display: 'grid', placeItems: 'center', marginBottom: 22, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '1px solid #E5DCC7' }} />
                    <span style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 28, color: '#E0533A' }}>{n}</span>
                  </div>
                  <h3 style={{ fontFamily: '"Newsreader", serif', fontWeight: 400, fontSize: 26, letterSpacing: '-0.015em', margin: '0 0 10px', color: '#1B1A18' }}>{title}</h3>
                  <p style={{ color: '#5C544A', fontSize: 15, lineHeight: 1.55, margin: '0 0 16px', maxWidth: 300 }}>{desc}</p>
                  <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.22em', color: '#928873', textTransform: 'uppercase', borderTop: '1px solid #D9CFB9', paddingTop: 10, display: 'inline-block' }}>{tag}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PWA INSTALL ──────────────────────────────────── */}
      <section id="install" style={{ padding: 'clamp(60px, 8vw, 120px) 0', background: '#1B1A18', color: '#FCF8EE' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <p style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.22em', color: 'rgba(252,248,238,0.55)', textTransform: 'uppercase', marginBottom: 12 }}>Installable PWA</p>
              <h2 style={{ fontFamily: '"Newsreader", serif', fontWeight: 400, fontSize: 'clamp(30px, 4vw, 58px)', lineHeight: 1.0, letterSpacing: '-0.025em', margin: '0 0 20px', color: '#FCF8EE' }}>
                Works like an <em style={{ fontStyle: 'italic', color: '#E0533A' }}>app.</em>
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: 'rgba(252,248,238,0.7)', maxWidth: 480, margin: '0 0 32px' }}>
                No app store. Add SquadStay to your home screen for the full experience — works offline, feels native on iOS and Android.
              </p>
              <div style={{ borderTop: '1px solid #2A2720', display: 'flex', flexDirection: 'column' }}>
                {[
                  { n: '1', title: 'Open the URL', sub: 'squadstay.co.uk in Safari or Chrome' },
                  { n: '2', title: 'Tap Share menu', sub: 'iOS: Share button · Android: browser menu' },
                  { n: '3', title: 'Add to Home Screen', sub: 'Confirm and it\'s on your dock' },
                ].map(({ n, title, sub }) => (
                  <div key={n} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 20, alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #2A2720' }}>
                    <span style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 34, color: '#E0533A' }}>{n}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: '#FCF8EE' }}>{title}</div>
                      <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(252,248,238,0.5)', marginTop: 3 }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            {/* Home screen mockup */}
            <Reveal delay={120} className="flex justify-center">
              <div style={{ width: 280, height: 580, borderRadius: 44, padding: 10, background: 'linear-gradient(160deg, #2A2720 0%, #171511 100%)', boxShadow: '0 60px 100px -40px rgba(0,0,0,0.6)', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 36, background: G.lisbon, overflow: 'hidden', padding: '28px 20px', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)' }} />
                  <div style={{ position: 'relative', textAlign: 'center', color: '#FCF8EE' }}>
                    <div style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 60, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 4 }}>9:41</div>
                    <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(252,248,238,0.85)' }}>THU · 14 MAR</div>
                  </div>
                  {/* App grid */}
                  <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '0 24px' }}>
                    {/* SquadStay icon */}
                    <div style={{ textAlign: 'center', color: '#FCF8EE', fontSize: 10 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 13, background: '#FCF8EE', margin: '0 auto 5px', display: 'grid', placeItems: 'center', fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 28, color: '#E0533A' }}>S</div>
                      <span style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)', fontSize: 9 }}>SquadStay</span>
                    </div>
                    {[...Array(7)].map((_, i) => (
                      <div key={i} style={{ textAlign: 'center', color: '#FCF8EE', fontSize: 9 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 13, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(20px)', margin: '0 auto 5px', border: '1px solid rgba(255,255,255,0.2)' }} />
                      </div>
                    ))}
                  </div>
                  {/* Dock */}
                  <div style={{ position: 'absolute', bottom: 12, left: 20, right: 20, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.2)' }} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section style={{ background: '#F4EDE0', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              background: G.amalfi, borderRadius: 32, padding: 'clamp(48px, 6vw, 80px) clamp(32px, 5vw, 64px)',
              position: 'relative', overflow: 'hidden', color: '#FCF8EE',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.3) 100%)' }} />
              {/* Stamp circle */}
              <div className="hidden sm:grid" style={{
                position: 'absolute', top: 44, right: 52,
                width: 120, height: 120, borderRadius: '50%',
                border: '1.5px dashed rgba(252,248,238,0.7)',
                placeItems: 'center', textAlign: 'center',
                transform: 'rotate(8deg)', color: 'rgba(252,248,238,0.9)',
              }}>
                <div>
                  <div style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 38, letterSpacing: '-0.01em', lineHeight: 1, marginBottom: 4 }}>SS</div>
                  <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', lineHeight: 1.5 }}>Est 2026</div>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <p style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(252,248,238,0.7)', marginBottom: 12 }}>Where are you off to?</p>
                <h2 style={{ fontFamily: '"Newsreader", serif', fontWeight: 400, fontSize: 'clamp(40px, 6vw, 80px)', lineHeight: 0.98, letterSpacing: '-0.025em', margin: '0 0 24px', color: '#FCF8EE', maxWidth: '16ch' }}>
                  Plan something together this weekend.
                </h2>
                <p style={{ fontSize: 17, lineHeight: 1.55, color: 'rgba(252,248,238,0.85)', maxWidth: 500, margin: '0 0 32px' }}>
                  Free forever. No app store. Works on every phone. Your squad is one link away.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <Link href="/login?mode=signup" style={{ height: 52, padding: '0 28px', borderRadius: 999, background: '#FCF8EE', color: '#1B1A18', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                    Start planning free →
                  </Link>
                  <Link href="/login?mode=signin" style={{ height: 52, padding: '0 28px', borderRadius: 999, background: 'rgba(252,248,238,0.12)', border: '1px solid rgba(252,248,238,0.3)', color: '#FCF8EE', fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                    Already a member? Sign in
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{ background: '#F4EDE0', borderTop: '1px dashed #D9CFB9', padding: '32px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" style={{ paddingBottom: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1.2px dashed rgba(27,26,24,0.4)', display: 'grid', placeItems: 'center', fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 13 }}>S</div>
                <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.03em' }}>squad<span style={{ color: '#E0533A' }}>stay</span></span>
              </div>
              <p style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', fontSize: 20, color: '#1B1A18', lineHeight: 1.2, maxWidth: '18ch' }}>where are we off to, together?</p>
            </div>
            {[
              { head: 'Product', links: [['#features', 'Features'], ['#how', 'How it works'], ['#install', 'Install app'], ['/login', 'Sign in']] },
              { head: 'Quiet stuff', links: [['#', 'Privacy'], ['#', 'Terms'], ['mailto:hello@squadstay.co.uk', 'Contact']] },
            ].map(({ head, links }) => (
              <div key={head}>
                <h4 style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#928873', marginBottom: 14, fontWeight: 500 }}>{head}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {links.map(([href, label]) => (
                    <li key={label}><a href={href} style={{ fontSize: 14, color: '#5C544A', textDecoration: 'none' }}>{label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <DashedLine />
          <div style={{ paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.14em', color: '#928873', textTransform: 'uppercase', margin: 0 }}>
              © 2026 SquadStay
            </p>
            <p style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, letterSpacing: '0.14em', color: '#928873', textTransform: 'uppercase', margin: 0 }}>
              v0.1 · Made for group travellers
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
