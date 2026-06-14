create table if not exists public.evidence_observations (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  driver_key text not null,
  series_key text not null,
  numeric_value double precision not null,
  unit text not null,
  observed_at timestamptz not null,
  released_at timestamptz,
  retrieved_at timestamptz not null default now(),
  source_url text not null,
  quality text not null check (quality in ('verified', 'delayed', 'estimated')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists evidence_observations_source_series_observed_unique_idx
  on public.evidence_observations (source_key, series_key, observed_at);

create index if not exists evidence_observations_driver_series_observed_idx
  on public.evidence_observations (driver_key, series_key, observed_at desc);

alter table public.evidence_observations enable row level security;

drop policy if exists "Authenticated users can read evidence observations"
  on public.evidence_observations;

create policy "Authenticated users can read evidence observations"
  on public.evidence_observations for select
  using (auth.role() = 'authenticated');
