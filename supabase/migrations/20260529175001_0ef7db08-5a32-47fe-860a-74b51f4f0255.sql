
-- 1. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Admin policies on existing tables
CREATE POLICY "Admins can view all listings"
ON public.listings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert any listing"
ON public.listings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any listing"
ON public.listings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any listing"
ON public.listings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all conversations"
ON public.conversations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Import jobs
CREATE TABLE public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total INTEGER NOT NULL DEFAULT 0,
  succeeded INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  error_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_jobs TO authenticated;
GRANT ALL ON public.import_jobs TO service_role;

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage import jobs"
ON public.import_jobs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_import_jobs_updated_at
BEFORE UPDATE ON public.import_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. AutoScout sync config
CREATE TABLE public.autoscout_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_user_id UUID NOT NULL,
  autoscout_dealer_id TEXT NOT NULL,
  api_key_secret_ref TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  frequency_minutes INTEGER NOT NULL DEFAULT 60,
  last_sync_at TIMESTAMPTZ,
  last_status TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dealer_user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.autoscout_sync_config TO authenticated;
GRANT ALL ON public.autoscout_sync_config TO service_role;

ALTER TABLE public.autoscout_sync_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage autoscout configs"
ON public.autoscout_sync_config FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_autoscout_sync_config_updated_at
BEFORE UPDATE ON public.autoscout_sync_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. External ID on listings for upsert matching
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS external_source TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS listings_external_source_id_unique
  ON public.listings (external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

-- 6. Auto-assign admin role to admin@vatuur.be on signup
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'admin@vatuur.be' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_assign_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_admin_on_signup();
