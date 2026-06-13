-- =========================================================
-- SPRINT 1 DAY 1 — Security purge + DB hardening (.be domain)
-- =========================================================

-- ---------- 1. S2: Drop admin-by-email auto-assign ----------
DROP TRIGGER IF EXISTS on_auth_user_assign_admin ON auth.users;
DROP TRIGGER IF EXISTS assign_admin_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.assign_admin_on_signup();

-- Preserve existing admin@vatuur.be if already registered
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@vatuur.be'
ON CONFLICT DO NOTHING;

-- ---------- 2. S9: handle_new_user never trusts is_dealer from metadata ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, dealer_name, is_dealer, vat_number)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'dealer_name',
    false, -- never trust client metadata; admin promotes after verification
    NEW.raw_user_meta_data->>'vat_number'
  );
  RETURN NEW;
END;
$function$;

-- ---------- 3. S4: Profiles PII lockdown ----------
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profile fields readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Single permissive SELECT policy (row-level: everyone can see profile rows exist)
CREATE POLICY "Profile rows readable"
  ON public.profiles FOR SELECT
  USING (true);

-- Column-level lockdown: anon + authenticated can only read public-safe columns.
-- Private columns (email, phone, vat_number) require the get_my_profile() RPC.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, full_name, dealer_name, is_dealer, avatar_url,
  company_website, location, created_at, updated_at
) ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- Owners read their full profile (including PII) via this RPC
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Owners update their profile via existing UPDATE policy + this helper for column write
GRANT UPDATE (
  full_name, dealer_name, phone, avatar_url, company_website,
  location, vat_number, email
) ON public.profiles TO authenticated;

-- ---------- 4. B4: saved_searches UPDATE policy ----------
DROP POLICY IF EXISTS "Users can update own saved searches" ON public.saved_searches;
CREATE POLICY "Users can update own saved searches"
  ON public.saved_searches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------- 5. S7: Messages — column-level lockdown ----------
-- Existing UPDATE policy stays; column grants restrict what can be written.
REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;

-- ---------- 6. D2: Indexes ----------
CREATE INDEX IF NOT EXISTS idx_listings_status_created
  ON public.listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_user_id
  ON public.listings (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer
  ON public.conversations (buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller
  ON public.conversations (seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created
  ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user
  ON public.saved_searches (user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_leads_email
  ON public.vehicle_leads (email);
CREATE INDEX IF NOT EXISTS idx_favorites_user
  ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing
  ON public.favorites (listing_id);

-- ---------- 7. D3: FK constraints with cascade ----------
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.import_jobs
  DROP CONSTRAINT IF EXISTS import_jobs_user_id_fkey;
-- import_jobs.user_id may be NOT NULL; use CASCADE to avoid violation
ALTER TABLE public.import_jobs
  ADD CONSTRAINT import_jobs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ---------- 8. S5: listing-images storage hardening ----------
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own listing images" ON storage.objects;

CREATE POLICY "Users upload own listing images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
      lower(right(name, 4)) IN ('.jpg', '.png')
      OR lower(right(name, 5)) IN ('.jpeg', '.webp', '.avif')
    )
  );

-- Allow users to delete their own files
DROP POLICY IF EXISTS "Users delete own listing images" ON storage.objects;
CREATE POLICY "Users delete own listing images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read remains (bucket is public)
DROP POLICY IF EXISTS "Public read listing images" ON storage.objects;
CREATE POLICY "Public read listing images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'listing-images');

-- ---------- 9. rate_limits table (for Day 2 edge-function throttling) ----------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_endpoint_window
  ON public.rate_limits (key, endpoint, window_start DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
  ON public.rate_limits (created_at);

-- No grants to anon/authenticated — only service_role accesses this
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies means no access for anon/authenticated even if grants existed

-- Cleanup helper: delete rows older than 24h
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '24 hours';
$$;