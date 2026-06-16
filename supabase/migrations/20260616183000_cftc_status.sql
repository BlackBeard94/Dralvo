create table if not exists public.cftc_status (
  id text primary key default 'xauusd',
  bullish boolean not null default false,
  mm_net integer not null default 0,
  updated date not null,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint cftc_status_singleton check (id = 'xauusd')
);

alter table public.cftc_status enable row level security;

drop policy if exists "Service role can manage CFTC status"
  on public.cftc_status;
create policy "Service role can manage CFTC status"
  on public.cftc_status for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
