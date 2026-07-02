-- Notification settings: super_admin toggles which notification TYPES the site sends.
-- Writes go through the service-role admin client (bypasses RLS); no public policies.
-- Recovered 2026-07-01 from supabase_migrations.schema_migrations (file was lost
-- locally; this is the exact SQL applied to prod).
CREATE TABLE IF NOT EXISTS public.notification_settings (
  key         text PRIMARY KEY,
  label       text NOT NULL,
  enabled     boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Seed the real notification types the site sends today.
-- signal_alert    -> indicator/alert triggers (alerts, alert_notifications)
-- thesis_update   -> gold thesis state changes (thesis:* alert targets)
-- license_billing -> license keys / SePay VietQR billing events
-- affiliate       -> affiliate system events (commissions, referrals)
-- system          -> admin broadcast / system announcements
INSERT INTO public.notification_settings (key, label, enabled) VALUES
  ('signal_alert',    'Cảnh báo tín hiệu',        true),
  ('thesis_update',   'Cập nhật luận điểm vàng',  true),
  ('license_billing', 'Giấy phép & thanh toán',   true),
  ('affiliate',       'Tiếp thị liên kết',        true),
  ('system',          'Thông báo hệ thống',        true)
ON CONFLICT (key) DO NOTHING;
