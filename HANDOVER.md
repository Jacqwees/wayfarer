# SquadStay — Handover Document

> Group holiday planning PWA. This file is the authoritative handover: what's built, how it works, what's left, and how to continue.

**Live:** https://squadstay.co.uk  
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
RESEND_FROM_EMAIL=SquadStay <noreply@yourdomain.com>   (set once domain verified in Resend)
NEXT_PUBLIC_APP_URL=https://yourdomain.com             (set once custom domain live)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   (push — generate with: npx web-push generate-vapid-keys)
VAPID_PRIVATE_KEY=...              (push — same command)
VAPID_SUBJECT=mailto:hello@squadstay.co.uk
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
  (auth)/login/               OTP sign-in — landing hero + bottom-sheet form
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
  auth/callback/              Legacy magic link handler (kept for fallback)
  auth/setup/                 Post-OTP server route — ensureUserSetup + redirect to /onboarding or /trips
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

> **Action needed:** Two tables must be created manually in Supabase. Run both SQL blocks below in the dashboard (SQL Editor → New Query):

**Table 1 — packing_items** (shared trip checklist):
```sql
create table if not exists packing_items (
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

**Table 2 — push_subscriptions** (web push tokens per user device):
```sql
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);
alter table push_subscriptions enable row level security;
create policy "users can manage own push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id);
```

**RLS helper functions** (security definer — bypass RLS safely):
- `is_trip_member(trip_id, user_id)` → bool
- `is_trip_owner(trip_id, user_id)` → bool
- `trip_role(trip_id, user_id)` → text

**Storage buckets:** `avatars` (public), `covers` (public)

**Auth config:** Site URL = `https://squadstay.co.uk`, redirect URL = `https://squadstay.co.uk/auth/callback`

---

## Design System — Voyage Press

Editorial travel-journal aesthetic. Source of truth: `theme.jsx` in Downloads (design files).

### Fonts (loaded in `app/layout.tsx`)
| CSS Variable | Font | Package | Usage |
|---|---|---|---|
| `--font-geist-sans` | Geist | `geist` npm package | Body, labels, buttons |
| `--font-display` | Newsreader italic | `next/font/google` | Page headings, trip names, big italic text |
| `--font-geist-mono` | Geist Mono | `geist` npm package | Eyebrows, timestamps, codes, amounts |

**Eyebrow pattern** (use the `.eyebrow` utility class):
```tsx
<p className="eyebrow">Section label</p>
<h1 className="font-display italic text-[32px] leading-[0.92] tracking-[-0.01em]">Heading</h1>
```

**Perforated divider** (signature element — use inline SVG):
```tsx
<svg height="2" width="100%">
  <line x1="0" y1="1" x2="100%" y2="1"
    stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 5" />
</svg>
```

### Colour Tokens (`app/globals.css`)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#F4EDE0` paper | `#171511` | Page background |
| `--card` | `#FCF8EE` warm white | `#22201A` | Card background |
| `--primary` | `#E0533A` coral | `#F26B52` | Brand, CTAs |
| `--secondary` | `#EBE2D1` paperAlt | `#2A2720` | Subtle fills |
| `--muted-foreground` | `#928873` inkMute | `#B8AC97` | Secondary text |
| `--border` | `#D9CFB9` line | `#3A352C` | Dividers |

**Named accent colors** (in `tailwind.config.ts`):
- `text-sage` / `bg-sage` → `#5B7556` — nature, outdoors
- `text-amber` / `bg-amber` → `#D9923B` — food, warmth
- `text-sky` / `bg-sky` → `#6FA4C2` — flights, sea
- `text-pink` / `bg-pink` → `#E89AAE` — social, fun

### Radii
| Class | Value | Use |
|---|---|---|
| `rounded-sm` | 4px | Tags, tiny badges |
| `rounded` / `rounded-md` | 8px | Default |
| `rounded-lg` | 14px | **Cards, panels** |
| `rounded-xl` | 22px | Form inputs, large cards |
| `rounded-[28px]` | 28px | Bottom sheets (`rounded-t-[28px]`) |
| `rounded-full` | 9999px | Pill buttons, nav, avatars |

### Component patterns
- **Primary CTA:** `rounded-full bg-primary text-primary-foreground h-12 px-6 font-semibold active:scale-[0.98]`
- **Ghost outline:** `rounded-full border border-border text-foreground`
- **Cards:** `bg-card border border-border rounded-xl`
- **Bottom sheets:** spring animate with `type: 'spring', damping: 30, stiffness: 280`, `rounded-t-[28px]`
- **Staggered entrance:** `delay: index * 0.06` on card grids

---

## What's Built (Complete)

