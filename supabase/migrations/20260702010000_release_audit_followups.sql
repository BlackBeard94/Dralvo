-- Release-audit follow-ups (2026-07-02). Idempotent — safe to re-run.
-- Run via Supabase SQL Editor (db push is drifted).

------------------------------------------------------------------------------
-- A — Real revenue on subscriptions. Store the actual paid price so Overview
-- (and any revenue read) stops using a flat $59 proxy. Populated at checkout by
-- upsertProSubscriptionFromCheckoutSession; backfill existing rows from Stripe.
------------------------------------------------------------------------------
alter table public.subscriptions add column if not exists amount_usd numeric;

------------------------------------------------------------------------------
-- D — Money precision + atomic accrual for affiliate commissions.
-- 1) real (float4) → numeric(12,2) to stop rounding drift (partner side already
--    uses numeric). 2) an atomic increment RPC so concurrent invoices can't
--    clobber total_earned via read-modify-write from app code.
------------------------------------------------------------------------------
alter table public.affiliate_commissions
  alter column amount        type numeric(12,2) using round(amount::numeric, 2),
  alter column source_amount type numeric(12,2) using round(source_amount::numeric, 2);

alter table public.affiliates
  alter column total_earned type numeric(12,2) using round(total_earned::numeric, 2),
  alter column paid_out     type numeric(12,2) using round(paid_out::numeric, 2);

-- Atomic accrual: total_earned += delta (delta may be negative for reversals).
create or replace function public.increment_affiliate_earned(p_affiliate_id uuid, p_delta numeric)
returns void language sql security definer set search_path = public as $$
  update public.affiliates
     set total_earned = round((coalesce(total_earned, 0) + p_delta)::numeric, 2)
   where id = p_affiliate_id;
$$;

notify pgrst, 'reload schema';
