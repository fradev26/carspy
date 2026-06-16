-- companies (tabel zonder policies eerst)
CREATE TABLE IF NOT EXISTS public.companies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  vat_number  text,
  email       text,
  phone       text,
  website     text,
  address     text,
  city        text,
  postal_code text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- profiles.company_id MOET vóór de companies-policy bestaan
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS profiles_company_id_idx ON public.profiles(company_id);

-- companies policies
DROP POLICY IF EXISTS "Members can read their company" ON public.companies;
CREATE POLICY "Members can read their company"
  ON public.companies FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'stock_manager')
    OR id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage companies" ON public.companies;
CREATE POLICY "Admins manage companies"
  ON public.companies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- import_job_rows
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='import_job_rows' AND column_name='row_index')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='import_job_rows' AND column_name='row_number')
  THEN
    ALTER TABLE public.import_job_rows RENAME COLUMN row_index TO row_number;
  END IF;
END $$;
ALTER TABLE public.import_job_rows ADD COLUMN IF NOT EXISTS payload jsonb;

-- listings.onboarded_by
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS onboarded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS listings_onboarded_by_idx ON public.listings(onboarded_by);

-- autoscout_credentials
CREATE TABLE IF NOT EXISTS public.autoscout_credentials (
  user_id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id        text NOT NULL,
  username           text NOT NULL,
  password_secret_id uuid,
  last_sync_at       timestamptz,
  last_sync_status   text,
  last_sync_error    text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.autoscout_credentials TO authenticated;
GRANT ALL ON public.autoscout_credentials TO service_role;
ALTER TABLE public.autoscout_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dealers manage own AutoScout creds" ON public.autoscout_credentials;
CREATE POLICY "Dealers manage own AutoScout creds"
  ON public.autoscout_credentials FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'stock_manager'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'stock_manager'));

DROP TRIGGER IF EXISTS trg_autoscout_credentials_updated_at ON public.autoscout_credentials;
CREATE TRIGGER trg_autoscout_credentials_updated_at
  BEFORE UPDATE ON public.autoscout_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- autoscout_listings
CREATE TABLE IF NOT EXISTS public.autoscout_listings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autoscout_listing_id  text NOT NULL,
  internal_listing_id   uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  content_hash          text NOT NULL DEFAULT '',
  raw_data              jsonb,
  publication_status    text,
  sync_status           text,
  sync_error            text,
  last_seen_at          timestamptz,
  last_changed_at       timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, autoscout_listing_id)
);
CREATE INDEX IF NOT EXISTS autoscout_listings_internal_idx ON public.autoscout_listings(internal_listing_id);
CREATE INDEX IF NOT EXISTS autoscout_listings_user_status_idx ON public.autoscout_listings(user_id, sync_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.autoscout_listings TO authenticated;
GRANT ALL ON public.autoscout_listings TO service_role;
ALTER TABLE public.autoscout_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dealers read own AutoScout listings" ON public.autoscout_listings;
CREATE POLICY "Dealers read own AutoScout listings"
  ON public.autoscout_listings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'stock_manager'));

DROP POLICY IF EXISTS "Dealers manage own AutoScout listings" ON public.autoscout_listings;
CREATE POLICY "Dealers manage own AutoScout listings"
  ON public.autoscout_listings FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'stock_manager'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'stock_manager'));

DROP TRIGGER IF EXISTS trg_autoscout_listings_updated_at ON public.autoscout_listings;
CREATE TRIGGER trg_autoscout_listings_updated_at
  BEFORE UPDATE ON public.autoscout_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- autoscout_sync_runs
CREATE TABLE IF NOT EXISTS public.autoscout_sync_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger       text NOT NULL CHECK (trigger IN ('manual','cron')),
  status        text NOT NULL CHECK (status IN ('running','success','error')),
  totals        jsonb,
  error_message text,
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz
);
CREATE INDEX IF NOT EXISTS autoscout_sync_runs_user_idx ON public.autoscout_sync_runs(user_id, started_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.autoscout_sync_runs TO authenticated;
GRANT ALL ON public.autoscout_sync_runs TO service_role;
ALTER TABLE public.autoscout_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dealers read own sync runs" ON public.autoscout_sync_runs;
CREATE POLICY "Dealers read own sync runs"
  ON public.autoscout_sync_runs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'stock_manager'));

-- Vault helper (service_role only)
CREATE OR REPLACE FUNCTION public.autoscout_get_password(_secret_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = _secret_id;
$$;
REVOKE EXECUTE ON FUNCTION public.autoscout_get_password(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.autoscout_get_password(uuid) TO service_role;