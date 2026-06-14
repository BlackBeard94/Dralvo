alter table public.vietqr_payment_requests
  add column if not exists provider text,
  add column if not exists provider_transaction_id bigint,
  add column if not exists provider_reference_code text,
  add column if not exists provider_transaction_at timestamptz,
  add column if not exists provider_payload jsonb;

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
