-- Baseline for `subscriptions` and `profiles`.
-- These two tables were built manually via the SQL Editor and never captured as
-- migrations, so a fresh rebuild (staging / DR / `supabase db reset`) was missing
-- them → webhook + profile reads would 500. This file reconstructs them from the
-- live schema (2026-07-01). Dated before every other migration so ALTERs that
-- follow apply cleanly. Idempotent — safe on the existing prod DB (no-op there).

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free'::text,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'inactive'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  plan_tier text NOT NULL DEFAULT 'Free'::text,
  current_period_end timestamp with time zone,
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id),
  CONSTRAINT subscriptions_user_id_key UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions USING btree (user_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can read their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  plan text NOT NULL DEFAULT 'free'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  telegram_chat_id text,
  notification_prefs jsonb NOT NULL DEFAULT '{"email": true, "in_app": true, "telegram": false}'::jsonb,
  referrer_type text,
  referrer_id uuid,
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT profiles_referrer_type_check CHECK (referrer_type = ANY (ARRAY['affiliate'::text, 'partner'::text]))
);
CREATE INDEX IF NOT EXISTS profiles_referrer_idx ON public.profiles USING btree (referrer_type, referrer_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);
