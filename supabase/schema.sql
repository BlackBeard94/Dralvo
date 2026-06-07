create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);

create table if not exists public.indicator_snapshots (
  id uuid primary key default gen_random_uuid(),
  indicator_key text not null,
  value_json jsonb not null,
  observed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists indicator_snapshots_key_observed_idx
  on public.indicator_snapshots (indicator_key, observed_at desc);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  indicator_key text not null,
  condition_json jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists alerts_user_active_idx
  on public.alerts (user_id, active);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.waitlist_signups enable row level security;
alter table public.indicator_snapshots enable row level security;
alter table public.alerts enable row level security;
alter table public.subscriptions enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can read their own alerts"
  on public.alerts for select
  using (auth.uid() = user_id);

create policy "Users can manage their own alerts"
  on public.alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Authenticated users can read indicator snapshots"
  on public.indicator_snapshots for select
  using (auth.role() = 'authenticated');
