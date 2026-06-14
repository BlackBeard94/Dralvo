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

  select *
  into observation
  from public.evidence_observations
  where id = p_observation_id
  for update;

  if not found then
    raise exception 'evidence observation not found';
  end if;

  if observation.numeric_value = p_corrected_numeric_value then
    raise exception 'corrected value must differ from the current value';
  end if;

  insert into public.evidence_corrections (
    evidence_observation_id,
    source_key,
    driver_key,
    series_key,
    observed_at,
    previous_numeric_value,
    corrected_numeric_value,
    unit,
    correction_reason,
    correction_source_url,
    correction_metadata,
    applied_by
  )
  values (
    observation.id,
    observation.source_key,
    observation.driver_key,
    observation.series_key,
    observation.observed_at,
    observation.numeric_value,
    p_corrected_numeric_value,
    observation.unit,
    trim(p_correction_reason),
    nullif(trim(coalesce(p_correction_source_url, '')), ''),
    coalesce(p_correction_metadata, '{}'::jsonb),
    p_applied_by
  );

  update public.evidence_observations
  set
    numeric_value = p_corrected_numeric_value,
    updated_at = now(),
    metadata = metadata || jsonb_build_object(
      'lastCorrectionAppliedAt', now(),
      'lastCorrectionReason', trim(p_correction_reason)
    )
  where id = observation.id
  returning * into updated_observation;

  return updated_observation;
end;
$$;

revoke all on function public.apply_evidence_correction(
  uuid,
  double precision,
  text,
  text,
  jsonb,
  uuid
) from public, anon, authenticated;

grant execute on function public.apply_evidence_correction(
  uuid,
  double precision,
  text,
  text,
  jsonb,
  uuid
) to service_role;
