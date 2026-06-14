create table if not exists public.evidence_corrections (
  id uuid primary key default gen_random_uuid(),
  evidence_observation_id uuid not null references public.evidence_observations(id) on delete cascade,
  source_key text not null,
  driver_key text not null,
  series_key text not null,
  observed_at timestamptz not null,
  previous_numeric_value double precision not null,
  corrected_numeric_value double precision not null,
  unit text not null,
  correction_reason text not null,
  correction_source_url text,
  correction_metadata jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  applied_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists evidence_corrections_observation_idx
  on public.evidence_corrections (evidence_observation_id, created_at desc);

create index if not exists evidence_corrections_driver_observed_idx
  on public.evidence_corrections (driver_key, series_key, observed_at desc);

alter table public.evidence_corrections enable row level security;

drop policy if exists "Authenticated users can read evidence corrections"
  on public.evidence_corrections;

create policy "Authenticated users can read evidence corrections"
  on public.evidence_corrections for select
  using (auth.role() = 'authenticated');
