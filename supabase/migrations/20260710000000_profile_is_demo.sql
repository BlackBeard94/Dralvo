-- Admin-only manual "Demo/trial" marker on a user (purely a label — does NOT
-- affect access or entitlements). Shown as a green badge in the Users table.
alter table public.profiles add column if not exists is_demo boolean not null default false;

notify pgrst, 'reload schema';
