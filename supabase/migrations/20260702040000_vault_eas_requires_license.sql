-- Some vault EAs (e.g. the free third-party bundle) should be downloadable by
-- any logged-in user without a paid VIP license. Existing rows default to
-- true so current VIP-gated behavior is unchanged.
alter table public.vault_eas
  add column if not exists requires_license boolean not null default true;

notify pgrst, 'reload schema';
