# SquadStay

> Group holiday planning, done together.

Plan trips with your crew — shared itinerary, flight & hotel tracking, expense splitting, and a shared packing list. Everyone on the same page, no WhatsApp chaos.

**Live:** https://squadstay.co.uk  
**Repo:** https://github.com/Jacqwees/wayfarer  
**Supabase:** https://supabase.com/dashboard/project/fkybsfpdhvjitivsylnj

---

## What it does

| Feature | Description |
|---|---|
| **Trips** | Create a trip, invite your squad, set dates and a cover photo |
| **Itinerary** | Day-by-day plan everyone can edit |
| **Flights** | Log outbound + return flights, share booking refs |
| **Hotel** | Save accommodation with check-in/out and a Maps link |
| **Places** | Discover and save things to do via Google Places |
| **Expenses** | Log costs in any currency — auto-split, settle up with minimised transfers |
| **Packing** | Shared checklist — assign items, track who's packed what |
| **Invite** | Email invites with a pre-filled sign-in link |
| **Notifications** | Real-time inbox — expenses, invites, payments, itinerary changes |
| **Profile** | Name, avatar, bio, home city — per-field privacy controls |

---

## Stack

| | |
|---|---|
| Framework | Next.js 14 — App Router, TypeScript, server actions |
| Styling | Tailwind CSS — Voyage Press design system |
| Database | Supabase — Postgres + Auth + Storage + Realtime |
| Email | Resend — OTP sign-in codes + trip invitation emails |
| Maps | Google Maps JS API + Places API |
| FX rates | Frankfurter API (free, no key needed) |
| Animations | Framer Motion |
| PWA | next-pwa — installable on iOS + Android |

---

## Design system — Voyage Press

An editorial travel-journal aesthetic. Key tokens:

| | |
|---|---|
| **Fonts** | Newsreader italic (display) · Geist (body) · Geist Mono (mono/eyebrows) |
| **Primary** | `#E0533A` coral signal (dark: `#F26B52`) |
| **Background** | `#F4EDE0` parchment paper (dark: `#171511`) |
| **Card** | `#FCF8EE` warm white (dark: `#22201A`) |
| **Signature element** | Perforated SVG dashed dividers (`strokeDasharray="3 5"`) |

---

## Getting started locally

```bash
git clone https://github.com/Jacqwees/wayfarer
cd wayfarer
npm install
cp .env.local.example .env.local   # fill in values
npm run dev                         # http://localhost:3000
```

### Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://fkybsfpdhvjitivsylnj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=SquadStay <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=        # generate with: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
```

---

## Critical architecture rules

**1. DB writes use the service role client** — cookie-based RLS is unreliable in Next.js server actions. Always verify auth manually, then use `createServiceClient()` for writes.

**2. No toast notifications** — use inline error states, confirmation bottom sheets, or the `/notifications` inbox.

**3. Auth flow** — OTP sign-in: `requestOtp()` server action generates a code via `admin.generateLink` and sends via Resend. Client calls `verifyOtp({ type: 'magiclink' })` with implicit flow (no PKCE). After verify, navigate to `/auth/setup` to create the user profile server-side once the session is in cookies.

**4. Invitation links** — emails link to `/login?email=...` which pre-fills the email and skips the landing screen.

---

## Project structure

```
app/
  (auth)/login/               Landing + sign-in page (OTP flow)
  (app)/                      Protected shell — layout.tsx renders BottomNav
    trips/                    Trip list home screen
    trips/new/                Create trip form
    trips/[tripId]/           Trip dashboard
      flights/ hotel/ itinerary/ places/ expenses/
      packing/ members/ invite/ settings/
    notifications/            Notification inbox
    profile/                  View + edit profile
  auth/
    callback/                 Legacy magic link handler
    setup/                    Post-OTP server-side profile setup + redirect
  actions/                    Server actions (auth, trips, expenses, etc.)

components/
  trips/                      TripCard, MiniTripCard, TripListView, TripDashboard, ...
  onboarding/                 OnboardingFlow + step components
  shared/                     BottomNav

lib/
  supabase/
    client.ts                 Browser client (implicit flow)
    server.ts                 Server client (RSC + server actions)
    service.ts                Service role client (writes only)
```

Full detail in `HANDOVER.md`.

---

## Development commands

```bash
npm run dev          # dev server at localhost:3000
npm run build        # production build (run before committing)
npx tsc --noEmit     # type-check only

git add ... && git commit -m "..." && git push   # Vercel auto-deploys on push to main
```
