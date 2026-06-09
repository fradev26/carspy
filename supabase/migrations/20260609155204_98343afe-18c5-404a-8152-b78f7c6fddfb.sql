
-- Enums
DO $$ BEGIN
  CREATE TYPE public.vehicle_lead_status AS ENUM ('analyzed','account_created','listed','sold','offered_to_dealers');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table
CREATE TABLE IF NOT EXISTS public.vehicle_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  email text,
  brand text NOT NULL,
  model text,
  year int,
  mileage int,
  fuel_type text,
  transmission text,
  estimated_price int,
  price_min int,
  price_max int,
  status public.vehicle_lead_status NOT NULL DEFAULT 'analyzed',
  offer_eligible_at timestamptz,
  session_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.vehicle_leads TO authenticated;
GRANT INSERT ON public.vehicle_leads TO anon;
GRANT ALL ON public.vehicle_leads TO service_role;

ALTER TABLE public.vehicle_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can insert a lead from the AutoWaarde tool
CREATE POLICY "Anyone can insert vehicle leads"
  ON public.vehicle_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Owners can read their own leads
CREATE POLICY "Owners can read own leads"
  ON public.vehicle_leads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins read all
CREATE POLICY "Admins read all leads"
  ON public.vehicle_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Owners can update (e.g. attach listing_id later)
CREATE POLICY "Owners can update own leads"
  ON public.vehicle_leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_vehicle_leads_updated_at
  BEFORE UPDATE ON public.vehicle_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_vehicle_leads_user ON public.vehicle_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_leads_listing ON public.vehicle_leads(listing_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_leads_status ON public.vehicle_leads(status);

-- Trigger: sync lead status when listing status changes
CREATE OR REPLACE FUNCTION public.sync_lead_on_listing_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'sold' THEN
    UPDATE public.vehicle_leads
    SET status = 'sold'
    WHERE listing_id = NEW.id AND status <> 'sold';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_lead_on_listing_status ON public.listings;
CREATE TRIGGER trg_sync_lead_on_listing_status
  AFTER UPDATE OF status ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.sync_lead_on_listing_status();

-- Mark leads eligible for dealer pool
CREATE OR REPLACE FUNCTION public.mark_dealer_eligible_leads()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected int;
BEGIN
  WITH updated AS (
    UPDATE public.vehicle_leads vl
    SET status = 'offered_to_dealers',
        offer_eligible_at = now()
    FROM public.listings l
    WHERE vl.listing_id = l.id
      AND vl.status IN ('listed','account_created','analyzed')
      AND l.status = 'active'
      AND (
        l.created_at < now() - interval '14 days'
        OR (l.boost_until IS NOT NULL AND l.boost_until < now())
      )
    RETURNING vl.id
  )
  SELECT count(*) INTO affected FROM updated;
  RETURN affected;
END;
$$;

-- pg_cron daily schedule
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$ BEGIN
  PERFORM cron.unschedule('mark-dealer-eligible-leads-daily');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'mark-dealer-eligible-leads-daily',
  '0 3 * * *',
  $$SELECT public.mark_dealer_eligible_leads();$$
);
