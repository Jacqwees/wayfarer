# Wayfarer — Handover Document

> Group holiday planning PWA. This file is the authoritative handover: what's built, how it works, what's left, and how to continue.

**Live:** https://wayfarer-plum.vercel.app  
**Repo:** https://github.com/Jacqwees/wayfarer  
**Supabase:** https://supabase.com/dashboard/project/fkybsfpdhvjitivsylnj  
**Vercel:** https://vercel.com (auto-deploys on push to `main`)

---

## Picking up in a new Claude session

Paste this prompt to resume:

> Read HANDOVER.md carefully. Continue building from the "Still To Do" section in order. Use server actions with the service role client for all DB writes. Never use toast notifications. Confirm with me before starting each major feature.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + Coastline design system (see below) |
| Database | Supabase — Postgres + Auth + Storage + Realtime |
| Hosting | Vercel (auto-deploys on push to `main`) |
| Maps | Google Maps JS API + Places API |
| Email | Resend (configured as Supabase custom SMTP) |
| FX rates | Frankfurter API (free, no key needed) |
| Animations | Framer Motion |
| Icons | Lucide React |
| PWA | next-pwa (manifest, service worker, installable on iOS + Android) |

---

## Environment Variables

Set in `.env.local` (local) and Vercel dashboard (production — already configured):

```
NEXT_PUBLIC_SUPABASE_URL=https://fkybsfpdhvjitivsylnj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
RESEND_API_KEY=re_...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   (push — not yet added to Vercel)
VAPID_PRIVATE_KEY=...              (push — not yet added to Vercel)
```

> **Action needed:** Add the two VAPID keys to the Vercel dashboard. Generate them with `npx web-push generate-vapid-keys`.

> **Security note:** The Supabase DB password was previously committed to git history. Rotate it in the Supabase dashboard (Settings → Database → Reset database password).

---

## Critical Architecture Rules

### 1. Server action DB write pattern
All DB **writes** use the **service role client** after manually verifying auth. Cookie-based RLS is unreliable inside Next.js server actions.

```ts
// app/actions/example.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function doSomething(tripId: string, data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify membership / permissions as needed
  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return { error: 'Not a member' }

  const db = createServiceClient()           // service role for write
  const { error } = await db.from('table').insert({ ... })
  if (error) return { error: error.message }

  revalidatePath(`/trips/${tripId}`)
  return {}
}
```

DB **reads** in Server Components use `createClient()` — RLS applies normally.

### 2. No toast notifications
Never. Use inline error states, confirmation bottom sheets, or the `/notifications` inbox.

### 3. File uploads
```ts
// 1. Get signed URL via server action
const { signedUrl } = await getUploadUrl('covers', `${tripId}/cover.jpg`)
// 2. PUT file from browser
await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
// 3. Public URL format:
const url = `https://fkybsfpdhvjitivsylnj.supabase.co/storage/v1/object/public/covers/${path}`
```

### 4. Google Maps
Load via `<Script src="...?key=...&libraries=places" strategy="lazyOnload" />`. Access via `(window as any).google.maps.places`. Check for `mapsReady` state before using.

### 5. Realtime subscriptions
Filter by `user_id` to avoid leaking other users' events:
```ts
supabase.channel(`rt-notifications-${userId}`)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, handler)
  .subscribe()
```

---

## Project Structure

```
app/
  (auth)/login/               Magic link login page
  (app)/                      Protected shell — layout.tsx renders BottomNav
    trips/                    Trip list (home after login)
    trips/new/                Create trip form
    trips/[tripId]/           Trip dashboard
      flights/                Outbound + return flight cards
      hotel/                  Hotel details + map link
      itinerary/              Day-by-day itinerary
      places/                 Things To Do (Google Places discovery)
      expenses/               Cost splitting + settle up
      packing/                Shared packing checklist
      members/                Member list + role management
      invite/                 Invite by email
      settings/               Trip settings (name, dates, cover, danger zone)
  notifications/              Notification inbox
  profile/                    View + edit profile
  auth/callback/              Magic link handler — creates user row on first sign-in
  onboarding/                 First-run onboarding (once, before /trips)
  actions/
    trips.ts                  createTrip, updateTrip, deleteTrip, getUploadUrl
    members.ts                removeMember, changeRole, transferOwnership, updateTripPermissions, leaveTrip
    invitations.ts            sendInvitation, cancelInvitation, resendInvitationEmail, respondToInvitation
    itinerary.ts              addItineraryItem, updateItineraryItem, deleteItineraryItem
    flights.ts                saveFlight, deleteFlight
    hotel.ts                  saveHotel, deleteHotel
    places.ts                 savePlace, removePlace, addPlaceToItinerary
    expenses.ts               addExpense, settleExpense, disputeExpense, nudgePayer, etc.
    packing.ts                addPackingItem, togglePackingItem, deletePackingItem
    notifications.ts          markNotificationRead, markAllRead
    profile.ts                updateProfile, updateAvatar, signOut
    push.ts                   saveSubscription, sendPushNotification

