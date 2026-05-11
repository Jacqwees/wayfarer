-- ============================================================
-- Wayfarer — Initial Schema Migration
-- All 14 tables from spec Section 3
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type member_role as enum ('owner', 'member', 'viewer');
create type invitation_status as enum ('pending', 'accepted', 'declined');
create type invited_role as enum ('member', 'viewer');
create type flight_direction as enum ('outbound', 'return');
create type split_type as enum ('equal_all', 'equal_select', 'custom');
create type split_status as enum ('unpaid', 'disputed', 'paid');
create type payment_status as enum ('pending', 'confirmed');
create type visibility as enum ('trip', 'friend', 'private');
create type place_category as enum ('eat', 'drink', 'activity', 'sight', 'other');

-- ============================================================
-- 3.1 users
-- ============================================================

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null default '',
  avatar_url text,
  phone text,
  bio text,
  home_city text,
  onboarding_complete bool not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3.2 privacy_settings
-- ============================================================

create table public.privacy_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  phone_visibility visibility not null default 'trip',
  bio_visibility visibility not null default 'trip',
  home_city_visibility visibility not null default 'trip'
);

-- ============================================================
-- 3.3 trips
-- ============================================================

create table public.trips (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  destination_name text not null,
  destination_lat float,
  destination_lng float,
  start_date date not null,
  end_date date not null,
  cover_photo_url text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3.4 trip_members
-- ============================================================

create table public.trip_members (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

-- ============================================================
-- 3.5 trip_permissions
-- ============================================================

create table public.trip_permissions (
  trip_id uuid primary key references public.trips(id) on delete cascade,
  members_can_edit_info bool not null default false,
  members_can_add_itinerary bool not null default true,
  members_can_invite bool not null default false,
  itinerary_visible_to_viewers bool not null default true
);

-- ============================================================
-- 3.6 invitations
-- ============================================================

create table public.invitations (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  invited_email text not null,
  invited_role invited_role not null default 'member',
  invited_by uuid not null references public.users(id),
  status invitation_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3.7 flights
-- ============================================================

create table public.flights (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  direction flight_direction not null,
  departure_airport text not null,
  arrival_airport text not null,
  departure_datetime timestamptz not null,
  arrival_datetime timestamptz not null,
  flight_number text,
  airline text,
  booking_ref text,
  notes text,
  added_by uuid not null references public.users(id)
);

-- ============================================================
-- 3.8 hotels
-- ============================================================

create table public.hotels (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  address text not null,
  lat float,
  lng float,
  check_in_date date not null,
  check_out_date date not null,
  booking_ref text,
  notes text,
  added_by uuid not null references public.users(id)
);

-- ============================================================
-- 3.9 itinerary_items
-- ============================================================

create table public.itinerary_items (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  date date not null,
  title text not null,
  description text,
  place_id text,
  lat float,
  lng float,
  time time,
  added_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3.10 places (favourites)
-- ============================================================

create table public.places (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  google_place_id text not null,
  name text not null,
  category place_category not null default 'other',
  lat float not null,
  lng float not null,
  price_level int,
  rating float,
  photo_url text,
  added_to_itinerary bool not null default false,
  added_by uuid not null references public.users(id)
);

-- ============================================================
-- 3.11 expenses
-- ============================================================

create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  description text not null,
  amount decimal(12,2) not null,
  currency text not null default 'GBP',
  amount_gbp decimal(12,2) not null,
  fx_rate_used decimal(12,6) not null default 1.0,
  paid_by uuid not null references public.users(id),
  date date not null default current_date,
  category text not null default 'other',
  split_type split_type not null default 'equal_all',
  added_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3.12 expense_splits
-- ============================================================

create table public.expense_splits (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.users(id),
  amount_owed decimal(12,2) not null,
  status split_status not null default 'unpaid',
  disputed_at timestamptz,
  paid_at timestamptz
);

-- ============================================================
-- 3.13 payments
-- ============================================================

create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  from_user_id uuid not null references public.users(id),
  to_user_id uuid not null references public.users(id),
  amount decimal(12,2) not null,
  note text,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

-- ============================================================
-- 3.14 notifications
-- ============================================================

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  trip_id uuid references public.trips(id) on delete set null,
  reference_id uuid,
  message text not null,
  read bool not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES for common query patterns
-- ============================================================

create index on public.trip_members (user_id);
create index on public.trip_members (trip_id);
create index on public.invitations (invited_email);
create index on public.invitations (trip_id);
create index on public.flights (trip_id);
create index on public.hotels (trip_id);
create index on public.itinerary_items (trip_id, date);
create index on public.places (trip_id);
create index on public.expenses (trip_id);
create index on public.expense_splits (expense_id);
create index on public.expense_splits (user_id);
create index on public.payments (trip_id);
create index on public.notifications (user_id, read);
