-- System (broadcast/targeted) notifications shown in the dashboard bell,
-- merged with per-user alert notifications. Admins push these; read state is
-- tracked per user via the reads table so a broadcast can be read individually.
create table if not exists public.system_notifications (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  level       text not null default 'info' check (level in ('info', 'success', 'warning', 'promo')),
  href        text,
  -- who sees it: everyone, only VIP, only Free, or a single targeted user.
  audience    text not null default 'all' check (audience in ('all', 'vip', 'free', 'user')),
  user_id     uuid references auth.users(id) on delete cascade,  -- required when audience = 'user'
  starts_at   timestamptz not null default now(),
  expires_at  timestamptz,                                       -- null = never expires
  created_at  timestamptz not null default now()
);

create index if not exists system_notifications_audience_idx on public.system_notifications(audience);
create index if not exists system_notifications_user_idx on public.system_notifications(user_id);
create index if not exists system_notifications_created_idx on public.system_notifications(created_at desc);

create table if not exists public.system_notification_reads (
  notification_id uuid not null references public.system_notifications(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (notification_id, user_id)
);

-- Service-role only (read/write via the admin client). No policies → blocked
-- for anon/authenticated, like the other admin-served tables.
alter table public.system_notifications enable row level security;
alter table public.system_notification_reads enable row level security;

-- Seed one welcome broadcast so the bell has content immediately.
insert into public.system_notifications (title, body, level, audience)
values (
  'Chào mừng đến Dralvo',
  'Cảm ơn bạn đã sử dụng Dralvo. Thông báo từ hệ thống sẽ xuất hiện ở đây.',
  'success',
  'all'
);
