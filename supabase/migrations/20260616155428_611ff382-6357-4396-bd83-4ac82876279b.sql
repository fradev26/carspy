REVOKE EXECUTE ON FUNCTION public.refresh_boosted_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_dealer_eligible_leads() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_boosted_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_dealer_eligible_leads() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;