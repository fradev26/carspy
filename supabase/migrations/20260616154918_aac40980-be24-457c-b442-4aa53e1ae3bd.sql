-- Add column tracking active boost status
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS is_boosted boolean NOT NULL DEFAULT false;

-- Trigger function: keep is_boosted in sync with boost_until at write time
CREATE OR REPLACE FUNCTION public.sync_listing_boost_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.is_boosted := (NEW.boost_until IS NOT NULL AND NEW.boost_until > now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_listing_boost ON public.listings;
CREATE TRIGGER trg_sync_listing_boost
  BEFORE INSERT OR UPDATE OF boost_until ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_listing_boost_status();

-- Backfill existing rows
UPDATE public.listings
  SET is_boosted = (boost_until IS NOT NULL AND boost_until > now());

-- Refresh function — call periodically (cron / scheduled edge function) to demote expired boosts
CREATE OR REPLACE FUNCTION public.refresh_boosted_status()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected int;
BEGIN
  WITH updated AS (
    UPDATE public.listings
       SET is_boosted = false
     WHERE is_boosted = true
       AND (boost_until IS NULL OR boost_until <= now())
    RETURNING id
  )
  SELECT count(*) INTO affected FROM updated;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_boosted_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_boosted_status() TO service_role;

-- Composite index used by Search ordering
CREATE INDEX IF NOT EXISTS idx_listings_priority_sort
  ON public.listings (is_premium DESC, is_boosted DESC, created_at DESC)
  WHERE status = 'active';