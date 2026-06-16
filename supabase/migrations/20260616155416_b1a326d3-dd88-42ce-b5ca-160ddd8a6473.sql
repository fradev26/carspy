CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$ BEGIN
  PERFORM cron.unschedule('refresh-boosted-status-every-15min');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'refresh-boosted-status-every-15min',
  '*/15 * * * *',
  $$ SELECT public.refresh_boosted_status(); $$
);