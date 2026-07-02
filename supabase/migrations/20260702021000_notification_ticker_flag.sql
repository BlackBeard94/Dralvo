-- Let admins choose whether a system notification also scrolls in the dashboard
-- ticker (the marquee bar). Default true = keep existing broadcast behavior;
-- auto per-user notifications (welcome / VIP / commission via notifyUser) set
-- this to false so they stay in the bell/inbox only and don't clutter the ticker.
alter table public.system_notifications
  add column if not exists show_in_ticker boolean not null default true;

notify pgrst, 'reload schema';
