# SquadStay

> Group holiday planning, done together.

Plan trips with your crew — shared itinerary, flight & hotel tracking, expense splitting, and a shared packing list. Everyone on the same page, no WhatsApp chaos.

**Live:** https://squadstay.co.uk  
**Repo:** https://github.com/Jacqwees/wayfarer  
**Supabase:** https://supabase.com/dashboard/project/fkybsfpdhvjitivsylnj

---

## Features

### Trip management
- **Create trips** — destination, dates, trip name, cover art
- **Trip dashboard** — full-bleed hero with countdown ticker (days to go / trip active / trip complete)
- **Live stats tiles** — members, itinerary items, places, packing progress, expenses at a glance
- **Trip settings** — edit name, dates, destination; delete trip

### Squad & collaboration
- **Email invites** — invite by email with role control (member / viewer)
- **Share link invites** — generate a one-click join link that works for new and existing users; threads through the full auth/onboarding chain so no one gets lost
- **Role system** — Owner · Member · Viewer with granular permission toggles
- **Transfer ownership** — hand the trip over to another member
- **Realtime** — Supabase Realtime keeps trip data live without polling

### Flights
- **Outbound & return flights** — IATA airport picker with offline autocomplete (~380 airports), departure/arrival times, airline, flight number, booking ref
- **Boarding-pass card** — IATA code large display with duration strip

### Hotel
- **Accommodation block** — name, address, check-in/out, booking ref, notes

### Itinerary
- **Day-by-day plan** — title, date, time, location, notes, category
- **Visibility control** — owners can toggle whether viewers see the itinerary

### Places
- **Save spots** — restaurants, attractions, beaches, anything
- **Google Places** search for autocomplete

### Packing
- **Shared checklist** — add items, mark packed, assign to members
- **Progress tracking** — packed / total shown on dashboard tile

### Expenses
- **Log costs** — description, amount (GBP), paid-by, split evenly
- **Settlement view** — who owes who, minimised transfers
- **Cross-trip total** — your total spending across all trips shown on your profile

### Notifications
- **Realtime inbox** — trip invitations, member joins, itinerary changes, expense adds
- **Web push** — PWA push notifications via VAPID + service worker
- **Smart routing** — notification taps go to the right screen; invites only prompt accept/decline for the actual invitee, not the sender

### Profiles
- **Your profile** — avatar upload, display name, bio, home city, phone; travel-style tags (Adventure, Beach, Nightlife, etc.)
- **Privacy controls** — bio/home city/phone visibility: trip members or only me
- **Stats** — trips, countries, days away, squad size, total spent
- **Public profiles** — view a squad member's profile; privacy settings respected
- **Co-traveller detection** — extra fields visible to people who've shared a trip

### i18n
- **Language files** — all user-facing strings live in `lib/i18n/en.ts`; add `fr.ts`, `es.ts`, etc. and pass a locale to swap languages with zero component changes
- **`useT()` hook** — typed translation hook for client components; `getT()` for server components and actions

### PWA
- Installable on iOS & Android via `next-pwa`
- Offline packing list via IndexedDB (`lib/db/offlineDb.ts`)
- Push notifications via service worker (`worker/index.js`)

---

## Still to build

- [ ] Expense FX conversion + currency selector per expense
- [ ] Budget tracker — set a trip budget, track spend vs target
- [ ] Trip notes / description field
- [ ] Trip duplication ("Clone trip")
- [ ] Itinerary voting — thumbs up/down on suggestions
- [ ] Place voting — squad rates saved places
- [ ] Flight status lookup (live gate/delay data)
- [ ] Appearance toggle — dark / light / auto (UI stub exists in settings)
- [ ] Notification preferences (push / email toggles)
- [ ] Additional language files (fr, es, de, …)
- [ ] Deep-link push taps on iOS (requires native wrapper or PWA workaround)
- [ ] Admin / analytics dashboard

---

## Stack

| | |
|---|---|
| Framework | Next.js 14 — App Router, TypeScript, server actions |
| Styling | Tailwind CSS — Voyage Press design system |
| Database | Supabase — Postgres + Auth + Storage + Realtime |
| Email | Resend — OTP sign-in codes + trip invitation emails |
| Maps | Google Maps JS API + Places API |
| Airport data | Static IATA dataset (380 airports, `lib/airports-data.ts`) — no API key |
| FX rates | Frankfurter API (free, no key needed) |
| Animations | Framer Motion |
| PWA | next-pwa — installable on iOS + Android |
| i18n | Custom locale files — `lib/i18n/en.ts` + `useT()` hook |

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
RESEND_FROM_EMAIL=SquadStay <noreply@squadstay.co.uk>
NEXT_PUBLIC_APP_URL=https://squadstay.co.uk
NEXT_PUBLIC_VAPID_PUBLIC_KEY=        # generate with: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:hello@squadstay.co.uk
```

---

## Critical architecture rules

**1. DB writes use the service role client** — cookie-based RLS is unreliable in Next.js server actions. Always verify auth manually, then use `createServiceClient()` for writes.

**2. No toast notifications** — use inline error states, confirmation bottom sheets, or the `/notifications` inbox.

**3. Auth flow** — OTP sign-in: `requestOtp()` server action generates a code via `admin.generateLink` and sends via Resend. Client calls `verifyOtp({ type: 'magiclink' })` with implicit flow (no PKCE). After verify, navigate to `/auth/setup` to create the user profile server-side once the session is in cookies.

**4. Invitation links** — share links thread through the full auth chain: `/join/[token]` → `/login?next=…` → `/auth/setup?next=…` → `/onboarding?next=…` → `StepReady "Join your trip →"` → back to join page. New and returning users both land in the right trip.

**5. i18n** — never hardcode user-facing strings in components. Add them to `lib/i18n/en.ts` and access via `useT()` (client) or `getT()` (server).

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
    profile/                  View + edit own profile
    profile/[userId]/         Public profile view for squad members
  auth/
    callback/                 Legacy magic link handler
    setup/                    Post-OTP server-side profile setup + redirect
  join/[token]/               Share-link join handler
  actions/                    Server actions (auth, trips, expenses, members, etc.)

components/
  trips/                      TripCard, MiniTripCard, TripListView, TripDashboard,
                              FlightsView, ExpensesView, ItineraryView, PackingView,
                              HotelView, PlacesView, MembersView, InviteForm, …
  profile/                    ProfileView, PublicProfileView
  onboarding/                 OnboardingFlow + step components
  notifications/              NotificationsView
  shared/                     BottomNav, AirportInput, PushSubscriber, RealtimeProvider

lib/
  supabase/
    client.ts                 Browser client (implicit flow)
    server.ts                 Server client (RSC + server actions)
    service.ts                Service role client (writes only)
  i18n/
    en.ts                     English string dictionary (source locale)
    index.ts                  useT() hook + getT() helper
  airports-data.ts            Static IATA airport list + searchAirports()
  db/offlineDb.ts             IndexedDB for offline packing list
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

---

## Adding a new language

1. Create `lib/i18n/fr.ts`:
   ```typescript
   import type { Translation } from './en'
   export const fr: Translation = { /* ... */ }
   ```
2. Add `'fr'` to the `Locale` union in `lib/i18n/index.ts`
3. Add `fr` to the `locales` map in `index.ts`
4. Pass `locale="fr"` to `useT()` / `getT()` — typically read from a cookie or `Accept-Language` header
