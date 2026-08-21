-- Leads voor dealers zichtbaar maken
ALTER TABLE public.dealer_leads
  ADD COLUMN IF NOT EXISTS dealer_user_id uuid,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS dealer_leads_dealer_user_id_idx ON public.dealer_leads(dealer_user_id);
CREATE INDEX IF NOT EXISTS dealer_leads_company_id_idx ON public.dealer_leads(company_id);

GRANT SELECT, UPDATE ON public.dealer_leads TO authenticated;
GRANT ALL ON public.dealer_leads TO service_role;

DROP POLICY IF EXISTS "Dealers can view own leads" ON public.dealer_leads;
CREATE POLICY "Dealers can view own leads"
ON public.dealer_leads
FOR SELECT
TO authenticated
USING (
  (dealer_user_id = auth.uid())
  OR (
    company_id IS NOT NULL
    AND company_id = public.current_company_id()
    AND public.can_view_leads(auth.uid())
  )
);

DROP POLICY IF EXISTS "Dealers can update own lead status" ON public.dealer_leads;
CREATE POLICY "Dealers can update own lead status"
ON public.dealer_leads
FOR UPDATE
TO authenticated
USING (
  (dealer_user_id = auth.uid())
  OR (
    company_id IS NOT NULL
    AND company_id = public.current_company_id()
    AND public.can_view_leads(auth.uid())
  )
)
WITH CHECK (
  (dealer_user_id = auth.uid())
  OR (
    company_id IS NOT NULL
    AND company_id = public.current_company_id()
    AND public.can_view_leads(auth.uid())
  )
);