components/
  shared/BottomNav.tsx        Floating pill nav — Trips / Notifications / Profile
  trips/
    TripCard.tsx              Gradient card with countdown + destination
    TripListView.tsx          Upcoming/past tab switcher
    TripDashboard.tsx         Trip home with hero, member strip, feature grid
    NewTripForm.tsx           Create trip (Places autocomplete + cover upload)
    TripSettingsView.tsx      Edit trip + delete (owner only)
    ItineraryView.tsx         Day-grouped itinerary with timeline
    FlightsView.tsx           Outbound + return flight cards
    HotelView.tsx             Hotel cards with Maps link
    PlacesView.tsx            Google Places search + saved places
    ExpensesView.tsx          Full expenses + settle up (complex)
    PackingView.tsx           Shared checklist with progress bar
    MembersView.tsx           Member list + permissions panel
    InviteForm.tsx            Email invite + pending list
  onboarding/
    OnboardingFlow.tsx        Step orchestrator with progress dots
    StepName.tsx              Display name + avatar
    StepDetails.tsx           Phone / bio / home city + privacy toggles
    StepNotifications.tsx     Push notification permission request
    StepReady.tsx             Done screen
  notifications/
    NotificationsView.tsx     Inbox with realtime subscription
  profile/
    ProfileView.tsx           Profile view + edit

lib/
  supabase/
    client.ts                 Browser client (singleton)
    server.ts                 Server client (RSC + server actions — auth reads)
    service.ts                Service role client (server actions — all writes)
    middleware.ts             Session refresh on every request
  types/database.ts           TypeScript types for all DB tables (15 tables)
```

---

## Database

**15 tables** (14 original + packing_items):

| Table | Purpose |
|---|---|
| `users` | Profile data — extends Supabase auth.users |
| `privacy_settings` | Per-field visibility per user |
| `trips` | Core trip data |
| `trip_members` | User ↔ trip join — role: owner/member/viewer |
| `trip_permissions` | Per-trip toggles (members_can_invite, etc.) |
| `invitations` | Pending email invites — status: pending/accepted/declined |
| `flights` | Outbound + return flights per trip |
| `hotels` | Accommodation per trip |
| `itinerary_items` | Day-indexed items per trip |
| `places` | Saved Google Places per trip |
| `expenses` | Expenses with currency + GBP amount |
| `expense_splits` | Who owes what — status: unpaid/disputed/paid |
| `payments` | Settlement confirmations |
| `notifications` | Inbox items per user |
| `packing_items` | Shared checklist per trip |

> **Action needed:** The `packing_items` table must be created manually in Supabase. Run this SQL in the dashboard (SQL Editor):

```sql
create table packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  label text not null,
  packed boolean not null default false,
  assigned_to uuid references users(id) on delete set null,
  added_by uuid references users(id) on delete cascade not null,
  packed_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table packing_items enable row level security;
create policy "trip members can manage packing items"
  on packing_items for all
  using (is_trip_member(trip_id, auth.uid()));
```

**RLS helper functions** (security definer — bypass RLS safely):
- `is_trip_member(trip_id, user_id)` → bool
- `is_trip_owner(trip_id, user_id)` → bool
- `trip_role(trip_id, user_id)` → text

**Storage buckets:** `avatars` (public), `covers` (public)

**Auth config:** Site URL = `https://wayfarer-plum.vercel.app`, redirect URL = `https://wayfarer-plum.vercel.app/auth/callback`

---

## Design System — Coastline

