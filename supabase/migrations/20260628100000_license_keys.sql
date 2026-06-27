-- ponytail: one table, plan discriminates free/unlimited
CREATE TABLE IF NOT EXISTS public.license_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan        text NOT NULL CHECK (plan IN ('tigold', 'unlimited')),
  mt5_account text,                           -- required for tigold, null for unlimited
  key         uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at  timestamptz,                    -- null = tigold (never expires)
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS license_keys_user_id_idx ON public.license_keys(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS license_keys_key_idx ON public.license_keys(key);
