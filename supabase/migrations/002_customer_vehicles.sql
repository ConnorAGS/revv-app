-- Customer vehicles — stores cars linked to a customer (by phone)
create table public.customer_vehicles (
  id           uuid primary key default gen_random_uuid(),
  customer_phone text not null,
  year         text,
  make         text,
  model        text,
  notes        text,
  created_at   timestamptz not null default now()
);

alter table public.customer_vehicles enable row level security;

create policy "Authenticated users can manage customer vehicles"
  on public.customer_vehicles for all
  to authenticated
  using (true)
  with check (true);

create index on public.customer_vehicles (customer_phone);
