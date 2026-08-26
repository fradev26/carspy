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
    SELECT l.user_id, l.company_id
      INTO v_owner, v_company
    FROM public.listings AS l
    WHERE l.id = NEW.listing_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unknown listing for dealer lead'
        USING ERRCODE = '23503';
    END IF;

    NEW.dealer_user_id := v_owner;
    NEW.company_id := v_company;
  ELSE
    -- Listing-less requests are internal VATUUR leads. Caller-supplied
    -- ownership is never trusted, even when the caller is authenticated.
    NEW.dealer_user_id := NULL;
    NEW.company_id := NULL;
  END IF;

  -- The requester identity is derived from the validated JWT subject.
  -- Anonymous requests intentionally persist NULL here.
  NEW.user_id := auth.uid();
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION public._dealer_leads_before_insert() FROM PUBLIC, anon, authenticated;