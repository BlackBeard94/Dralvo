create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (
    event_name in (
      'dashboard_view',
      'monitor_created',
      'checkout_started',
      'vietqr_requested',
      'evidence_exported'
    )
  ),
  route_path text,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint product_events_route_path_safe check (
    route_path is null or (
      route_path like '/dashboard%' and
      position('?' in route_path) = 0 and
      position('#' in route_path) = 0 and
      char_length(route_path) <= 120
    )
  )
);

create index if not exists product_events_user_occurred_idx
  on public.product_events (user_id, occurred_at desc);

create index if not exists product_events_name_occurred_idx
  on public.product_events (event_name, occurred_at desc);

alter table public.product_events enable row level security;

drop policy if exists "Service role can manage product events"
  on public.product_events;

create policy "Service role can manage product events"
  on public.product_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
