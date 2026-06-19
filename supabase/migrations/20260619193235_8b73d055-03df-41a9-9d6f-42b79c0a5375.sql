-- Public view exposing only non-PII profile fields. Allows everyone (incl. anon)
-- to resolve the seller's display name, dealer status and avatar for any listing.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT id, full_name, dealer_name, is_dealer, avatar_url, created_at
FROM public.profiles;

-- security_invoker=off means the view runs with owner privileges and bypasses
-- the restrictive SELECT policy on profiles. Because the view only exposes
-- non-PII columns (no phone/email), this is safe.

GRANT SELECT ON public.public_profiles TO anon, authenticated;