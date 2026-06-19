-- 1. Dealer inventory preferences table
CREATE TABLE public.dealer_inventory_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_update_enabled boolean NOT NULL DEFAULT true,
  update_method text NOT NULL DEFAULT 'manual' CHECK (update_method IN ('manual','autoscout')),
  default_listing_status text NOT NULL DEFAULT 'active' CHECK (default_listing_status IN ('active','draft')),
  auto_mark_sold boolean NOT NULL DEFAULT true,
  on_sold_action text NOT NULL DEFAULT 'keep_visible' CHECK (on_sold_action IN ('keep_visible','hide','archive_after_days')),
  archive_after_days integer NOT NULL DEFAULT 30 CHECK (archive_after_days BETWEEN 1 AND 365),
  low_stock_threshold integer NOT NULL DEFAULT 3 CHECK (low_stock_threshold BETWEEN 0 AND 1000),
  low_stock_push boolean NOT NULL DEFAULT true,
  low_stock_email boolean NOT NULL DEFAULT true,
  auto_relist_on_cancel boolean NOT NULL DEFAULT true,
  relist_delay_minutes integer NOT NULL DEFAULT 5 CHECK (relist_delay_minutes BETWEEN 0 AND 1440),
  reservation_enabled boolean NOT NULL DEFAULT true,
  reservation_minutes integer NOT NULL DEFAULT 30 CHECK (reservation_minutes BETWEEN 5 AND 1440),
  allow_negative_stock boolean NOT NULL DEFAULT false,
  allow_backorders boolean NOT NULL DEFAULT false,
  auto_generate_vin_ref boolean NOT NULL DEFAULT false,
  sync_interval_minutes integer NOT NULL DEFAULT 60 CHECK (sync_interval_minutes IN (15,30,60,120,240,1440)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dealer_inventory_preferences TO authenticated;
GRANT ALL ON public.dealer_inventory_preferences TO service_role;

ALTER TABLE public.dealer_inventory_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own inv prefs select" ON public.dealer_inventory_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own inv prefs insert" ON public.dealer_inventory_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own inv prefs update" ON public.dealer_inventory_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own inv prefs delete" ON public.dealer_inventory_preferences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER dealer_inv_prefs_updated_at BEFORE UPDATE ON public.dealer_inventory_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Helper RPC: get_or_create_inventory_preferences
CREATE OR REPLACE FUNCTION public.get_or_create_inventory_preferences()
RETURNS public.dealer_inventory_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.dealer_inventory_preferences;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_row FROM public.dealer_inventory_preferences WHERE user_id = v_uid;
  IF NOT FOUND THEN
    INSERT INTO public.dealer_inventory_preferences (user_id) VALUES (v_uid)
    RETURNING * INTO v_row;
  END IF;
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_inventory_preferences() TO authenticated;

-- 3. Listings: reservation + auto-archive columns
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS reserved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserved_until timestamptz,
  ADD COLUMN IF NOT EXISTS auto_archive_at timestamptz;

CREATE INDEX IF NOT EXISTS listings_reserved_until_idx
  ON public.listings(reserved_until) WHERE reserved_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS listings_auto_archive_at_idx
  ON public.listings(auto_archive_at) WHERE auto_archive_at IS NOT NULL;
