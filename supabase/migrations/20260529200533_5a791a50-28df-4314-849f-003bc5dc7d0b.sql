ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS external_ref text;
CREATE UNIQUE INDEX IF NOT EXISTS listings_user_external_ref_unique
  ON public.listings (user_id, external_ref)
  WHERE external_ref IS NOT NULL;