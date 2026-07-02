-- Fix: license_keys / license_devices thiếu cột trên DB remote.
-- Nguyên nhân: các migration license chưa được apply lên Supabase.
-- An toàn chạy lại nhiều lần (idempotent). Chạy trong Supabase SQL Editor.

-- 1) Đảm bảo đủ cột trên license_keys
alter table public.license_keys add column if not exists is_lifetime  boolean not null default false;
alter table public.license_keys add column if not exists max_accounts int     not null default 2;
alter table public.license_keys add column if not exists managed_by   uuid references auth.users(id);
alter table public.license_keys add column if not exists product      text;

-- 2) Backfill product cho key cũ (theo plan)
update public.license_keys set product = 'tigold'     where plan = 'tigold'    and product is null;
update public.license_keys set product = 'goldmaster' where plan = 'unlimited' and product is null;

-- 3) Ràng buộc product
alter table public.license_keys drop constraint if exists license_keys_product_chk;
alter table public.license_keys
  add constraint license_keys_product_chk check (product in ('goldmaster', 'goldscalp', 'tigold'));

-- 4) 1 key / (user, product)  (thay cho unique cũ chỉ trên user_id)
drop index if exists license_keys_user_id_idx;
create unique index if not exists license_keys_user_product_idx on public.license_keys(user_id, product);
create unique index if not exists license_keys_mt5_account_idx  on public.license_keys(mt5_account) where mt5_account is not null;

-- 5) Backfill lifetime cho key null-expiry cũ
update public.license_keys set is_lifetime = true where expires_at is null and is_lifetime = false;

-- 6) Bảng license_devices (anti-share)
create table if not exists public.license_devices (
  id          uuid primary key default gen_random_uuid(),
  license_id  uuid not null references public.license_keys(id) on delete cascade,
  mt5_account text not null,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  unique (license_id, mt5_account)
);
create index if not exists license_devices_license_id_idx on public.license_devices(license_id);
alter table public.license_devices enable row level security;

-- 7) Nạp lại schema cache của PostgREST (hết lỗi "schema cache")
notify pgrst, 'reload schema';
