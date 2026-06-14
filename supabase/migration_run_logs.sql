-- ============================================================================
-- Persistent Operational Run Logs Migration
-- Stores cron, ingest, and webhook execution status for observability.
-- ============================================================================

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
  using (true)
  with check (true);
