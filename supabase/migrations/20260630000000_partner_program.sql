-- Partner (reseller) program — a SEPARATE system from affiliate.
-- super_admin grants a user partner status with a custom commission_rate.
-- Customers self-buy via the partner's link (?p=CODE); first-touch attribution
-- (shared/mutual-exclusive with affiliate) tags each customer to exactly ONE
-- referrer. Platform collects the money; partner only sees their own numbers.

-- 1) Partner accounts (super_admin-granted) -------------------------------------
create table if not exists public.partners (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  code            text not null unique,            -- referral code used in /?p=CODE
  name            text,
  commission_rate numeric not null default 0.20 check (commission_rate >= 0 and commission_rate <= 1),
  status          text not null default 'active' check (status in ('active', 'suspended')),
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists partners_code_idx on public.partners(code);

-- 2) Single-owner attribution on the customer (affiliate XOR partner) ----------
-- referrer_type/id is the source of truth for "who owns this customer".
-- Set ONCE on first touch and never overwritten → "đến trước thì bên đó ăn".
alter table public.profiles add column if not exists referrer_type text
  check (referrer_type in ('affiliate', 'partner'));
alter table public.profiles add column if not exists referrer_id uuid;
create index if not exists profiles_referrer_idx on public.profiles(referrer_type, referrer_id);

-- 3) One commission row per successful payment from a partner's customer -------
create table if not exists public.partner_commissions (
  id                uuid primary key default gen_random_uuid(),
  partner_id        uuid not null references public.partners(id) on delete cascade,
  customer_user_id  uuid not null references auth.users(id) on delete cascade,
  source            text not null check (source in ('stripe', 'vietqr')),
  sale_amount       numeric not null default 0,
  currency          text not null default 'USD',
  rate              numeric not null,              -- snapshot of commission_rate at sale time
  commission_amount numeric not null default 0,
  period            text not null,                 -- 'YYYY-MM' for monthly reconciliation
  status            text not null default 'pending' check (status in ('pending', 'paid')),
  external_ref      text,                          -- stripe invoice id / vietqr ref (idempotency)
  created_at        timestamptz not null default now(),
  paid_at           timestamptz
);
create index if not exists partner_commissions_partner_period_idx
  on public.partner_commissions(partner_id, period);
-- Idempotency: a given payment (invoice) can only create one commission row.
create unique index if not exists partner_commissions_external_idx
  on public.partner_commissions(source, external_ref) where external_ref is not null;

-- 4) RLS ------------------------------------------------------------------------
-- Partners may read ONLY their own partner row and their own commissions.
-- All writes + the "my customers" listing go through service-role APIs that
-- scope by partner_id (service role bypasses RLS).
alter table public.partners enable row level security;
alter table public.partner_commissions enable row level security;

drop policy if exists "Partner reads own row" on public.partners;
create policy "Partner reads own row" on public.partners
  for select using (auth.uid() = user_id);

drop policy if exists "Partner reads own commissions" on public.partner_commissions;
create policy "Partner reads own commissions" on public.partner_commissions
  for select using (
    partner_id in (select id from public.partners where user_id = auth.uid())
  );

notify pgrst, 'reload schema';
