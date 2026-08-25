-- 1) profiles: lock sensitive columns for authenticated (mirror anon safe set)
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, full_name, dealer_name, is_dealer, avatar_url, location, created_at, updated_at) ON public.profiles TO authenticated;

-- 2) boost_usage: read-only for clients; writes only through activate_boost()
DROP POLICY IF EXISTS "boost usage manage" ON public.boost_usage;
REVOKE INSERT, UPDATE, DELETE ON public.boost_usage FROM authenticated, anon;
GRANT SELECT ON public.boost_usage TO authenticated;
GRANT ALL ON public.boost_usage TO service_role;

-- 3) dealer_leads: derive ownership + force initial status on insert
CREATE OR REPLACE FUNCTION public._dealer_leads_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid;
  v_company uuid;
BEGIN
  NEW.status := 'new';

  IF NEW.listing_id IS NOT NULL THEN
    SELECT l.user_id, l.company_id INTO v_owner, v_company
    FROM public.listings l WHERE l.id = NEW.listing_id;
    NEW.dealer_user_id := v_owner;
    NEW.company_id := v_company;
  ELSE
    -- No listing context: only an authenticated user may claim their own lead row.
    IF NEW.dealer_user_id IS DISTINCT FROM auth.uid() THEN
      NEW.dealer_user_id := NULL;
    END IF;
    NEW.company_id := CASE WHEN NEW.dealer_user_id IS NULL THEN NULL
                           ELSE (SELECT company_id FROM public.profiles WHERE id = NEW.dealer_user_id) END;
  END IF;

  NEW.user_id := auth.uid();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_dealer_leads_before_insert ON public.dealer_leads;
CREATE TRIGGER trg_dealer_leads_before_insert
BEFORE INSERT ON public.dealer_leads
FOR EACH ROW EXECUTE FUNCTION public._dealer_leads_before_insert();

-- 4) role helpers: scope to the user's own company
CREATE OR REPLACE FUNCTION public.member_role(_user_id uuid)
RETURNS company_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT cm.role
  FROM public.company_members cm
  WHERE cm.user_id = _user_id
    AND cm.status = 'active'
  ORDER BY (cm.company_id IS NOT DISTINCT FROM (SELECT p.company_id FROM public.profiles p WHERE p.id = _user_id)) DESC,
           cm.joined_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(_user_id uuid, _role company_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.member_role(_user_id) = _role;
$$;