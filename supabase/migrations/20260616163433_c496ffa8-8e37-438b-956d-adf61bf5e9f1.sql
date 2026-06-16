-- Restore Data-API grants on every public table (were stripped, breaking PostgREST reads)
DO $$
DECLARE tbl record;
BEGIN
  FOR tbl IN
    SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r' AND n.nspname = 'public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
  END LOOP;
END $$;

-- Targeted anon grants based on existing anon-scoped policies
GRANT SELECT ON public.listings TO anon;
GRANT INSERT ON public.dealer_leads TO anon;
GRANT INSERT ON public.marketing_events TO anon;
GRANT INSERT ON public.support_messages TO anon;
GRANT INSERT ON public.vehicle_leads TO anon;