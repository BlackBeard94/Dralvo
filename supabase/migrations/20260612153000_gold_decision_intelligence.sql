-- Gold Decision Intelligence production schema.
-- Idempotent so existing manually-created objects remain compatible.

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

create table if not exists public.thesis_snapshots (
  id uuid primary key default gen_random_uuid(),
  thesis_date date not null unique,
  state text not null check (
    state in ('supportive', 'mixed', 'adverse', 'insufficient_data')
  ),
  thesis_json jsonb not null,
  methodology_version text not null,
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists thesis_snapshots_generated_idx
  on public.thesis_snapshots (generated_at desc);

alter table public.thesis_snapshots enable row level security;

drop policy if exists "Authenticated users can read thesis snapshots"
  on public.thesis_snapshots;

create policy "Authenticated users can read thesis snapshots"
  on public.thesis_snapshots for select
  using (auth.role() = 'authenticated');

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

create table if not exists public.vietqr_payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null unique,
  amount_vnd integer not null,
  bank_bin text not null,
  account_no text not null,
  account_name text not null,
  add_info text not null,
  qr_data_url text,
  qr_code text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'expired', 'canceled')),
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '48 hours'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vietqr_payment_requests_user_created_idx
  on public.vietqr_payment_requests (user_id, created_at desc);

create index if not exists vietqr_payment_requests_status_created_idx
  on public.vietqr_payment_requests (status, created_at desc);

alter table public.vietqr_payment_requests enable row level security;

drop policy if exists "Users can read their own VietQR payment requests"
  on public.vietqr_payment_requests;

create policy "Users can read their own VietQR payment requests"
  on public.vietqr_payment_requests for select
  using (auth.uid() = user_id);

create table if not exists public.run_logs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  status text not null check (status in ('success', 'error')),
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  duration_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists run_logs_type_created_idx
  on public.run_logs (run_type, created_at desc);

alter table public.run_logs enable row level security;

drop policy if exists "Service role can manage run logs"
  on public.run_logs;

create policy "Service role can manage run logs"
  on public.run_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
