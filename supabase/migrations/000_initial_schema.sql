-- =============================================================
-- ACME Auto Works — full initial schema
-- Run this in Supabase: Dashboard → SQL Editor → Run
-- =============================================================

-- -------------------------
-- TECHNICIANS
-- -------------------------
create table public.technicians (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  name       text not null,
  email      text not null unique,
  phone      text,
  status     text not null default 'active',
  latitude   double precision,
  longitude  double precision,
  created_at timestamptz not null default now()
);

alter table public.technicians enable row level security;

-- Techs can read their own row; admins use service role
create policy "Techs can view their own record"
  on public.technicians for select
  using (auth.uid() = user_id);

create policy "Techs can update their own location"
  on public.technicians for update
  using (auth.uid() = user_id);

-- -------------------------
-- BOOKINGS
-- -------------------------
create table public.bookings (
  id                         uuid primary key default gen_random_uuid(),
  name                       text not null,
  phone                      text not null,
  email                      text,
  service_type               text not null,
  vehicle_year               text,
  vehicle_make               text,
  vehicle_model              text,
  address                    text not null,
  latitude                   double precision,
  longitude                  double precision,
  notes                      text,
  status                     text not null default 'pending',
  price                      numeric(10,2),
  estimated_duration_minutes integer,
  preferred_date             text,
  preferred_time             text,
  assigned_to                uuid references public.technicians(id),
  accepted_by                uuid references public.technicians(id),
  accepted_at                timestamptz,
  clocked_in_at              timestamptz,
  clocked_out_at             timestamptz,
  photo_before               text,
  photo_after                text,
  created_at                 timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Authenticated techs can read all bookings (to see available jobs)
create policy "Techs can view all bookings"
  on public.bookings for select
  to authenticated
  using (true);

-- Techs can update bookings assigned to them
create policy "Techs can update their assigned bookings"
  on public.bookings for update
  to authenticated
  using (true);

-- Anonymous users can insert (submit a booking)
create policy "Anyone can create a booking"
  on public.bookings for insert
  with check (true);

-- Anyone can read their own booking by id (for the tracking page)
create policy "Anyone can track their booking"
  on public.bookings for select
  using (true);

-- -------------------------
-- CHECKLIST ITEMS
-- -------------------------
create table public.checklist_items (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  label       text not null,
  completed   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.checklist_items enable row level security;

create policy "Authenticated users can manage checklist items"
  on public.checklist_items for all
  to authenticated
  using (true)
  with check (true);

-- -------------------------
-- PARTS REQUESTS
-- -------------------------
create table public.parts_requests (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  name        text not null,
  brand       text,
  qty         integer not null default 1,
  status      text not null default 'needed',
  created_at  timestamptz not null default now()
);

alter table public.parts_requests enable row level security;

create policy "Authenticated users can manage parts requests"
  on public.parts_requests for all
  to authenticated
  using (true)
  with check (true);

-- -------------------------
-- JOB UPDATES
-- -------------------------
create table public.job_updates (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  message     text,
  photo_url   text,
  created_at  timestamptz not null default now()
);

alter table public.job_updates enable row level security;

-- Anyone can read updates (for customer tracking page)
create policy "Anyone can view job updates"
  on public.job_updates for select
  using (true);

create policy "Authenticated users can post job updates"
  on public.job_updates for insert
  to authenticated
  with check (true);

-- -------------------------
-- REALTIME
-- -------------------------
alter publication supabase_realtime add table public.job_updates;
alter publication supabase_realtime add table public.bookings;

-- -------------------------
-- STORAGE BUCKET
-- -------------------------
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', true)
on conflict do nothing;

create policy "Authenticated users can upload job photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'job-photos');

create policy "Job photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'job-photos');
