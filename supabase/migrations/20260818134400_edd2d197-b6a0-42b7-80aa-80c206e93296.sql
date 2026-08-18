-- 1. Listings: hide dealer-internal financials and block direct paid-placement writes
REVOKE SELECT, UPDATE ON public.listings FROM anon, authenticated;
DO $$
DECLARE sel_cols text; upd_cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ') INTO sel_cols
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='listings'
     AND column_name NOT IN ('cost_price','sold_price','margin');
  EXECUTE format('GRANT SELECT (%s) ON public.listings TO anon, authenticated', sel_cols);

  SELECT string_agg(quote_ident(column_name), ', ') INTO upd_cols
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='listings'
     AND column_name NOT IN ('boost_until','is_boosted','is_premium');
  EXECUTE format('GRANT UPDATE (%s) ON public.listings TO authenticated', upd_cols);
END $$;
GRANT ALL ON public.listings TO service_role;

-- Billing-checked premium toggle
CREATE OR REPLACE FUNCTION public.set_listing_premium(_listing_id uuid, _enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.listings%ROWTYPE;
  v_paid boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_row FROM public.listings WHERE id = _listing_id;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'listing not found'; END IF;
  IF NOT (v_row.user_id = v_uid
          OR (v_row.company_id IS NOT NULL AND v_row.company_id = public.current_company_id()
              AND public.can_edit_listings(v_uid))) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _enabled THEN
    SELECT EXISTS (
      SELECT 1 FROM public.dealer_subscriptions s
      JOIN public.subscription_plans p ON p.id = s.plan_id
      WHERE s.user_id = v_row.user_id AND s.status = 'active'
        AND s.period_end > now() AND p.monthly_price_cents > 0
    ) INTO v_paid;
    IF NOT v_paid THEN
      RAISE EXCEPTION 'premium requires an active paid subscription';
    END IF;
  END IF;

  UPDATE public.listings SET is_premium = _enabled WHERE id = _listing_id;
  RETURN _enabled;
END $$;

-- 2. Subscriptions: no direct client writes; plan changes await payment
REVOKE INSERT, UPDATE, DELETE ON public.dealer_subscriptions FROM anon, authenticated;
GRANT SELECT ON public.dealer_subscriptions TO authenticated;
GRANT ALL ON public.dealer_subscriptions TO service_role;

DROP POLICY IF EXISTS "own subscription insert" ON public.dealer_subscriptions;
DROP POLICY IF EXISTS "own subscription update" ON public.dealer_subscriptions;

CREATE OR REPLACE FUNCTION public.request_plan_change(_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_plan public.subscription_plans%ROWTYPE;
  v_id uuid;
  v_start timestamptz := date_trunc('month', now());
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT public.can_manage_billing(v_uid) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO v_plan FROM public.subscription_plans WHERE id = _plan_id;
  IF v_plan.id IS NULL THEN RAISE EXCEPTION 'unknown plan'; END IF;

  DELETE FROM public.dealer_subscriptions
   WHERE user_id = v_uid AND status = 'pending_payment';

  INSERT INTO public.dealer_subscriptions(user_id, plan_id, status, period_start, period_end)
  VALUES (v_uid, _plan_id, 'pending_payment', v_start, v_start + interval '1 month')
  RETURNING id INTO v_id;

  PERFORM public.log_audit_event('subscription_change_requested','billing','dealer_subscriptions',
    v_id::text, v_plan.name, jsonb_build_object('plan_code', v_plan.code));

  RETURN jsonb_build_object('subscription_id', v_id, 'status', 'pending_payment',
                            'plan_code', v_plan.code, 'plan_name', v_plan.name,
                            'monthly_price_cents', v_plan.monthly_price_cents);
END $$;

-- 3. Fix mutable search_path on queue helpers
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;

-- 4. Lock down EXECUTE on SECURITY DEFINER functions
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prosecdef
       AND p.proname IN (
        'accept_invitation','activate_boost','can_boost','can_delete_listings','can_edit_company',
        'can_edit_listings','can_manage_billing','can_manage_users','can_view_leads',
        'change_member_role','current_company_id','deactivate_member','ensure_company_membership',
        'get_current_billing','get_my_profile','get_or_create_inventory_preferences',
        'has_company_role','has_role','invite_member','is_company_owner','is_listing_owner',
        'list_company_members','log_audit_event','member_role','peek_invitation',
        'reactivate_member','remove_member','request_plan_change','resend_invitation',
        'revoke_invitation','set_listing_premium')
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.peek_invitation(text) TO anon;