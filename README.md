# Wayfarer — Group Holiday Planner

A mobile-first PWA that lets groups plan, manage, and enjoy holidays together. Handles trip creation, itineraries, cost splitting, and real-time updates — all without an app store download.

**Live:** https://wayfarer-plum.vercel.app  
**Repo:** https://github.com/Jacqwees/wayfarer  
**Spec:** `wayfarer_spec.docx` in the repo root — read this for full feature detail on every section.

---

## Picking up in a new Claude session

Paste this prompt:

> Read README.md carefully, then read wayfarer_spec.docx for full feature detail. Continue building the next incomplete feature from the MVP todo list. Use server actions with the service role client for all database writes. Never use toast notifications. Confirm with me before starting each major feature.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (Postgres + Auth + Storage + Realtime) |
| Hosting | Vercel (auto-deploys on push to `main`) |
| Maps | Google Maps JS API + Places API (New) |
| Email | Resend (configured as Supabase SMTP) |
| FX rates | Frankfurter API (free, no key required) |
| Animations | Framer Motion |
| Offline | next-pwa + Dexie.js (IndexedDB) |
| Icons | Lucide React |

---

## Environment Variables

In `.env.local` (local dev) and Vercel dashboard (production — all 5 already added):

```
NEXT_PUBLIC_SUPABASE_URL=https://fkybsfpdhvjitivsylnj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
RESEND_API_KEY=re_...
```

---

## Critical Architecture Rules

### 1. Database write pattern
All DB **writes** use the **service role client** inside Server Actions, after verifying auth manually. This is required because cookie-based RLS auth is unreliable in server actions.

```ts
// CORRECT — every server action that writes must follow this pattern:
const supabase = await createClient()           // verify auth
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: 'Not authenticated' }

const db = createServiceClient()                // write with service role
await db.from('trips').insert({ created_by: user.id, ... })
```

DB **reads** in Server Components use `createClient()` — RLS applies normally.

### 2. No toasts — ever
Spec forbids toast notifications. Use inline error states, confirmation cards, or the `/notifications` area.

### 3. File uploads
Use `getUploadUrl()` server action → get signed URL → PUT from browser. Public URL format:
`https://fkybsfpdhvjitivsylnj.supabase.co/storage/v1/object/public/{bucket}/{path}`

### 4. Google Maps
Load via `<Script src="...?libraries=places" />` (next/script). Access via `(window as any).google.maps.places`.

---

## Project Structure

```
app/
  (auth)/login/          Magic link login page
  (app)/                 Protected shell — layout renders BottomNav
    trips/               Trip list (home screen after login)
    trips/new/           Create trip form
    trips/[tripId]/      Trip dashboard
      flights/           Outbound + return flight cards
      hotel/             Hotel details + map pin
      itinerary/         Day-by-day itinerary
      places/            Things To Do (Google Places discovery)
      expenses/          Cost splitting + settle up
      members/           Member list + role management
      invite/            Invite by email
    notifications/       Notification inbox
    profile/             View + edit own profile
  auth/callback/         Magic link callback — creates user rows on first sign-in
  actions/
    trips.ts             createTrip, getUploadUrl
    profile.ts           updateProfile, updateAvatar, signOut
  onboarding/            First-time onboarding (runs once after first sign-in)

components/
  onboarding/            OnboardingFlow, StepName, StepDetails, StepNotifications, StepReady
  trips/                 TripCard, TripDashboard, NewTripForm
  profile/               ProfileView
  shared/                BottomNav

lib/
  supabase/
    client.ts            Browser Supabase client
    server.ts            Server Supabase client (RSC + middleware)
    service.ts           Service role client (server actions only)
    middleware.ts        Session refresh middleware
  types/database.ts      TypeScript types for all 14 tables

supabase/migrations/
  001_initial_schema.sql  14 tables, enums, indexes
  002_rls_policies.sql    RLS policies + helper functions
  003_storage_policies.sql Storage bucket RLS
```

---

## Database

14 tables: `users`, `privacy_settings`, `trips`, `trip_members`, `trip_permissions`, `invitations`, `flights`, `hotels`, `itinerary_items`, `places`, `expenses`, `expense_splits`, `payments`, `notifications`

RLS helper functions (security definer): `is_trip_member()`, `is_trip_owner()`, `trip_role()`

