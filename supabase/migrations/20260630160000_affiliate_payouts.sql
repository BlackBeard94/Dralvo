-- Affiliate payout requests: affiliates request a withdrawal once their
-- pending commissions reach the min_payout threshold. Admins review and mark
-- paid (which settles the affiliate's pending commissions → paid).

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id  uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount        real NOT NULL,                  -- snapshot of available balance at request time
  status        text NOT NULL DEFAULT 'requested'
                  CHECK (status IN ('requested', 'approved', 'paid', 'rejected')),
  method        text,                           -- optional payout method note (bank, etc.)
  note          text,                           -- admin note / rejection reason
  requested_at  timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz,
  processed_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS affiliate_payouts_affiliate_id_idx ON public.affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_payouts_status_idx ON public.affiliate_payouts(status);

-- At most one open (requested/approved) payout per affiliate at a time.
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_payouts_one_open_idx
  ON public.affiliate_payouts(affiliate_id)
  WHERE status IN ('requested', 'approved');
