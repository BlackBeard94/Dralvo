-- Affiliate commissions become recurring (lifetime): a commission is created on
-- EVERY paid invoice (first payment + renewals), not just the first. Idempotency
-- moves from "one per referral" to "one per Stripe invoice" via external_ref.
alter table public.affiliate_commissions add column if not exists external_ref text;

-- A given payment (Stripe invoice) can create at most one commission row.
create unique index if not exists affiliate_commissions_external_ref_idx
  on public.affiliate_commissions(external_ref) where external_ref is not null;

notify pgrst, 'reload schema';