The app uses the "Coastline" design language (Direction D hybrid). All screens have been updated to use it consistently.

### Fonts (loaded in `app/layout.tsx`)
| Variable | Font | Usage |
|---|---|---|
| `--font-sans` | Bricolage Grotesque | Everything — body, labels, buttons |
| `--font-display` | Instrument Serif italic | Page headings, trip names, big numbers ONLY |
| `--font-mono` | JetBrains Mono | Eyebrows, timestamps, codes, amounts |

**Eyebrow pattern** (section labels above headings):
```tsx
<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Label</p>
<h1 className="font-display italic text-[32px] leading-tight tracking-[-0.01em]">Heading</h1>
```

### Colour Tokens (`app/globals.css`)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#F6F1E6` sand | `#15110B` | Page bg |
| `--card` | `#FFFBF2` | `#1E1912` | Card bg |
| `--primary` | `#C5532A` terracotta | `#E8794A` | Brand, CTAs |
| `--accent` | `#E89A5C` peach | `#D4783A` | Secondary accent |
| `--muted` | `#ECE1CC` | `#2A2318` | Subtle fills |
| `--border` | `#E0D4BC` | `#3A2E22` | Dividers |

### Radii (`tailwind.config.ts`)
| Class | Value | Use |
|---|---|---|
| `rounded-sm` | 4px | Tags, tiny badges |
| `rounded` / `rounded-md` | 8px | Default |
| `rounded-lg` | 14px | **Cards, panels** |
| `rounded-xl` | 20px | Form inputs |
| `rounded-2xl` | 20px | (same — legacy alias) |
| `rounded-3xl` | 28px | Bottom sheets |
| `rounded-full` | 9999px | **Pill buttons, nav, avatars** |

### Component patterns
- **CTA buttons:** `rounded-full bg-primary text-primary-foreground h-12 px-6 font-semibold`
- **Secondary buttons:** `rounded-full border border-primary text-primary`
- **Cards:** `bg-card border border-border rounded-lg`
- **Bottom sheets:** `bg-background w-full rounded-t-3xl` (via Framer Motion spring)
- **Active BottomNav pill:** `motion.div layoutId="nav-pill"` spring animation
- **Staggered entrance:** `delay: index * 0.04` on card grids

---

## What's Built (Complete)

- [x] **PWA shell** — manifest, icons, service worker, installable on iOS + Android
- [x] **Auth** — magic link login, callback handler, auto-creates `users` + `privacy_settings` on first sign-in
- [x] **Onboarding** — 4-step animated flow (name/avatar → details → notifications → ready), runs once
- [x] **Trips list** — upcoming/past tabs, gradient placeholders, countdown badges, TripCard with entrance animations
- [x] **Create trip** — Google Places city autocomplete, cover photo upload, date range picker
- [x] **Trip dashboard** — hero with gradient/photo, member avatar strip, balance widget, feature card grid
- [x] **Trip settings** — edit name/destination/dates/cover, delete trip (owner only)
- [x] **Flights** — outbound + return cards, add/edit form (manual), duration, airline, booking ref
- [x] **Hotel** — accommodation cards, Google Places address autocomplete, Maps link, check-in/out dates, booking ref
- [x] **Itinerary** — day-by-day timeline, add/edit/delete items, time sorting, permissions-aware
- [x] **Things To Do** — Google Places search near destination, save to trip, add saved place to itinerary, category filter
- [x] **Expenses** — add expense (any currency → Frankfurter FX → GBP), equal/custom splits, settle up (minimised transfers), dispute flow, nudge payer
- [x] **Packing list** — shared checklist, assign to member, progress bar, filter pills, optimistic updates
- [x] **Members** — list with roles (Owner/Member/Viewer), remove, change role, transfer ownership, permissions toggles (owner only), leave trip (non-owner)
- [x] **Invite** — send invite by email + role, pending list with resend/cancel, optimistic local update
- [x] **Notifications inbox** — all notification types, mark read, realtime subscription via Supabase, tap-to-navigate, invite accept/decline sheet
- [x] **Profile** — view/edit name, phone, bio, home city, avatar upload, visibility toggles, sign out
- [x] **Balance widget** — on trip dashboard, shows net owed/owing, links to expenses
- [x] **Coastline design system** — full rollout across every screen

---

## Still To Do

