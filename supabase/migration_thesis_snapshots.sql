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
