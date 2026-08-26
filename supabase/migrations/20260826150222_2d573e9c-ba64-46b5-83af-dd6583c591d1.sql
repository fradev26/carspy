-- Normalisatie: strip separators, uppercase, landcode afleiden, BE 9-cijferig aanvullen
CREATE OR REPLACE FUNCTION public.normalize_vat(_vat text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v text;
  country text;
BEGIN
  IF _vat IS NULL THEN RETURN NULL; END IF;

  v := upper(regexp_replace(_vat, '[\s\.\-/_]', '', 'g'));
  IF v = '' THEN RETURN NULL; END IF;

  IF left(v, 2) IN ('BE', 'NL') THEN
    country := left(v, 2);
    v := substr(v, 3);
  ELSE
    country := 'BE';
  END IF;

  IF country = 'BE' THEN
    v := regexp_replace(v, '\D', '', 'g');
    IF length(v) = 9 THEN v := '0' || v; END IF;
  END IF;

  RETURN country || v;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_valid_vat(_vat text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT public.normalize_vat(_vat) ~ '^BE[01][0-9]{9}$'
      OR public.normalize_vat(_vat) ~ '^NL[0-9]{9}B[0-9]{2}$';
$$;

-- Trigger: normaliseer + valideer (strikt)
CREATE OR REPLACE FUNCTION public._normalize_vat_strict()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  normalized text;
BEGIN
  normalized := public.normalize_vat(NEW.vat_number);
  IF normalized IS NOT NULL AND NOT public.is_valid_vat(normalized) THEN
    RAISE EXCEPTION 'Ongeldig ondernemingsnummer: %. Verwacht formaat: 10 cijfers startend met 0 of 1 (BE, bv. 0123.456.789) of NL + 9 cijfers + B + 2 cijfers.', NEW.vat_number
      USING ERRCODE = '23514';
  END IF;
  NEW.vat_number := normalized;
  RETURN NEW;
END;
$$;

-- Trigger: enkel normaliseren (leads mogen nooit falen)
CREATE OR REPLACE FUNCTION public._normalize_vat_lenient()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.vat_number IS NOT NULL AND public.is_valid_vat(NEW.vat_number) THEN
    NEW.vat_number := public.normalize_vat(NEW.vat_number);
  END IF;
  RETURN NEW;
END;
$$;

-- Bestaande data normaliseren
UPDATE public.profiles SET vat_number = public.normalize_vat(vat_number)
  WHERE vat_number IS NOT NULL AND vat_number IS DISTINCT FROM public.normalize_vat(vat_number);
UPDATE public.companies SET vat_number = public.normalize_vat(vat_number)
  WHERE vat_number IS NOT NULL AND vat_number IS DISTINCT FROM public.normalize_vat(vat_number);
UPDATE public.dealer_leads SET vat_number = public.normalize_vat(vat_number)
  WHERE vat_number IS NOT NULL AND public.is_valid_vat(vat_number)
    AND vat_number IS DISTINCT FROM public.normalize_vat(vat_number);

DROP TRIGGER IF EXISTS normalize_vat_profiles ON public.profiles;
CREATE TRIGGER normalize_vat_profiles
  BEFORE INSERT OR UPDATE OF vat_number ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public._normalize_vat_strict();

DROP TRIGGER IF EXISTS normalize_vat_companies ON public.companies;
CREATE TRIGGER normalize_vat_companies
  BEFORE INSERT OR UPDATE OF vat_number ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public._normalize_vat_strict();

DROP TRIGGER IF EXISTS normalize_vat_dealer_leads ON public.dealer_leads;
CREATE TRIGGER normalize_vat_dealer_leads
  BEFORE INSERT OR UPDATE OF vat_number ON public.dealer_leads
  FOR EACH ROW EXECUTE FUNCTION public._normalize_vat_lenient();

-- Constraints als extra vangnet
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_vat_number_valid;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_vat_number_valid
  CHECK (vat_number IS NULL OR public.is_valid_vat(vat_number)) NOT VALID;

ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_vat_number_valid;
ALTER TABLE public.companies ADD CONSTRAINT companies_vat_number_valid
  CHECK (vat_number IS NULL OR public.is_valid_vat(vat_number)) NOT VALID;