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
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'expired', 'canceled')),
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
