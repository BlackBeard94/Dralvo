-- Separate lifetime comps from time-limited (rental) licenses.
-- Rental licenses (Stripe / VietQR purchases) must always carry a concrete
-- expires_at; only explicit admin-granted comps may have a null expiry, and
-- those are marked is_lifetime = true.
alter table public.license_keys
  add column if not exists is_lifetime boolean not null default false;

-- Backfill: existing null-expiry rows were treated as lifetime by the old app
-- logic. Grandfather them so no currently-working access is revoked on deploy.
-- (Pre-launch: if you instead want to convert these into time-limited rentals,
--  set a concrete expires_at for them rather than running this UPDATE.)
update public.license_keys
  set is_lifetime = true
  where expires_at is null;
