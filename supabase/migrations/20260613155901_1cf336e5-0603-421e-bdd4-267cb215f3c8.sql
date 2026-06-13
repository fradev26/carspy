-- 1. Profiles: eigenaar-only SELECT
DROP POLICY IF EXISTS "Profile rows readable" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Tighten public INSERT policies
DROP POLICY IF EXISTS "Anyone can submit a dealer lead" ON public.dealer_leads;
CREATE POLICY "Anyone can submit a dealer lead"
ON public.dealer_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(coalesce(name, '')) BETWEEN 2 AND 200
  AND length(coalesce(email, '')) BETWEEN 5 AND 200
  AND length(coalesce(message, '')) <= 2000
  AND length(coalesce(company, '')) <= 200
  AND length(coalesce(phone, '')) <= 50
  AND length(coalesce(vat_number, '')) <= 50
);

DROP POLICY IF EXISTS "Anyone can insert vehicle leads" ON public.vehicle_leads;
CREATE POLICY "Anyone can insert vehicle leads"
ON public.vehicle_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(coalesce(email, '')) <= 200
  AND length(coalesce(brand, '')) BETWEEN 1 AND 60
  AND length(coalesce(model, '')) <= 80
);

DROP POLICY IF EXISTS "Anyone can insert marketing events" ON public.marketing_events;
CREATE POLICY "Anyone can insert marketing events"
ON public.marketing_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(coalesce(event_name, '')) BETWEEN 1 AND 100
  AND length(coalesce(page, '')) <= 500
);

DROP POLICY IF EXISTS "anyone can send support message" ON public.support_messages;
CREATE POLICY "anyone can send support message"
ON public.support_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(coalesce(name, '')) BETWEEN 1 AND 200
  AND length(coalesce(email, '')) BETWEEN 5 AND 200
  AND length(coalesce(subject, '')) BETWEEN 1 AND 200
  AND length(coalesce(message, '')) BETWEEN 1 AND 5000
);

-- 3. Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.sync_lead_on_listing_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_dealer_eligible_leads() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.is_listing_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_listing_owner(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 4. Remove duplicate storage policies
DROP POLICY IF EXISTS "Anyone can view listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- 5. rate_limits: explicit deny for clients
CREATE POLICY "Deny all client access to rate_limits"
ON public.rate_limits
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);