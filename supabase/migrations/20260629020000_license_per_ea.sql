-- Per-EA license keys.
-- Trước: mỗi user 1 key (UNIQUE(user_id)), validate không phân biệt EA → 1 key mở cả 3 EA.
-- Sau:  mỗi key gắn 1 EA (product); 1 user có tối đa 1 key / mỗi product.

alter table public.license_keys add column if not exists product text;

-- Backfill key cũ:
--   tigold-free (IB)          → product 'tigold'
--   unlimited (VIP) legacy    → product 'goldmaster' (đại diện).
-- Nếu có user VIP cũ cần đủ 3 EA, sau khi chạy migration hãy tạo thêm 2 row
-- goldscalp/tigold cho từng user đó (plan='unlimited', cùng expires_at, max_accounts 2/1).
update public.license_keys set product = 'tigold'     where plan = 'tigold'    and product is null;
update public.license_keys set product = 'goldmaster' where plan = 'unlimited' and product is null;

alter table public.license_keys
  drop constraint if exists license_keys_product_chk;
alter table public.license_keys
  add constraint license_keys_product_chk check (product in ('goldmaster', 'goldscalp', 'tigold'));

-- 1-key-mỗi-user  →  1-key-mỗi-(user, product)
drop index if exists license_keys_user_id_idx;
create unique index if not exists license_keys_user_product_idx
  on public.license_keys(user_id, product);

-- IB verify upsert onConflict mt5_account cần unique. Null không xung đột nhau trong Postgres,
-- nên dùng partial index để các key unlimited (mt5_account null) không bị ràng buộc.
create unique index if not exists license_keys_mt5_account_idx
  on public.license_keys(mt5_account) where mt5_account is not null;
