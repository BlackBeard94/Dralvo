-- Anti-sharing: bind an `unlimited` license to a limited set of MT5 accounts
-- on a trust-on-first-use basis. The first `max_accounts` distinct accounts
-- that validate with the key are registered; any further account is rejected.
alter table public.license_keys
  add column if not exists max_accounts int not null default 2;

create table if not exists public.license_devices (
  id          uuid primary key default gen_random_uuid(),
  license_id  uuid not null references public.license_keys(id) on delete cascade,
  mt5_account text not null,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  unique (license_id, mt5_account)
);

create index if not exists license_devices_license_id_idx
  on public.license_devices(license_id);

-- Only the service role (which bypasses RLS) reads/writes device bindings,
-- from the license validation endpoint. No policies → blocked for anon/auth.
alter table public.license_devices enable row level security;
