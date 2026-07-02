-- Admin event feed — surfaces "something changed" to the backoffice (affiliate
-- signups, new users, payments, payout requests…). Read via /api/admin/events;
-- unread state is tracked client-side (localStorage lastSeen), so no per-admin
-- read table is needed.
create table if not exists public.admin_events (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,            -- user_signup | affiliate_signup | payment_success | partner_created | payout_request | ...
  title      text not null,
  message    text,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_events_created_idx on public.admin_events(created_at desc);

-- Writes + reads go through service-role APIs only.
alter table public.admin_events enable row level security;

-- Marketing contact list — every customer email captured on signup / payment,
-- for later email marketing. One row per email.
create table if not exists public.marketing_contacts (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  user_id    uuid references auth.users(id) on delete set null,
  source     text,                     -- signup | payment | ...
  created_at timestamptz not null default now()
);
create index if not exists marketing_contacts_created_idx on public.marketing_contacts(created_at desc);
alter table public.marketing_contacts enable row level security;

notify pgrst, 'reload schema';
