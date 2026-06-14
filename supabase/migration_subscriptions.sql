-- Migration: Update subscriptions table for Stripe integration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Add plan_tier column (code uses plan_tier, not plan)
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'Free';

-- 2. Add current_period_end for Stripe subscription tracking
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- 3. Add unique constraint on user_id for upsert operations
-- (webhook handler uses upsert with onConflict: 'user_id')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_user_id_key' 
    AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 4. Add unique constraint on stripe_subscription_id for webhook lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_stripe_subscription_id_key' 
    AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;
END $$;

-- 5. Add index on stripe_customer_id for portal lookups
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx 
ON public.subscriptions (stripe_customer_id);

-- 6. Add index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx 
ON public.subscriptions (user_id);
