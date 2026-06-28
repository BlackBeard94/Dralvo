-- Affiliate system: partners earn recurring commission on referrals
-- All configurable parameters live in affiliate_settings (editable via admin panel)

-- Configurable settings (admin panel can edit these at runtime)
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
  id          integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row
  commission_rate     real NOT NULL DEFAULT 0.30,          -- 30% recurring
  cookie_days         integer NOT NULL DEFAULT 30,         -- referral cookie lifetime
  min_payout          integer NOT NULL DEFAULT 50,         -- minimum $ to request payout
  program_active      boolean NOT NULL DEFAULT true,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Seed default settings
INSERT INTO public.affiliate_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Affiliate partners (users who signed up as affiliates)
CREATE TABLE IF NOT EXISTS public.affiliates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code        text NOT NULL UNIQUE,                -- unique referral code (url-safe)
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  display_name text,                               -- optional display name
  total_earned real NOT NULL DEFAULT 0,            -- lifetime earnings
  paid_out    real NOT NULL DEFAULT 0,             -- total paid out
  created_at  timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);

CREATE INDEX IF NOT EXISTS affiliates_code_idx ON public.affiliates(code);
CREATE INDEX IF NOT EXISTS affiliates_status_idx ON public.affiliates(status);

-- Referral tracking: every click with ?ref=CODE
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  visitor_id  text NOT NULL,                       -- cookie-based anonymous id
  ip          text,
  user_agent  text,
  landing_page text,
  clicked_at  timestamptz NOT NULL DEFAULT now(),
  converted   boolean NOT NULL DEFAULT false,      -- did they sign up?
  converted_at timestamptz,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS affiliate_referrals_affiliate_id_idx ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_referrals_visitor_id_idx ON public.affiliate_referrals(visitor_id);

-- Commissions earned from successful payments
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id    uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id     uuid REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
  customer_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id text,                            -- Stripe subscription ID
  amount          real NOT NULL,                   -- commission amount in USD
  source_amount   real,                            -- original payment amount
  period_start    timestamptz,                     -- subscription period this covers
  period_end      timestamptz,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  paid_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_commissions_affiliate_id_idx ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_commissions_status_idx ON public.affiliate_commissions(status);