Supabase project ID: `fkybsfpdhvjitivsylnj`  
Dashboard: https://supabase.com/dashboard/project/fkybsfpdhvjitivsylnj  
Auth: Site URL = `https://wayfarer-plum.vercel.app`, redirect = `/auth/callback`  
Storage buckets: `avatars` (public), `covers` (public)

---

## MVP Build Todo

### ✅ Complete

- [x] Project scaffold — Next.js 14, TypeScript, Tailwind, shadcn/ui, all dependencies
- [x] Database — 14 tables + full RLS policies applied to Supabase
- [x] Storage — `avatars` and `covers` buckets with RLS
- [x] PWA — manifest, icons (192/512/180px), service worker, installable on iOS + Android
- [x] Auth — magic link, `/auth/callback`, session middleware, user + privacy_settings creation on first sign-in
- [x] Onboarding — animated 3-step flow: name/photo → details+privacy → notifications → ready
- [x] Trips list — `/trips` home screen, upcoming/past split, countdown badges, empty state
- [x] Trip creation — `/trips/new` with Google Places city autocomplete, cover photo upload, server action (no RLS issues)
- [x] Trip dashboard — `/trips/[id]` hero cover, member avatars strip, 6 feature card grid
- [x] Bottom navigation — floating pill nav (Trips / Notifications / Profile), spring animation, unread badge
- [x] Profile — view/edit name, phone, bio, home city, avatar upload, privacy toggles per field, sign out

### 🔲 To Build (do in this order)

- [ ] **Invitations** — `/trips/[id]/invite`: email input + role picker, server action creates invitation row + sends email via Resend edge function, accept/decline in notification area, trip_members row created on accept
- [ ] **Members page** — `/trips/[id]/members`: list all members with roles, owner can remove/change role, transfer ownership flow
- [ ] **Flights** — `/trips/[id]/flights`: show outbound + return cards, add/edit form (manual entry), fields per spec Section 3.7, available offline
- [ ] **Hotel** — `/trips/[id]/hotel`: show hotel card + map pin, add/edit form with Places address autocomplete, tap to open Google Maps, available offline
- [ ] **Itinerary** — `/trips/[id]/itinerary`: day-by-day view across trip dates, add free-form item or from favourites, respect `members_can_add_itinerary` permission, viewer access controlled by `itinerary_visible_to_viewers`
- [ ] **Things To Do** — `/trips/[id]/places`: Google Places discovery feed near destination, filter by category + price level, favourite → shared `places` table, add favourited place to itinerary
- [ ] **Expenses** — `/trips/[id]/expenses`: add expense (any currency → FX from Frankfurter → stored in GBP), 3 split types (equal all / equal select / custom), settle up view (minimised transfer list), payment confirmation flow, disputes, nudge reminder
- [ ] **Notifications area** — `/notifications`: inbox list, all types (see spec Section 7), mark as read, tap to navigate to relevant screen
- [ ] **Realtime** — Supabase Realtime subscriptions on expenses, payments, notifications so UI updates live without refresh
- [ ] **Offline support** — Dexie.js IndexedDB queue for expenses added offline, sync on reconnect, pending indicator on expense
- [ ] **Push notifications** — VAPID keys in Supabase, service worker push handler, permission already requested in onboarding

---

## Future Roadmap (post-MVP)

- Share-link invites (join by URL)
- Multi-hotel / multi-leg trips (backpacking)
- Flexible/open-ended trip dates
- Friends system + friend-tier profile visibility
- Flight suggestions from Amadeus API
- Budget tracking per trip
- Receipt photo capture
- Trip duplication / templates
- OAuth login (Google, Apple)

---

## Development Commands

```bash
npm run dev          # dev server at localhost:3000
npm run build        # production build — always run before committing
git add -A && git commit -m "..." && git push   # auto-deploys to Vercel
```

To apply a new SQL migration:
```js
// Write a script like this, run with node, then delete it:
import pg from 'pg'
const client = new pg.Client({ connectionString: 'postgresql://postgres:PASSWORD@db.fkybsfpdhvjitivsylnj.supabase.co:5432/postgres', ssl: { rejectUnauthorized: false } })
await client.connect()
await client.query(/* your SQL */)
await client.end()
```
