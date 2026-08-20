grant execute on function public.search_facets(jsonb) to service_role, postgres;
grant execute on function public.search_filter_sql(jsonb, text) to service_role;