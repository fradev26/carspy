CREATE TABLE public.dealer_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  vat_number TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'dealers_page_ai',
  status TEXT NOT NULL DEFAULT 'new',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dealer_leads TO authenticated;
GRANT INSERT ON public.dealer_leads TO anon;
GRANT ALL ON public.dealer_leads TO service_role;

ALTER TABLE public.dealer_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a dealer lead"
ON public.dealer_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all dealer leads"
ON public.dealer_leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update dealer leads"
ON public.dealer_leads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete dealer leads"
ON public.dealer_leads
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_dealer_leads_updated_at
BEFORE UPDATE ON public.dealer_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_dealer_leads_created_at ON public.dealer_leads(created_at DESC);
CREATE INDEX idx_dealer_leads_status ON public.dealer_leads(status);