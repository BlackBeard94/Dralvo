create table if not exists public.user_ai_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check (provider in ('openai', 'gemini', 'deepseek')),
  encrypted_api_key text not null,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_ai_credentials enable row level security;

drop policy if exists "Users can read own AI credentials" on public.user_ai_credentials;
create policy "Users can read own AI credentials"
  on public.user_ai_credentials for select
  using (auth.uid() = user_id);

drop policy if exists "Users can manage own AI credentials" on public.user_ai_credentials;
create policy "Users can manage own AI credentials"
  on public.user_ai_credentials for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
