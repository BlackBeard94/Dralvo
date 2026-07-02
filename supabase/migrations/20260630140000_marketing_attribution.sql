-- Marketing (paid-ads) attribution — separate from affiliate/partner referral.
-- Captures the ad touch (UTM + click-ids) for each authenticated user so the
-- Stripe webhook can fire accurate SERVER-SIDE conversions (Meta CAPI, GA4
-- Measurement Protocol, TikTok Events API) keyed back to the campaign.
--
-- Touch policy: LAST paid touch wins for click-ids (gclid/fbclid/ttclid stay
-- fresh for the conversion APIs), but first_seen_at / first-touch UTM are
-- preserved. This is intentionally the opposite of the affiliate/partner
-- "first-touch wins" rule, because direct-response ad ROAS attributes to the
-- click that actually drove the conversion.

create table if not exists public.marketing_attribution (
  user_id      uuid primary key references auth.users(id) on delete cascade,

  -- Campaign labels (last-touch values shown to marketing).
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_content  text,
  utm_term     text,

  -- Paid-click identifiers consumed by the platform conversion APIs.
  gclid        text,                 -- Google Ads
  fbclid       text,                 -- Meta (raw); fbc below is the pixel-formatted cookie
  ttclid       text,                 -- TikTok
  fbp          text,                 -- Meta browser id cookie (_fbp)
  fbc          text,                 -- Meta click cookie (_fbc, derived from fbclid)

  -- Context for debugging / multi-touch later.
  landing_url  text,
  referrer     text,

  first_seen_at timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists marketing_attribution_campaign_idx
  on public.marketing_attribution(utm_source, utm_campaign);

-- RLS: a user may read ONLY their own attribution row. All writes go through
-- service-role APIs (claim endpoint + Stripe webhook), which bypass RLS.
alter table public.marketing_attribution enable row level security;

drop policy if exists "User reads own attribution" on public.marketing_attribution;
create policy "User reads own attribution" on public.marketing_attribution
  for select using (auth.uid() = user_id);
