DROP POLICY IF EXISTS "listings public read" ON public.listings;

CREATE POLICY "listings anon read active" ON public.listings
FOR SELECT TO anon
USING (status = 'active');

CREATE POLICY "listings authenticated read" ON public.listings
FOR SELECT TO authenticated
USING (
  status = 'active'
  OR user_id = auth.uid()
  OR (company_id IS NOT NULL AND company_id = public.current_company_id())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);