-- ponytail: one column, tracks which admin manages this license
-- null = super_admin managed (or pre-branch legacy). sub-admins
-- only see users where managed_by = their own user_id.
ALTER TABLE public.license_keys
  ADD COLUMN IF NOT EXISTS managed_by uuid REFERENCES auth.users(id);
