-- Paste vào Supabase SQL Editor, chạy 1 lần
-- Sau đó INSERT super_admin bằng tay

-- 1. Tạo bảng
CREATE TABLE IF NOT EXISTS public.admin_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support')),
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_users_user_id_idx ON public.admin_users(user_id);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.vps_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip          text NOT NULL,
  username    text NOT NULL DEFAULT 'Administrator',
  password    text NOT NULL,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
  notes       text,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vps_assignments_user_id_idx ON public.vps_assignments(user_id);
CREATE INDEX IF NOT EXISTS vps_assignments_status_idx ON public.vps_assignments(status);
ALTER TABLE public.vps_assignments ENABLE ROW LEVEL SECURITY;
