create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  plan text not null default 'free',
  telegram_chat_id text,
  notification_prefs jsonb not null default '{"email":true,"telegram":false,"in_app":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);

create table if not exists public.indicator_snapshots (
  id uuid primary key default gen_random_uuid(),
  indicator_key text not null,
  value_json jsonb not null,
  observed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists indicator_snapshots_key_observed_idx
  on public.indicator_snapshots (indicator_key, observed_at desc);

create unique index if not exists indicator_snapshots_key_observed_unique_idx
  on public.indicator_snapshots (indicator_key, observed_at);

create table if not exists public.evidence_observations (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  driver_key text not null,
  series_key text not null,
  numeric_value double precision not null,
  unit text not null,
  observed_at timestamptz not null,
  released_at timestamptz,
  retrieved_at timestamptz not null default now(),
  source_url text not null,
  quality text not null check (quality in ('verified', 'delayed', 'estimated')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists evidence_observations_source_series_observed_unique_idx
  on public.evidence_observations (source_key, series_key, observed_at);

create index if not exists evidence_observations_driver_series_observed_idx
  on public.evidence_observations (driver_key, series_key, observed_at desc);

create table if not exists public.evidence_corrections (
  id uuid primary key default gen_random_uuid(),
  evidence_observation_id uuid not null references public.evidence_observations(id) on delete cascade,
  source_key text not null,
  driver_key text not null,
  series_key text not null,
  observed_at timestamptz not null,
  previous_numeric_value double precision not null,
  corrected_numeric_value double precision not null,
  unit text not null,
  correction_reason text not null,
  correction_source_url text,
  correction_metadata jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  applied_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists evidence_corrections_observation_idx
  on public.evidence_corrections (evidence_observation_id, created_at desc);

create index if not exists evidence_corrections_driver_observed_idx
  on public.evidence_corrections (driver_key, series_key, observed_at desc);

create table if not exists public.thesis_snapshots (
  id uuid primary key default gen_random_uuid(),
  thesis_date date not null unique,
  state text not null check (
    state in ('supportive', 'mixed', 'adverse', 'insufficient_data')
  ),
  thesis_json jsonb not null,
  methodology_version text not null,
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists thesis_snapshots_generated_idx
  on public.thesis_snapshots (generated_at desc);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  indicator_key text not null,
  condition_json jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists alerts_user_active_idx
  on public.alerts (user_id, active);

create table if not exists public.alert_notifications (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  indicator_key text not null,
  indicator_name text,
  condition_json jsonb not null,
  condition_text text,
  triggered_value text not null,
  triggered_at timestamptz not null default now(),
  read boolean not null default false,
  channels_sent jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists alert_notifications_user_created_idx
  on public.alert_notifications (user_id, created_at desc);

create index if not exists alert_notifications_alert_created_idx
  on public.alert_notifications (alert_id, created_at desc);

create table if not exists public.alert_trigger_state (
  alert_id uuid primary key references public.alerts(id) on delete cascade,
  indicator_key text,
  last_triggered_value double precision,
  last_observed_value double precision,
  last_triggered_at timestamptz not null default now(),
  last_value text,
  is_triggered boolean not null default false
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'free',
  plan_tier text not null default 'Free',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

create table if not exists public.vietqr_payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null unique,
  amount_vnd integer not null,
  bank_bin text not null,
  account_no text not null,
  account_name text not null,
  add_info text not null,
  qr_data_url text,
  qr_code text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'expired', 'canceled')),
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  provider text,
  provider_transaction_id bigint,
  provider_reference_code text,
  provider_transaction_at timestamptz,
  provider_payload jsonb,
  expires_at timestamptz not null default (now() + interval '48 hours'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vietqr_payment_requests_user_created_idx
  on public.vietqr_payment_requests (user_id, created_at desc);

create index if not exists vietqr_payment_requests_status_created_idx
  on public.vietqr_payment_requests (status, created_at desc);

create unique index if not exists vietqr_payment_requests_provider_transaction_uidx
  on public.vietqr_payment_requests (provider, provider_transaction_id)
  where provider is not null and provider_transaction_id is not null;

create or replace function public.confirm_sepay_vietqr_payment(
  p_reference text,
  p_amount_vnd integer,
  p_provider_transaction_id bigint,
  p_provider_reference_code text,
  p_provider_transaction_at timestamptz,
  p_provider_payload jsonb
)
returns table (
  result text,
  payment_id uuid,
  payment_user_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  payment public.vietqr_payment_requests%rowtype;
begin
  if p_reference is null
    or p_amount_vnd is null
    or p_amount_vnd <= 0
    or p_provider_transaction_id is null
    or p_provider_transaction_id <= 0 then
    return query select 'invalid'::text, null::uuid, null::uuid;
    return;
  end if;

  select *
    into payment
    from public.vietqr_payment_requests
   where provider = 'sepay'
     and provider_transaction_id = p_provider_transaction_id
   limit 1;

  if found then
    return query select 'duplicate'::text, payment.id, payment.user_id;
    return;
  end if;

  select *
    into payment
    from public.vietqr_payment_requests
   where reference = upper(trim(p_reference))
   for update;

  if not found then
    return query select 'not_found'::text, null::uuid, null::uuid;
    return;
  end if;

  if payment.status = 'confirmed' then
    return query select 'already_confirmed'::text, payment.id, payment.user_id;
    return;
  end if;

  if payment.status <> 'pending' then
    return query select payment.status, payment.id, payment.user_id;
    return;
  end if;

  if payment.expires_at < now() then
    update public.vietqr_payment_requests
       set status = 'expired',
           updated_at = now()
     where id = payment.id;

    return query select 'expired'::text, payment.id, payment.user_id;
    return;
  end if;

  if payment.amount_vnd <> p_amount_vnd then
    return query select 'amount_mismatch'::text, payment.id, payment.user_id;
    return;
  end if;

  update public.vietqr_payment_requests
     set status = 'confirmed',
         confirmed_at = now(),
         updated_at = now(),
         provider = 'sepay',
         provider_transaction_id = p_provider_transaction_id,
         provider_reference_code = nullif(trim(p_provider_reference_code), ''),
         provider_transaction_at = p_provider_transaction_at,
         provider_payload = coalesce(p_provider_payload, '{}'::jsonb),
         metadata = metadata || jsonb_build_object(
           'provider', 'sepay',
           'confirmation', 'webhook'
         )
   where id = payment.id;

  insert into public.subscriptions (
    user_id,
    plan,
    plan_tier,
    status,
    current_period_end,
    updated_at
  )
  values (
    payment.user_id,
    'pro',
    'Pro',
    'active',
    now() + interval '30 days',
    now()
  )
  on conflict (user_id) do update
    set plan = 'pro',
        plan_tier = 'Pro',
        status = 'active',
        current_period_end =
          greatest(
            coalesce(public.subscriptions.current_period_end, now()),
            now()
          ) + interval '30 days',
        updated_at = now();

  return query select 'confirmed'::text, payment.id, payment.user_id;
end;
$$;

revoke all on function public.confirm_sepay_vietqr_payment(
  text,
  integer,
  bigint,
  text,
  timestamptz,
  jsonb
) from public;

grant execute on function public.confirm_sepay_vietqr_payment(
  text,
  integer,
  bigint,
  text,
  timestamptz,
  jsonb
) to service_role;

create table if not exists public.run_logs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  status text not null check (status in ('success', 'error')),
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  duration_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists run_logs_type_created_idx
  on public.run_logs (run_type, created_at desc);

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (
    event_name in (
      'dashboard_view',
      'monitor_created',
      'checkout_started',
      'vietqr_requested',
      'evidence_exported'
    )
  ),
  route_path text,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint product_events_route_path_safe check (
    route_path is null or (
      route_path like '/dashboard%' and
      position('?' in route_path) = 0 and
      position('#' in route_path) = 0 and
      char_length(route_path) <= 120
    )
  )
);

create index if not exists product_events_user_occurred_idx
  on public.product_events (user_id, occurred_at desc);

create index if not exists product_events_name_occurred_idx
  on public.product_events (event_name, occurred_at desc);

alter table public.profiles enable row level security;
alter table public.waitlist_signups enable row level security;
alter table public.indicator_snapshots enable row level security;
alter table public.evidence_observations enable row level security;
alter table public.evidence_corrections enable row level security;
alter table public.thesis_snapshots enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_notifications enable row level security;
alter table public.alert_trigger_state enable row level security;
alter table public.subscriptions enable row level security;
alter table public.vietqr_payment_requests enable row level security;
alter table public.run_logs enable row level security;
alter table public.product_events enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can read their own alerts"
  on public.alerts for select
  using (auth.uid() = user_id);

create policy "Users can manage their own alerts"
  on public.alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read their own alert notifications"
  on public.alert_notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own alert notifications"
  on public.alert_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role can manage alert trigger state"
  on public.alert_trigger_state for all
  using (true)
  with check (true);

create policy "Users can read their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can read their own VietQR payment requests"
  on public.vietqr_payment_requests for select
  using (auth.uid() = user_id);

create policy "Authenticated users can read indicator snapshots"
  on public.indicator_snapshots for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read evidence observations"
  on public.evidence_observations for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read evidence corrections"
  on public.evidence_corrections for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read thesis snapshots"
  on public.thesis_snapshots for select
  using (auth.role() = 'authenticated');

create policy "Service role can manage run logs"
  on public.run_logs for all
  using (true)
  with check (true);

create policy "Service role can manage product events"
  on public.product_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.prevent_evidence_correction_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'evidence_corrections is append-only';
end;
$$;

drop trigger if exists evidence_corrections_append_only
  on public.evidence_corrections;

create trigger evidence_corrections_append_only
before update or delete on public.evidence_corrections
for each row execute function public.prevent_evidence_correction_mutation();

create or replace function public.apply_evidence_correction(
  p_observation_id uuid,
  p_corrected_numeric_value double precision,
  p_correction_reason text,
  p_correction_source_url text default null,
  p_correction_metadata jsonb default '{}'::jsonb,
  p_applied_by uuid default null
)
returns public.evidence_observations
language plpgsql
security definer
set search_path = public
as $$
declare
  observation public.evidence_observations%rowtype;
  updated_observation public.evidence_observations%rowtype;
begin
  if p_corrected_numeric_value is null or
    p_corrected_numeric_value::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'corrected numeric value must be finite';
  end if;
  if char_length(trim(coalesce(p_correction_reason, ''))) < 10 then
    raise exception 'correction reason must contain at least 10 characters';
  end if;

  select * into observation
  from public.evidence_observations
  where id = p_observation_id
  for update;

  if not found then raise exception 'evidence observation not found'; end if;
  if observation.numeric_value = p_corrected_numeric_value then
    raise exception 'corrected value must differ from the current value';
  end if;

  insert into public.evidence_corrections (
    evidence_observation_id, source_key, driver_key, series_key, observed_at,
    previous_numeric_value, corrected_numeric_value, unit, correction_reason,
    correction_source_url, correction_metadata, applied_by
  ) values (
    observation.id, observation.source_key, observation.driver_key,
    observation.series_key, observation.observed_at, observation.numeric_value,
    p_corrected_numeric_value, observation.unit, trim(p_correction_reason),
    nullif(trim(coalesce(p_correction_source_url, '')), ''),
    coalesce(p_correction_metadata, '{}'::jsonb), p_applied_by
  );

  update public.evidence_observations
  set numeric_value = p_corrected_numeric_value, updated_at = now()
  where id = observation.id
  returning * into updated_observation;

  return updated_observation;
end;
$$;
