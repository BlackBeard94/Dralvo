-- Vault storefront (public /kho) — sell vault EAs one-off via Cryptomus.
--
-- Model: guest checkout. The buyer only gives an e-mail, pays once and keeps
-- the files forever — no license key is issued for these EAs (they are not
-- Dralvo-built, so the Dralvo license server is not involved). Entitlement is
-- proven by an unguessable download_token minted when the payment webhook
-- confirms, then e-mailed to the buyer.

alter table public.vault_eas
  add column if not exists price_usd numeric(10,2) not null default 199,
  add column if not exists for_sale  boolean       not null default true;

create table if not exists public.vault_orders (
  id                uuid primary key default gen_random_uuid(),
  ea_id             uuid not null references public.vault_eas(id) on delete restrict,
  email             text not null,
  amount_usd        numeric(10,2) not null,
  currency          text not null default 'USD',
  -- pending → paid | failed | expired
  status            text not null default 'pending',
  provider          text not null default 'cryptomus',
  provider_order_id text not null unique,   -- our id, sent to Cryptomus as order_id
  provider_uuid     text,                   -- Cryptomus payment uuid
  download_token    text unique,            -- minted on payment, used by /api/store/download
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists vault_orders_email_idx  on public.vault_orders(email);
create index if not exists vault_orders_status_idx on public.vault_orders(status);
create index if not exists vault_orders_ea_idx     on public.vault_orders(ea_id);

-- Service-role only: checkout, webhook and download all run server-side.
-- No anon/authenticated policies on purpose (an order row is an entitlement).
alter table public.vault_orders enable row level security;
