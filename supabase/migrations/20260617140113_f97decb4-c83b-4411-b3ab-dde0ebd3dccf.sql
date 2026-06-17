
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS cost_price integer,
  ADD COLUMN IF NOT EXISTS sold_price integer,
  ADD COLUMN IF NOT EXISTS sold_at timestamptz,
  ADD COLUMN IF NOT EXISTS margin integer GENERATED ALWAYS AS (sold_price - cost_price) STORED;

CREATE OR REPLACE FUNCTION public.set_sold_at_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'sold' AND (OLD.status IS DISTINCT FROM 'sold') AND NEW.sold_at IS NULL THEN
    NEW.sold_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_set_sold_at ON public.listings;
CREATE TRIGGER listings_set_sold_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_sold_at_on_status_change();

CREATE INDEX IF NOT EXISTS idx_listings_user_sold_at ON public.listings(user_id, sold_at DESC) WHERE status = 'sold';
