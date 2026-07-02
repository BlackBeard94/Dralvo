-- Saved ad-campaign links (UTM builder output). Generated in the admin panel so
-- the team has a shared, reusable library of tracking links instead of hand-
-- crafting UTMs per campaign. A link may also carry a partner referral code
-- (?p=CODE) so a partner's ad traffic is both pixel-attributed and commissioned.

create table if not exists public.campaign_links (
  id           uuid primary key default gen_random_uuid(),
  label        text,
  base_path    text not null default '/',     -- on-site path, must start with '/'
  utm_source   text not null,
  utm_medium   text,
  utm_campaign text,
  utm_content  text,
  utm_term     text,
  partner_id   uuid references public.partners(id) on delete set null,
  full_url     text not null,                  -- precomputed canonical link for copy
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

create index if not exists campaign_links_partner_idx on public.campaign_links(partner_id);
create index if not exists campaign_links_created_idx on public.campaign_links(created_at desc);

-- RLS: a partner may read links tagged to them (future partner-portal builder).
-- All writes + the full admin list go through service-role APIs (bypass RLS).
alter table public.campaign_links enable row level security;

drop policy if exists "Partner reads own campaign links" on public.campaign_links;
create policy "Partner reads own campaign links" on public.campaign_links
  for select using (
    partner_id in (select id from public.partners where user_id = auth.uid())
  );
