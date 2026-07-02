-- EA Vault ("Kho EA") — admin-managed list of EAs shown on the VIP dashboard.
-- Each EA's file lives either in the legacy public folder (public_path) or in
-- the private Supabase Storage bucket 'ea-files' (storage_path, set on upload).
-- `enabled` controls visibility on the dashboard.

create table if not exists public.vault_eas (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  version      text,
  description  text,
  file_name    text,                 -- display / download filename
  public_path  text,                 -- legacy: /downloads/kho/<file>
  storage_path text,                 -- new uploads: object key in 'ea-files' bucket
  enabled      boolean not null default true,
  sort_order   int not null default 0,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists vault_eas_enabled_sort_idx on public.vault_eas(enabled, sort_order);
-- Unique name so re-running the seed (on conflict do nothing) can't duplicate.
create unique index if not exists vault_eas_name_idx on public.vault_eas(name);

-- RLS: reads go through service-role APIs (dashboard gate = VIP, admin gate =
-- super_admin). No direct anon/auth access.
alter table public.vault_eas enable row level security;

-- Seed the 12 existing EAs (legacy public files), keep current order.
insert into public.vault_eas (name, file_name, public_path, sort_order) values
  ('BB Return',            'BB Return MT5.ex5',                '/downloads/kho/BB Return MT5.ex5',                1),
  ('Osmosis',              'Osmosis 1.3_ MT5.ex5',             '/downloads/kho/Osmosis 1.3_ MT5.ex5',            2),
  ('Perceptrader AI',      'Perceptrader AI MT5 v2.43.ex5',    '/downloads/kho/Perceptrader AI MT5 v2.43.ex5',   3),
  ('Quantum Athena',       'Quantum Athena_1.1_MT5.ex5',       '/downloads/kho/Quantum Athena_1.1_MT5.ex5',      4),
  ('Quantum Gold Emperor', 'Quantum Gold Emperor MT5 v1.2.ex5','/downloads/kho/Quantum Gold Emperor MT5 v1.2.ex5',5),
  ('Quantum King EA',      'Quantum King EA_3.1_MT5.ex5',      '/downloads/kho/Quantum King EA_3.1_MT5.ex5',     6),
  ('Quantum Queen',        'Quantum Queen v2.1_MT5.ex5',       '/downloads/kho/Quantum Queen v2.1_MT5.ex5',      7),
  ('Scalping Robot Pro',   'Scalping Robot Pro MT5_2.0.ex5',   '/downloads/kho/Scalping Robot Pro MT5_2.0.ex5',  8),
  ('Sharkyra Gold',        'Sharkyra Gold v1.1_MT5.ex5',       '/downloads/kho/Sharkyra Gold v1.1_MT5.ex5',      9),
  ('The Gold Reaper',      'The Gold Reaper MT5 v4.3.ex5',     '/downloads/kho/The Gold Reaper MT5 v4.3.ex5',    10),
  ('TwisterPro Scalper',   'TwisterPro Scalper v1.8_MT5.ex5',  '/downloads/kho/TwisterPro Scalper v1.8_MT5.ex5', 11),
  ('Wave Rider EA',        'Wave Rider EA MT5_4.1.ex5',        '/downloads/kho/Wave Rider EA MT5_4.1.ex5',       12)
on conflict do nothing;

notify pgrst, 'reload schema';
