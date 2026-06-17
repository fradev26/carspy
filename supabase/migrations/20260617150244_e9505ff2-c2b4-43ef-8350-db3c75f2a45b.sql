
-- Catalog: subscription plans
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  monthly_price_cents integer NOT NULL,
  included_turbo integer NOT NULL DEFAULT 0,
  included_nitro integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans readable by authenticated" ON public.subscription_plans
  FOR SELECT TO authenticated USING (true);

-- Catalog: boost packages
CREATE TABLE public.boost_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  duration_days integer NOT NULL,
  price_cents integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.boost_packages TO authenticated;
GRANT ALL ON public.boost_packages TO service_role;
ALTER TABLE public.boost_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages readable by authenticated" ON public.boost_packages
  FOR SELECT TO authenticated USING (true);

-- Dealer subscriptions
CREATE TABLE public.dealer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active',
  period_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  period_end timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX dealer_subscriptions_one_active
  ON public.dealer_subscriptions(user_id) WHERE status = 'active';
GRANT SELECT, INSERT, UPDATE ON public.dealer_subscriptions TO authenticated;
GRANT ALL ON public.dealer_subscriptions TO service_role;
ALTER TABLE public.dealer_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subscription select" ON public.dealer_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own subscription insert" ON public.dealer_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own subscription update" ON public.dealer_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_dealer_subscriptions_updated
  BEFORE UPDATE ON public.dealer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Boost usage log
CREATE TABLE public.boost_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  package_code text NOT NULL,
  source text NOT NULL CHECK (source IN ('included','extra')),
  price_cents integer NOT NULL DEFAULT 0,
  duration_days integer NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  billing_period date NOT NULL DEFAULT date_trunc('month', now())::date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX boost_usage_user_period_idx ON public.boost_usage(user_id, billing_period);
GRANT SELECT, INSERT ON public.boost_usage TO authenticated;
GRANT ALL ON public.boost_usage TO service_role;
ALTER TABLE public.boost_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own boost usage select" ON public.boost_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Inserts happen via SECURITY DEFINER RPC; no insert policy for end users.

-- Seed plans
INSERT INTO public.subscription_plans (code, name, monthly_price_cents, included_turbo, included_nitro, sort_order) VALUES
  ('premium_dealer', 'Premium Dealer', 4995, 10, 0, 1),
  ('premium_plus',   'Premium Plus',   14995, 40, 10, 2),
  ('enterprise',     'Enterprise',     29995, 100, 30, 3);

-- Seed boost packages
INSERT INTO public.boost_packages (code, name, duration_days, price_cents, sort_order) VALUES
  ('turbo', 'Turbo Boost', 7, 495, 1),
  ('nitro', 'Nitro Boost', 14, 795, 2);

-- Activate boost RPC
CREATE OR REPLACE FUNCTION public.activate_boost(_listing_id uuid, _package_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_pkg public.boost_packages%ROWTYPE;
  v_sub public.dealer_subscriptions%ROWTYPE;
  v_plan public.subscription_plans%ROWTYPE;
  v_used_turbo int := 0;
  v_used_nitro int := 0;
  v_included int := 0;
  v_used int := 0;
  v_source text;
  v_price int;
  v_ends timestamptz;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.is_listing_owner(_listing_id) THEN
    RAISE EXCEPTION 'not owner of listing';
  END IF;

  SELECT * INTO v_pkg FROM public.boost_packages WHERE code = _package_code;
  IF v_pkg.id IS NULL THEN
    RAISE EXCEPTION 'unknown package';
  END IF;

  SELECT * INTO v_sub FROM public.dealer_subscriptions
    WHERE user_id = v_user AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;

  IF v_sub.id IS NOT NULL THEN
    SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_sub.plan_id;
    SELECT
      COUNT(*) FILTER (WHERE package_code = 'turbo' AND source = 'included'),
      COUNT(*) FILTER (WHERE package_code = 'nitro' AND source = 'included')
      INTO v_used_turbo, v_used_nitro
    FROM public.boost_usage
    WHERE user_id = v_user
      AND starts_at >= v_sub.period_start
      AND starts_at < v_sub.period_end;

    IF _package_code = 'turbo' THEN
      v_included := COALESCE(v_plan.included_turbo, 0);
      v_used := v_used_turbo;
    ELSE
      v_included := COALESCE(v_plan.included_nitro, 0);
      v_used := v_used_nitro;
    END IF;
  END IF;

  IF v_sub.id IS NOT NULL AND v_used < v_included THEN
    v_source := 'included';
    v_price := 0;
  ELSE
    v_source := 'extra';
    v_price := v_pkg.price_cents;
  END IF;

  v_ends := now() + (v_pkg.duration_days || ' days')::interval;

  INSERT INTO public.boost_usage(user_id, listing_id, package_code, source, price_cents, duration_days, starts_at, ends_at)
  VALUES (v_user, _listing_id, _package_code, v_source, v_price, v_pkg.duration_days, now(), v_ends);

  UPDATE public.listings
    SET boost_until = GREATEST(COALESCE(boost_until, now()), v_ends)
    WHERE id = _listing_id;

  RETURN jsonb_build_object(
    'source', v_source,
    'price_cents', v_price,
    'ends_at', v_ends,
    'package_code', _package_code
  );
END;
$$;

REVOKE ALL ON FUNCTION public.activate_boost(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.activate_boost(uuid, text) TO authenticated;

-- Current billing helper
CREATE OR REPLACE FUNCTION public.get_current_billing(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.dealer_subscriptions%ROWTYPE;
  v_plan public.subscription_plans%ROWTYPE;
  v_extra int := 0;
  v_used_turbo int := 0;
  v_used_nitro int := 0;
  v_period_start timestamptz;
  v_period_end timestamptz;
BEGIN
  SELECT * INTO v_sub FROM public.dealer_subscriptions
    WHERE user_id = _user_id AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;

  IF v_sub.id IS NOT NULL THEN
    SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_sub.plan_id;
    v_period_start := v_sub.period_start;
    v_period_end := v_sub.period_end;
  ELSE
    v_period_start := date_trunc('month', now());
    v_period_end := v_period_start + interval '1 month';
  END IF;

  SELECT
    COALESCE(SUM(price_cents) FILTER (WHERE source = 'extra'), 0),
    COUNT(*) FILTER (WHERE package_code = 'turbo'),
    COUNT(*) FILTER (WHERE package_code = 'nitro')
    INTO v_extra, v_used_turbo, v_used_nitro
  FROM public.boost_usage
  WHERE user_id = _user_id
    AND starts_at >= v_period_start
    AND starts_at < v_period_end;

  RETURN jsonb_build_object(
    'plan_code', v_plan.code,
    'plan_name', v_plan.name,
    'base_cents', COALESCE(v_plan.monthly_price_cents, 0),
    'extra_cents', v_extra,
    'total_cents', COALESCE(v_plan.monthly_price_cents, 0) + v_extra,
    'included_turbo', COALESCE(v_plan.included_turbo, 0),
    'included_nitro', COALESCE(v_plan.included_nitro, 0),
    'used_turbo', v_used_turbo,
    'used_nitro', v_used_nitro,
    'period_start', v_period_start,
    'period_end', v_period_end
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_current_billing(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_current_billing(uuid) TO authenticated;
