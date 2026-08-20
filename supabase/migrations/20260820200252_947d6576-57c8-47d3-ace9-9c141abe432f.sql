create or replace function public.search_filter_sql(_filters jsonb, _exclude text default null)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  w text := 'status = ''active''';
  arr text;
  arr2 text;
  txt text;
  k text;
  c text;
  pat text;
  days int;
begin
  if _filters is null then
    return w;
  end if;

  -- free text
  if coalesce(_filters->>'q','') <> '' then
    pat := '%' || regexp_replace(_filters->>'q', '[%_,()]', ' ', 'g') || '%';
    w := w || format(' and (title ilike %1$s or brand ilike %1$s or model ilike %1$s or coalesce(description,'''') ilike %1$s)', quote_literal(pat));
  end if;

  -- simple text array dimensions
  for k, c in
    select * from (values
      ('fuelTypes','fuel_type'),
      ('bodyTypes','body_type'),
      ('transmissions','transmission'),
      ('driveTypes','drivetrain'),
      ('colors','color'),
      ('conditionTypes','condition_type'),
      ('emissionClasses','emission_class')
    ) as t(kk, cc)
  loop
    if _exclude is distinct from k
       and jsonb_typeof(_filters->k) = 'array'
       and jsonb_array_length(_filters->k) > 0 then
      select string_agg(quote_literal(x), ',') into arr
      from jsonb_array_elements_text(_filters->k) x;
      w := w || format(' and %I in (%s)', c, arr);
    end if;
  end loop;

  -- brands / models
  if _exclude is distinct from 'brands' then
    if jsonb_typeof(_filters->'models') = 'array' and jsonb_array_length(_filters->'models') > 0 then
      select string_agg(
        format('(brand = %s and model = %s)',
          quote_literal(split_part(x, ':', 1)),
          quote_literal(substr(x, strpos(x, ':') + 1))), ' or ')
      into arr
      from jsonb_array_elements_text(_filters->'models') x;

      select string_agg(quote_literal(b), ',') into arr2
      from jsonb_array_elements_text(coalesce(_filters->'brands','[]'::jsonb)) b
      where not exists (
        select 1 from jsonb_array_elements_text(_filters->'models') m
        where split_part(m, ':', 1) = b
      );

      if arr2 is not null then
        w := w || format(' and ((%s) or brand in (%s))', arr, arr2);
      else
        w := w || format(' and (%s)', arr);
      end if;
    elsif jsonb_typeof(_filters->'brands') = 'array' and jsonb_array_length(_filters->'brands') > 0 then
      select string_agg(quote_literal(x), ',') into arr
      from jsonb_array_elements_text(_filters->'brands') x;
      w := w || format(' and brand in (%s)', arr);
    end if;
  end if;

  -- numeric ranges
  for k, c in
    select * from (values
      ('minPrice','price >= %s'),
      ('maxPrice','price <= %s'),
      ('minYear','year >= %s'),
      ('maxYear','year <= %s'),
      ('minMileage','mileage >= %s'),
      ('maxMileage','mileage <= %s'),
      ('minPower','power >= %s'),
      ('maxPower','power <= %s'),
      ('minDoors','coalesce(door_count, doors) >= %s'),
      ('minSeats','coalesce(seat_count, seats) >= %s'),
      ('maxPreviousOwners','previous_owner_count <= %s'),
      ('maxCo2','co2_emissions <= %s')
    ) as t(kk, cc)
  loop
    txt := _filters->>k;
    if txt is not null and txt ~ '^[0-9]+(\.[0-9]+)?$' then
      w := w || ' and ' || format(c, txt);
    end if;
  end loop;

  -- province (single)
  if coalesce(_filters->>'province','') <> '' then
    w := w || format(' and province = %s', quote_literal(_filters->>'province'));
  end if;

  -- trim / model version
  if coalesce(_filters->>'trim','') <> '' then
    w := w || format(' and model_version ilike %s',
      quote_literal('%' || regexp_replace(_filters->>'trim', '[%_,()]', ' ', 'g') || '%'));
  end if;

  -- booleans
  if (_filters->>'vatDeductible') = 'true' then
    w := w || ' and vat_deductible is true';
  end if;
  if (_filters->>'factoryWarranty') = 'true' then
    w := w || ' and coalesce(warranty_months, 0) > 0';
  end if;
  if (_filters->>'carPass') = 'true' then
    w := w || ' and (service_history is not null and service_history::text <> ''null'')';
  end if;
  if (_filters->>'noDamageHistory') = 'true' then
    w := w || ' and coalesce((condition->''damage''->>''present'')::boolean, false) = false';
  end if;

  -- online since
  txt := _filters->>'onlineSince';
  if txt is not null and txt <> '' then
    days := case txt when 'today' then 1 when '3d' then 3 when '7d' then 7
                     when '14d' then 14 when '30d' then 30 when '30d+' then -30 else null end;
    if days is not null and days > 0 then
      w := w || format(' and created_at >= now() - interval ''%s days''', days);
    elsif days is not null then
      w := w || ' and created_at < now() - interval ''30 days''';
    end if;
  end if;

  -- features (must contain all)
  if _exclude is distinct from 'features'
     and jsonb_typeof(_filters->'features') = 'array'
     and jsonb_array_length(_filters->'features') > 0 then
    select string_agg(quote_literal(x), ',') into arr
    from jsonb_array_elements_text(_filters->'features') x;
    w := w || format(' and equipment @> array[%s]::text[]', arr);
  end if;

  return w;
end;
$$;

create or replace function public.search_facets(_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  result jsonb := '{}'::jsonb;
  k text;
  c text;
  part jsonb;
  total bigint;
begin
  execute format('select count(*) from public.listings where %s', public.search_filter_sql(_filters, null))
    into total;
  result := jsonb_build_object('total', total);

  for k, c in
    select * from (values
      ('fuelTypes','fuel_type'),
      ('bodyTypes','body_type'),
      ('transmissions','transmission'),
      ('driveTypes','drivetrain'),
      ('colors','color'),
      ('conditionTypes','condition_type'),
      ('emissionClasses','emission_class'),
      ('brands','brand')
    ) as t(kk, cc)
  loop
    execute format(
      'select coalesce(jsonb_object_agg(v, c), ''{}''::jsonb) from (
         select %I::text as v, count(*) as c from public.listings
         where %s and %I is not null group by 1
       ) t',
      c, public.search_filter_sql(_filters, k), c)
      into part;
    result := result || jsonb_build_object(k, part);
  end loop;

  execute format(
    'select coalesce(jsonb_object_agg(v, c), ''{}''::jsonb) from (
       select f as v, count(*) as c
       from public.listings l, unnest(coalesce(l.equipment, ''{}''::text[])) f
       where %s group by 1
     ) t',
    public.search_filter_sql(_filters, 'features'))
    into part;
  result := result || jsonb_build_object('features', part);

  return result;
end;
$$;

revoke all on function public.search_filter_sql(jsonb, text) from public, anon, authenticated;
revoke all on function public.search_facets(jsonb) from public;
grant execute on function public.search_facets(jsonb) to anon, authenticated;
grant execute on function public.search_filter_sql(jsonb, text) to postgres;