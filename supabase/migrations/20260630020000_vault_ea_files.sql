-- Extra per-EA downloads: "set file" (MT5 .set preset) and install guide.
-- Stored in the same private 'ea-files' bucket. Dashboard buttons activate
-- automatically once a file is uploaded via admin Kho EA.
alter table public.vault_eas add column if not exists set_storage_path  text;
alter table public.vault_eas add column if not exists set_file_name     text;
alter table public.vault_eas add column if not exists guide_storage_path text;
alter table public.vault_eas add column if not exists guide_file_name    text;

notify pgrst, 'reload schema';
