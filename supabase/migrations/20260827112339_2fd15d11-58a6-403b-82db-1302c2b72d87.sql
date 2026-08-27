-- Zekerheid: helper bestaat en is SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_company_id() FROM public;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;

-- Leesregel herschrijven zonder directe kolomtoegang tot profiles.
DROP POLICY IF EXISTS "Members can read their company" ON public.companies;
CREATE POLICY "Members can read their company"
  ON public.companies FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'stock_manager')
    OR id = public.current_company_id()
  );