- [x] **PWA shell** — manifest, icons, service worker, installable on iOS + Android
- [x] **Auth** — OTP sign-in (no magic links): `admin.generateLink` server-side, Resend email, `verifyOtp` (implicit flow) client-side, `/auth/setup` handles first-login profile creation
- [x] **Invitation flow** — email links to `/login?email=...`, pre-fills email + skips landing, invitation → notification on first sign-in
- [x] **Onboarding** — 4-step animated flow (name/avatar → details → notifications → ready), runs once
- [x] **Login page** — full-bleed gradient hero with product story, spring bottom-sheet form, OTP code entry
- [x] **Trips list** — featured hero card (first upcoming trip) + mini compact cards (remaining), personalized "X trips, Y nights" header, perforated divider
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
- [x] **Notifications inbox** — all notification types, mark read, realtime subscription, tap-to-navigate, invite accept/decline sheet
- [x] **Profile** — view/edit name, phone, bio, home city, avatar upload, visibility toggles, sign out
- [x] **Balance widget** — on trip dashboard, shows net owed/owing, links to expenses
- [x] **Voyage Press design system** — Geist + Newsreader + Geist Mono, coral primary, parchment backgrounds, perforated dividers
- [x] **Loading screens** — `loading.tsx` on trips, trip dashboard, notifications, profile, all sub-pages

---

## Still To Do

These are ordered by priority / dependency:

### 1. Screen redesigns (in progress — login ✅, trips list ✅)
- [x] Login page — full-bleed gradient hero with product story + bottom-sheet OTP form
- [x] Trips list — featured hero card + mini cards + perforated divider
- [x] Trip dashboard — full-bleed hero, live countdown ticker, DashTile grid, members in hero
- [ ] Flights — boarding pass card with corner notches
- [ ] Itinerary — day picker strip + timeline dot connectors
- [ ] Expenses — hero balance card with perforated divider
- [ ] Profile — stats row + travel style tags

### 2. Push Notifications
- Infrastructure is complete: `app/actions/push.ts`, `worker/index.js`, `StepNotifications.tsx`
- `sendPushToUser()` is already wired into: addExpense, recordPayment, confirmPayment, nudgePayer, sendInvitation, respondToInvitation
- **Still needed — do once:**
  1. Run the `push_subscriptions` SQL (see Database section below)
  2. Generate VAPID keys: `npx web-push generate-vapid-keys`
  3. Add to Vercel dashboard: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:hello@squadstay.co.uk`
  4. Redeploy (push to main)
  - Note: iOS requires HTTPS + Safari 16.4+ — works on squadstay.co.uk ✅

### 2. Offline Support
- Service worker is registered but offline queue is not implemented
- Plan: use Dexie.js (IndexedDB) to queue expense adds when offline, sync on reconnect, show "pending sync" badge on queued items
- Files to touch: `public/sw.js`, new `lib/offline-queue.ts`, `components/trips/ExpensesView.tsx`

### 3. Email Deliverability — action required
**Root cause:** Resend's sandbox (`onboarding@resend.dev`) only delivers to the email you registered with. All other recipients are silently dropped.

**Fix — do once:**

**Step 1 — Verify squadstay.co.uk in Resend:**
- Go to `app.resend.com` → Domains → Add Domain → enter `squadstay.co.uk`
- Add the DNS records Resend gives you (SPF, DKIM — takes ~10 min to verify)

**Step 2 — Set these in Vercel dashboard → Settings → Environment Variables:**
```
RESEND_FROM_EMAIL=SquadStay <noreply@squadstay.co.uk>
NEXT_PUBLIC_APP_URL=https://squadstay.co.uk
```
No code changes needed — the actions already read these.

**Step 3 — Update Supabase Auth SMTP sender:**
- Supabase dashboard → Authentication → Settings → SMTP Settings
- Change "Sender email" to `noreply@squadstay.co.uk`
- The host/port/API key credentials should already be Resend's

**Step 4 — Update Supabase Auth URLs:**
- Supabase dashboard → Authentication → URL Configuration
- Site URL: `https://squadstay.co.uk`
- Redirect URLs: add `https://squadstay.co.uk/auth/callback`

### 4. Domain
- Live at `https://squadstay.co.uk` ✅
- Vercel domain already configured (or set via Vercel dashboard → project → Domains)

### 5. Share-Link Invites
- Currently invite-only by email (known contact)
- Add a `/trips/[tripId]/join/[token]` route: generate a short-lived token, anyone with the link can join as Member or Viewer

### 6. Database Tables
- Run **both** SQL blocks in the **Database** section above if not already done:
  - `packing_items` — powers the shared packing checklist (code is complete)
  - `push_subscriptions` — stores push tokens (code is complete)

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
