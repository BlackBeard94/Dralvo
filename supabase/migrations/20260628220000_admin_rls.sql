-- Admin auth fix: add RLS policy so admin users can read their own row
-- without depending solely on service_role key.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_users'
      AND policyname = 'Admin users can read their own row'
  ) THEN
    CREATE POLICY "Admin users can read their own row"
      ON public.admin_users
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- Also allow admin users to read other admin_users (needed for super_admin listing sub-admins)
-- via service role — already handled. No UPDATE/INSERT/DELETE policy for authenticated.
