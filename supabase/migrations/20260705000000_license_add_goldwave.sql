-- Add the GoldWave EA to the allowed license products so VIP purchases can
-- provision a goldwave key (VIP_PRODUCTS) and admins can grant it.
alter table public.license_keys
  drop constraint if exists license_keys_product_chk;
alter table public.license_keys
  add constraint license_keys_product_chk
  check (product in ('goldmaster', 'goldscalp', 'tigold', 'goldwave'));

notify pgrst, 'reload schema';
