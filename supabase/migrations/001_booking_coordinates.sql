-- Run this in the Supabase SQL Editor (Dashboard → SQL) if you do not use the CLI migrator.
alter table public.bookings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

comment on column public.bookings.latitude is 'Geocoded from service address (vehicle location)';
comment on column public.bookings.longitude is 'Geocoded from service address (vehicle location)';
