-- ponytail: one table, super_admin posts, all admins read
-- Recovered 2026-07-01 from supabase_migrations.schema_migrations (file was lost
-- locally; this is the exact SQL applied to prod).
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message     text NOT NULL,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