These are ordered by priority / dependency:

### 1. Push Notifications (infrastructure mostly done)
- `app/actions/push.ts` and `public/sw.js` exist with push handler
- Still needed:
  - Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` to Vercel dashboard
  - Wire `sendPushNotification()` into the expense/invite/payment server actions so users actually receive pushes
  - Test on iOS (requires HTTPS + Safari 16.4+)

### 2. Offline Support
- Service worker is registered but offline queue is not implemented
- Plan: use Dexie.js (IndexedDB) to queue expense adds when offline, sync on reconnect, show "pending sync" badge on queued items
- Files to touch: `public/sw.js`, new `lib/offline-queue.ts`, `components/trips/ExpensesView.tsx`

### 3. Email Deliverability
- Resend is configured as Supabase SMTP
- Emails only arrive reliably to the Resend-verified sender domain
- **Action needed:** Verify a custom domain in Resend dashboard (`app.resend.com`) and update Supabase SMTP settings to send from that domain
- Until then, invites sent to arbitrary email addresses may not arrive

### 4. Domain
- Site is live at `wayfarer-plum.vercel.app` (Vercel default)
- To use a custom domain: buy it (Cloudflare Registrar is cheapest), add it in Vercel dashboard under the project → Domains, point DNS records as shown
- Supabase auth Site URL and redirect URL will also need updating

### 5. Share-Link Invites
- Currently invite-only by email (known contact)
- Add a `/trips/[tripId]/join/[token]` route: generate a short-lived token, anyone with the link can join as Member or Viewer

### 6. Packing Table Migration
- Run the SQL in the **Database** section above if not already done
- The code (`PackingView`, `app/actions/packing.ts`, `/packing` page) is complete — it just needs the table to exist

### 7. Minor Polish
- `TripSettingsView` cover photo upload uses a flat gradient fallback — could match the radial gradient system from TripCard
- `StepNotifications` onboarding step requests push permission but the VAPID wiring is incomplete (see #1)
- Expense dispute flow UI exists but `dispute` notification type isn't sent server-side yet
- No loading skeletons — pages do SSR but a loading.tsx per route would improve perceived performance

---

## Future Roadmap (Post-MVP)

- Multi-hotel / multi-leg trips (backpacker mode)
- Flexible/open-ended trip dates
- Friends system + friend-tier profile visibility
- Budget tracker per trip
- Receipt photo capture on expenses
- Flight suggestions from Amadeus or Skyscanner API
- Trip duplication / templates
- OAuth login (Google, Apple)
- Trip activity feed (who added what, when)

---

## Development Commands

```bash
npm run dev          # local dev at http://localhost:3000
npm run build        # production build — run before committing
npx tsc --noEmit     # type-check without building

# Deploy:
git add -A && git commit -m "..." && git push   # Vercel auto-deploys on push to main
```

### Applying a SQL migration to production

There are no Supabase CLI migrations set up. Run SQL directly via Supabase dashboard (SQL Editor) or via a one-off Node script:

```js
// run-migration.mjs — delete after use
import pg from 'pg'
const client = new pg.Client({
  connectionString: 'postgresql://postgres:PASSWORD@db.fkybsfpdhvjitivsylnj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
})
await client.connect()
await client.query(`/* your SQL here */`)
await client.end()
```

---

## Known Issues / Watch Out For

| Issue | Detail |
|---|---|
| `expense_splits.status` | Values are `'unpaid' \| 'disputed' \| 'paid'` — NOT `'pending'`. Using `'pending'` will silently fail type checks. |
| Service role in browser | Never import `createServiceClient` in client components — it exposes the service key. Server actions only. |
| Google Maps singleton | The Places autocomplete instance (`__hotelAC`) uses a global flag to avoid re-initialising on re-render. Don't remove it. |
| Realtime channel naming | Include `userId` in the channel name to prevent cross-user subscription leaks. |
| `rounded-2xl` vs `rounded-lg` | The Coastline system uses `rounded-lg` (14px) for cards. `rounded-2xl` is kept as an alias (also 20px in the config) for bottom sheet interiors. Don't mix them with `rounded-xl` (also 20px — used for form inputs). |
| Windows `.next` cache | If you get `EINVAL: invalid argument, readlink .next/...`, delete `.next/` and rebuild. |
