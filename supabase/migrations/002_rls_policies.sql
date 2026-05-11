-- ============================================================
-- Wayfarer — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.privacy_settings enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_permissions enable row level security;
alter table public.invitations enable row level security;
alter table public.flights enable row level security;
alter table public.hotels enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.places enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;

-- ============================================================
-- Helper: is user a member of this trip?
-- ============================================================
create or replace function public.is_trip_member(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = p_user_id
  );
$$;

-- Helper: is user an owner of this trip?
create or replace function public.is_trip_owner(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = p_user_id and role = 'owner'
  );
$$;

-- Helper: get user's role on a trip
create or replace function public.trip_role(p_trip_id uuid, p_user_id uuid)
returns member_role
language sql
security definer
stable
as $$
  select role from public.trip_members
  where trip_id = p_trip_id and user_id = p_user_id
  limit 1;
$$;

-- ============================================================
-- users
-- ============================================================

-- Own profile: full access
create policy "users: read own" on public.users
  for select using (auth.uid() = id);

create policy "users: update own" on public.users
  for update using (auth.uid() = id);

create policy "users: insert own" on public.users
  for insert with check (auth.uid() = id);

-- Trip co-members can see basic profile info (display_name, avatar_url)
-- Fine-grained field filtering is handled by privacy_settings at app layer
-- We allow select for co-members; sensitive fields filtered in queries
create policy "users: read co-members" on public.users
  for select using (
    exists (
      select 1 from public.trip_members tm1
      join public.trip_members tm2 on tm1.trip_id = tm2.trip_id
      where tm1.user_id = auth.uid()
        and tm2.user_id = users.id
    )
  );

-- ============================================================
-- privacy_settings
-- ============================================================

create policy "privacy: read own" on public.privacy_settings
  for select using (auth.uid() = user_id);

create policy "privacy: update own" on public.privacy_settings
  for update using (auth.uid() = user_id);

create policy "privacy: insert own" on public.privacy_settings
  for insert with check (auth.uid() = user_id);

-- Co-members can read privacy settings to know what fields to show
create policy "privacy: read co-members" on public.privacy_settings
  for select using (
    exists (
      select 1 from public.trip_members tm1
      join public.trip_members tm2 on tm1.trip_id = tm2.trip_id
      where tm1.user_id = auth.uid()
        and tm2.user_id = privacy_settings.user_id
    )
  );

-- ============================================================
-- trips
-- ============================================================

create policy "trips: read if member" on public.trips
  for select using (
    public.is_trip_member(id, auth.uid())
  );

create policy "trips: insert authenticated" on public.trips
  for insert with check (auth.uid() = created_by);

-- Only owner can update trip info (unless members_can_edit_info = true handled at app layer)
create policy "trips: update if owner" on public.trips
  for update using (
    public.is_trip_owner(id, auth.uid())
  );

create policy "trips: delete if owner" on public.trips
  for delete using (
    public.is_trip_owner(id, auth.uid())
  );

-- ============================================================
-- trip_members
-- ============================================================

create policy "trip_members: read if member" on public.trip_members
  for select using (
    public.is_trip_member(trip_id, auth.uid())
  );

create policy "trip_members: insert if owner or invite-permitted member" on public.trip_members
  for insert with check (
    public.is_trip_owner(trip_id, auth.uid())
    or (
      public.is_trip_member(trip_id, auth.uid())
      and exists (
        select 1 from public.trip_permissions
        where trip_id = trip_members.trip_id and members_can_invite = true
      )
    )
    or auth.uid() = user_id  -- allow self-join on invitation acceptance
  );

create policy "trip_members: update if owner" on public.trip_members
  for update using (
    public.is_trip_owner(trip_id, auth.uid())
  );

create policy "trip_members: delete if owner or self" on public.trip_members
  for delete using (
    public.is_trip_owner(trip_id, auth.uid())
    or auth.uid() = user_id
  );

-- ============================================================
-- trip_permissions
-- ============================================================

create policy "trip_permissions: read if member" on public.trip_permissions
  for select using (
    public.is_trip_member(trip_id, auth.uid())
  );

create policy "trip_permissions: insert if owner" on public.trip_permissions
  for insert with check (
    public.is_trip_owner(trip_id, auth.uid())
  );

create policy "trip_permissions: update if owner" on public.trip_permissions
  for update using (
    public.is_trip_owner(trip_id, auth.uid())
  );

-- ============================================================
-- invitations
-- ============================================================

-- Invited user can see their own invitation (matched by email)
create policy "invitations: read own or member" on public.invitations
  for select using (
    public.is_trip_member(trip_id, auth.uid())
    or invited_email = (select email from public.users where id = auth.uid())
  );

create policy "invitations: insert if owner or invite-permitted" on public.invitations
  for insert with check (
    public.is_trip_owner(trip_id, auth.uid())
    or (
      public.is_trip_member(trip_id, auth.uid())
      and exists (
        select 1 from public.trip_permissions
        where trip_id = invitations.trip_id and members_can_invite = true
      )
    )
  );

-- Invitee can update (accept/decline), owner can update
create policy "invitations: update invitee or owner" on public.invitations
  for update using (
    public.is_trip_owner(trip_id, auth.uid())
    or invited_email = (select email from public.users where id = auth.uid())
  );

-- ============================================================
-- flights
-- ============================================================

create policy "flights: read if member" on public.flights
  for select using (
    public.is_trip_member(trip_id, auth.uid())
  );

create policy "flights: insert if owner or edit-permitted" on public.flights
  for insert with check (
    public.is_trip_owner(trip_id, auth.uid())
    or (
      public.is_trip_member(trip_id, auth.uid())
      and exists (
        select 1 from public.trip_permissions
        where trip_id = flights.trip_id and members_can_edit_info = true
      )
    )
  );

