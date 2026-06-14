-- ============================================================================
-- Alert Notification System Migration
-- Adds notification preferences to profiles + alert_notifications table
-- ============================================================================

-- 1. Add telegram_chat_id and notification_prefs to profiles
alter table public.profiles
  add column if not exists telegram_chat_id text,
  add column if not exists notification_prefs jsonb not null default '{"email":true,"telegram":false,"in_app":true}'::jsonb;

-- 2. Create alert_notifications table
create table if not exists public.alert_notifications (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  indicator_key text not null,
  indicator_name text,
  condition_json jsonb not null,
  condition_text text,
  triggered_value text not null,
  triggered_at timestamptz not null default now(),
  read boolean not null default false,
  channels_sent jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.alert_notifications
  add column if not exists indicator_name text,
  add column if not exists condition_json jsonb not null default '{}'::jsonb,
  add column if not exists condition_text text,
  add column if not exists triggered_value text not null default '',
  add column if not exists triggered_at timestamptz not null default now(),
  add column if not exists read boolean not null default false,
  add column if not exists channels_sent jsonb not null default '[]'::jsonb;

create index if not exists alert_notifications_user_created_idx
  on public.alert_notifications (user_id, created_at desc);

create index if not exists alert_notifications_alert_created_idx
  on public.alert_notifications (alert_id, created_at desc);

create unique index if not exists indicator_snapshots_key_observed_unique_idx
  on public.indicator_snapshots (indicator_key, observed_at);

-- 3. Create alert_trigger_state table for dedup logic
-- Tracks the last triggered state per alert so we don't spam
create table if not exists public.alert_trigger_state (
  alert_id uuid primary key references public.alerts(id) on delete cascade,
  indicator_key text,
  last_triggered_value double precision,
  last_triggered_at timestamptz not null default now(),
  last_value text,
  is_triggered boolean not null default false
);

alter table public.alert_trigger_state
  add column if not exists indicator_key text,
  add column if not exists last_triggered_value double precision,
  add column if not exists last_observed_value double precision,
  add column if not exists last_triggered_at timestamptz not null default now(),
  add column if not exists last_value text,
  add column if not exists is_triggered boolean not null default false;

-- 4. RLS for alert_notifications
alter table public.alert_notifications enable row level security;
alter table public.alert_trigger_state enable row level security;

drop policy if exists "Users can read their own alert notifications"
  on public.alert_notifications;
create policy "Users can read their own alert notifications"
  on public.alert_notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own alert notifications"
  on public.alert_notifications;
create policy "Users can update their own alert notifications"
  on public.alert_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Service role can manage alert trigger state"
  on public.alert_trigger_state;
create policy "Service role can manage alert trigger state"
  on public.alert_trigger_state for all
  using (true)
  with check (true);

-- 5. Persistent operational run logs for cron, ingest, and webhook jobs
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
