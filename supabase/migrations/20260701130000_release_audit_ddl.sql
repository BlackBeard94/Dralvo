-- Release-audit DDL fixes (2026-07-01).
-- ⚠️ `supabase db push` bị drift (mục HANDOFF §6) → chạy file này qua Supabase
-- SQL Editor. Toàn bộ idempotent (drop/create if [not] exists) nên chạy lại an toàn.

------------------------------------------------------------------------------
-- H1 — Paywall leak: siết RLS trên dữ liệu phân tích trả phí.
-- Trước: policy `using (auth.role() = 'authenticated')` cho MỌI user đăng nhập
-- đọc thẳng qua PostgREST → free user lấy trọn evidence + thesis (bypass paywall).
-- Sau: chỉ user PAID (sub active/trialing HOẶC key unlimited còn hạn/lifetime).
-- (API app dùng service-role nên vẫn phục vụ bình thường — service-role bỏ qua RLS.)
------------------------------------------------------------------------------
create or replace function public.dralvo_is_paid_user()
returns boolean
language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.subscriptions s
            where s.user_id = auth.uid() and s.status in ('active','trialing'))
    or exists (select 1 from public.license_keys k
               where k.user_id = auth.uid() and k.plan = 'unlimited'
                 and (k.is_lifetime = true
                      or (k.expires_at is not null and k.expires_at > now())));
$$;

-- Drop BOTH the old (pre-fix) and new policy names so re-running after a partial
-- apply can't collide (42710: policy already exists).
drop policy if exists "Authenticated users can read evidence observations" on public.evidence_observations;
drop policy if exists "Paid users can read evidence observations" on public.evidence_observations;
create policy "Paid users can read evidence observations"
  on public.evidence_observations for select
  using (public.dralvo_is_paid_user());

drop policy if exists "Authenticated users can read thesis snapshots" on public.thesis_snapshots;
drop policy if exists "Paid users can read thesis snapshots" on public.thesis_snapshots;
create policy "Paid users can read thesis snapshots"
  on public.thesis_snapshots for select
  using (public.dralvo_is_paid_user());

drop policy if exists "Authenticated users can read evidence corrections" on public.evidence_corrections;
drop policy if exists "Paid users can read evidence corrections" on public.evidence_corrections;
create policy "Paid users can read evidence corrections"
  on public.evidence_corrections for select
  using (public.dralvo_is_paid_user());

------------------------------------------------------------------------------
-- B2b — dọn dẹp: đổi PARTIAL unique index trên mt5_account thành UNIQUE thường,
-- để upsert onConflict("mt5_account") dùng được (không còn 42P10). Code ib/verify
-- hiện đã workaround bằng select-then-insert, đây là dọn cho tương lai.
-- NULL vẫn không xung đột nhau trong Postgres nên key unlimited (mt5_account null) OK.
------------------------------------------------------------------------------
drop index if exists public.license_keys_mt5_account_idx;
create unique index if not exists license_keys_mt5_account_key
  on public.license_keys(mt5_account);

------------------------------------------------------------------------------
-- H4-full — idempotency toàn event cho Stripe webhook (chống xử lý lại email /
-- marketing conversion / admin event khi Stripe redeliver). Money path đã được
-- chặn ở code (idempotency key per-invoice), bảng này bọc các side-effect còn lại.
------------------------------------------------------------------------------
create table if not exists public.stripe_events (
  event_id    text primary key,
  type        text,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
-- Không policy → chỉ service-role (webhook) đọc/ghi.