create policy "flights: update if owner or edit-permitted" on public.flights
  for update using (
    public.is_trip_owner(trip_id, auth.uid())
    or (
      public.is_trip_member(trip_id, auth.uid())
      and exists (
        select 1 from public.trip_permissions
        where trip_id = flights.trip_id and members_can_edit_info = true
      )
    )
  );

create policy "flights: delete if owner or adder" on public.flights
  for delete using (
    public.is_trip_owner(trip_id, auth.uid())
    or auth.uid() = added_by
  );

-- ============================================================
-- hotels
-- ============================================================

create policy "hotels: read if member" on public.hotels
  for select using (
    public.is_trip_member(trip_id, auth.uid())
  );

create policy "hotels: insert if owner or edit-permitted" on public.hotels
  for insert with check (
    public.is_trip_owner(trip_id, auth.uid())
    or (
      public.is_trip_member(trip_id, auth.uid())
      and exists (
        select 1 from public.trip_permissions
        where trip_id = hotels.trip_id and members_can_edit_info = true
      )
    )
  );

create policy "hotels: update if owner or edit-permitted" on public.hotels
  for update using (
    public.is_trip_owner(trip_id, auth.uid())
    or (
      public.is_trip_member(trip_id, auth.uid())
      and exists (
        select 1 from public.trip_permissions
        where trip_id = hotels.trip_id and members_can_edit_info = true
      )
    )
  );

create policy "hotels: delete if owner" on public.hotels
  for delete using (
    public.is_trip_owner(trip_id, auth.uid())
  );

-- ============================================================
-- itinerary_items
-- ============================================================

create policy "itinerary: read if member or permitted viewer" on public.itinerary_items
  for select using (
    public.trip_role(trip_id, auth.uid()) in ('owner', 'member')
    or (
      public.trip_role(trip_id, auth.uid()) = 'viewer'
      and exists (
        select 1 from public.trip_permissions
        where trip_id = itinerary_items.trip_id and itinerary_visible_to_viewers = true
      )
    )
  );

create policy "itinerary: insert if owner or add-permitted member" on public.itinerary_items
  for insert with check (
    public.is_trip_owner(trip_id, auth.uid())
    or (
      public.trip_role(trip_id, auth.uid()) = 'member'
      and exists (
        select 1 from public.trip_permissions
        where trip_id = itinerary_items.trip_id and members_can_add_itinerary = true
      )
    )
  );

create policy "itinerary: delete if owner or adder" on public.itinerary_items
  for delete using (
    public.is_trip_owner(trip_id, auth.uid())
    or auth.uid() = added_by
  );

-- ============================================================
-- places (favourites)
-- ============================================================

create policy "places: read if member" on public.places
  for select using (
    public.is_trip_member(trip_id, auth.uid())
  );

create policy "places: insert if member (not viewer)" on public.places
  for insert with check (
    public.trip_role(trip_id, auth.uid()) in ('owner', 'member')
  );

create policy "places: update if member" on public.places
  for update using (
    public.trip_role(trip_id, auth.uid()) in ('owner', 'member')
  );

create policy "places: delete if owner or adder" on public.places
  for delete using (
    public.is_trip_owner(trip_id, auth.uid())
    or auth.uid() = added_by
  );

-- ============================================================
-- expenses
-- ============================================================

-- Viewers cannot see expenses (spec Section 6.2)
create policy "expenses: read if non-viewer member" on public.expenses
  for select using (
    public.trip_role(trip_id, auth.uid()) in ('owner', 'member')
  );

create policy "expenses: insert if non-viewer member" on public.expenses
  for insert with check (
    public.trip_role(trip_id, auth.uid()) in ('owner', 'member')
  );

create policy "expenses: update if adder or owner" on public.expenses
  for update using (
    public.is_trip_owner(trip_id, auth.uid())
    or auth.uid() = added_by
  );

create policy "expenses: delete if adder or owner" on public.expenses
  for delete using (
    public.is_trip_owner(trip_id, auth.uid())
    or auth.uid() = added_by
  );

-- ============================================================
-- expense_splits
-- ============================================================

create policy "expense_splits: read if on trip (non-viewer)" on public.expense_splits
  for select using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id
        and public.trip_role(e.trip_id, auth.uid()) in ('owner', 'member')
    )
  );

create policy "expense_splits: insert via expense owner" on public.expense_splits
  for insert with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id
        and (e.added_by = auth.uid() or public.is_trip_owner(e.trip_id, auth.uid()))
    )
  );

-- User can update their own split (dispute), expense adder/owner can update any
create policy "expense_splits: update self or expense owner" on public.expense_splits
  for update using (
    auth.uid() = user_id
    or exists (
      select 1 from public.expenses e
      where e.id = expense_id
        and (e.added_by = auth.uid() or public.is_trip_owner(e.trip_id, auth.uid()))
    )
  );

-- ============================================================
-- payments
-- ============================================================

create policy "payments: read if on trip (non-viewer)" on public.payments
  for select using (
    public.trip_role(trip_id, auth.uid()) in ('owner', 'member')
  );

create policy "payments: insert if non-viewer member" on public.payments
  for insert with check (
    public.trip_role(trip_id, auth.uid()) in ('owner', 'member')
    and auth.uid() = from_user_id
  );

-- Recipient can confirm; sender is from_user_id
create policy "payments: update if recipient or sender" on public.payments
  for update using (
    auth.uid() = to_user_id or auth.uid() = from_user_id
  );

-- ============================================================
-- notifications
-- ============================================================

create policy "notifications: read own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications: update own (mark read)" on public.notifications
  for update using (auth.uid() = user_id);

-- Inserts done via service role (edge functions / server actions) only
-- No direct client inserts allowed
