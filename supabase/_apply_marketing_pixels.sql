-- ===== Dralvo: marketing tracking — apply 2 migrations =====
-- An toàn chạy lại nhiều lần (dùng IF NOT EXISTS / DROP POLICY IF EXISTS).

-- ----- 1) marketing_attribution -----
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

-- ----- 2) tracking_settings -----
-- Pixel / tracking-code settings, editable from the UI (no redeploy).
-- Two scopes:
--   * 'dralvo'  — the platform's own pixels (super_admin only). May also carry
--                 raw custom head/body snippets (first-party, super-admin authored).
--   * 'partner' — a reseller's OWN pixel ids, so their referred traffic fires
--                 their ad accounts. Partners may set IDS ONLY — never raw code
--                 (enforced in the API): a partner's raw <script> would run on
--                 dralvo.com for their referred visitors, an XSS vector.
--
-- Pixel ids are validated against strict allowlist regexes before they are ever
-- inlined into a pixel <script>, so a stored value cannot break out of the JS
-- string context. See src/lib/marketing/tracking-settings.ts.

create table if not exists public.tracking_settings (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null check (scope in ('dralvo', 'partner')),
  partner_id  uuid references public.partners(id) on delete cascade,

  ga4_id                    text,
  google_ads_id             text,
  google_ads_purchase_label text,
  meta_pixel_id             text,
  tiktok_pixel_id           text,

  -- Raw snippets — Dralvo scope only (API rejects them for partners).
  custom_head text,
  custom_body text,

  enabled     boolean not null default true,
  updated_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),

  -- A partner row must name its partner; a dralvo row must not.
  constraint tracking_settings_scope_partner check (
    (scope = 'partner' and partner_id is not null) or
    (scope = 'dralvo'  and partner_id is null)
  )
);

-- Exactly one row per owner.
create unique index if not exists tracking_settings_dralvo_uniq
  on public.tracking_settings(scope) where scope = 'dralvo';
create unique index if not exists tracking_settings_partner_uniq
  on public.tracking_settings(partner_id) where scope = 'partner';

-- RLS: a partner may READ their own settings row. All writes go through
-- service-role APIs (admin + partner endpoints), which bypass RLS.
alter table public.tracking_settings enable row level security;

drop policy if exists "Partner reads own tracking settings" on public.tracking_settings;
create policy "Partner reads own tracking settings" on public.tracking_settings
  for select using (
    scope = 'partner'
    and partner_id in (select id from public.partners where user_id = auth.uid())
  );
