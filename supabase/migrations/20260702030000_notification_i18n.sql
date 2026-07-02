-- Multi-language system notifications. title/body stay as the base (fallback);
-- title_i18n / body_i18n hold per-locale overrides as { "<locale>": "<text>" }
-- e.g. {"en":"Welcome","vi":"Chào mừng"}. The dashboard resolves to the viewer's
-- locale and falls back to title/body when a locale isn't translated.
alter table public.system_notifications
  add column if not exists title_i18n jsonb not null default '{}'::jsonb,
  add column if not exists body_i18n  jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
