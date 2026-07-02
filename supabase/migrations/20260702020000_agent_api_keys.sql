-- Agent API keys: hashed, per-key scoped tokens for external agents (Paperclip
-- etc.) to call the blog + ops endpoints. One row per key; the plaintext secret
-- is shown once at creation and never stored — only its SHA-256 hash.
--
-- Access is service-role only (RLS on, no policies) — the admin API reads/writes
-- with the service-role client; the anon/auth clients can never see key hashes.

create extension if not exists pgcrypto;

create table if not exists public.agent_api_keys (
  id           uuid primary key default gen_random_uuid(),
  label        text not null,
  key_prefix   text not null,                 -- display only, e.g. "drv_1a2b3c4d"
  key_hash     text not null unique,          -- sha256(hex) of the full secret
  scopes       text[] not null default '{}',  -- e.g. {'blog:write','ops:overview'}
  active       boolean not null default true,
  last_used_at timestamptz,
  created_by   uuid,                          -- admin_users.user_id that created it
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists agent_api_keys_active_idx on public.agent_api_keys (active);

alter table public.agent_api_keys enable row level security;
-- No policies → only the service-role key (which bypasses RLS) can touch this.

comment on table public.agent_api_keys is
  'Hashed, per-key scoped API tokens for external agents. Service-role access only.';
