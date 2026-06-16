-- Extra indexen
CREATE INDEX IF NOT EXISTS listings_status_created_idx ON public.listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_brand_model_idx ON public.listings(brand, model);
CREATE INDEX IF NOT EXISTS import_jobs_status_created_idx ON public.import_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_actions_admin_id_idx ON public.admin_actions(admin_id);

-- listings.company_id + backfill
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS listings_company_id_idx ON public.listings(company_id);

UPDATE public.listings l
   SET company_id = p.company_id
  FROM public.profiles p
 WHERE l.user_id = p.id
   AND l.company_id IS NULL
   AND p.company_id IS NOT NULL;

-- Vervang bestaande user-policies door variant die ook bedrijfsleden meeneemt.
-- Admin-policies blijven staan.
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can create own listings"   ON public.listings;
DROP POLICY IF EXISTS "Users can update own listings"   ON public.listings;
DROP POLICY IF EXISTS "Users can delete own listings"   ON public.listings;

CREATE POLICY "listings public read"
  ON public.listings FOR SELECT TO anon, authenticated
  USING (
    status = 'active'
    OR user_id = auth.uid()
    OR (
      company_id IS NOT NULL
      AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "owners manage listings"
  ON public.listings FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      company_id IS NOT NULL
      AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      company_id IS NOT NULL
      AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
  );