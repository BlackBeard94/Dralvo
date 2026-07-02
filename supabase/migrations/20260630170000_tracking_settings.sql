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
