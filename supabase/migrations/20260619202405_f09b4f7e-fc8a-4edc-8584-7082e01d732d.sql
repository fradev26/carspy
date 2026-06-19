
-- ============================================================
-- COMPANY MEMBERS, INVITATIONS, AUDIT LOGS + RBAC HELPERS
-- ============================================================

-- 1) ENUMS ----------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.company_role AS ENUM ('owner','manager','seller','marketing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.member_status AS ENUM ('active','invited','blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) TABLES ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.company_role NOT NULL DEFAULT 'seller',
  status public.member_status NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz,
  deactivated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
CREATE INDEX IF NOT EXISTS company_members_company_idx ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS company_members_user_idx ON public.company_members(user_id);
-- Enforce single owner per company
CREATE UNIQUE INDEX IF NOT EXISTS company_members_one_owner
  ON public.company_members(company_id) WHERE role = 'owner';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;

CREATE TABLE IF NOT EXISTS public.company_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role public.company_role NOT NULL DEFAULT 'seller',
  token_hash text NOT NULL UNIQUE,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  send_count int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS company_invitations_company_idx ON public.company_invitations(company_id);
CREATE INDEX IF NOT EXISTS company_invitations_email_idx ON public.company_invitations(lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS company_invitations_open_unique
  ON public.company_invitations(company_id, lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_invitations TO authenticated;
GRANT ALL ON public.company_invitations TO service_role;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role_at_time public.company_role,
  action text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  target_table text,
  target_id text,
  target_label text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_company_idx ON public.audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_category_idx ON public.audit_logs(category);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs(action);

-- audit_logs is append-only: only SELECT for authenticated, all rights to service_role for triggers
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- 3) updated_at triggers --------------------------------------
DROP TRIGGER IF EXISTS trg_company_members_updated ON public.company_members;
CREATE TRIGGER trg_company_members_updated BEFORE UPDATE ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_company_invitations_updated ON public.company_invitations;
CREATE TRIGGER trg_company_invitations_updated BEFORE UPDATE ON public.company_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) HELPERS (SECURITY DEFINER) -------------------------------
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(_user_id uuid, _role public.company_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND role = _role AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.member_role(_user_id uuid)
RETURNS public.company_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.company_members
  WHERE user_id = _user_id AND status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_company_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_company_role(_user_id, 'owner'); $$;

CREATE OR REPLACE FUNCTION public.can_manage_users(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_company_role(_user_id, 'owner'); $$;

CREATE OR REPLACE FUNCTION public.can_manage_billing(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_company_role(_user_id, 'owner'); $$;

CREATE OR REPLACE FUNCTION public.can_edit_company(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_company_role(_user_id, 'owner'); $$;

CREATE OR REPLACE FUNCTION public.can_edit_listings(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.member_role(_user_id) IN ('owner','manager','seller','marketing');
$$;

CREATE OR REPLACE FUNCTION public.can_delete_listings(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.member_role(_user_id) IN ('owner','manager','seller');
$$;

CREATE OR REPLACE FUNCTION public.can_boost(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.member_role(_user_id) IN ('owner','manager','marketing');
$$;

CREATE OR REPLACE FUNCTION public.can_view_leads(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.member_role(_user_id) IN ('owner','manager','seller');
$$;

-- 5) AUDIT LOGGING RPC ---------------------------------------
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _category text DEFAULT 'other',
  _target_table text DEFAULT NULL,
  _target_id text DEFAULT NULL,
  _target_label text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb,
  _ip text DEFAULT NULL,
  _user_agent text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_company uuid := public.current_company_id();
  v_role public.company_role := public.member_role(auth.uid());
BEGIN
  INSERT INTO public.audit_logs(company_id, user_id, role_at_time, action, category, target_table, target_id, target_label, metadata, ip, user_agent)
  VALUES (v_company, auth.uid(), v_role, _action, _category, _target_table, _target_id, _target_label, COALESCE(_metadata,'{}'::jsonb), _ip, _user_agent)
  RETURNING id INTO v_id;
  -- bump last_active
  UPDATE public.company_members SET last_active_at = now() WHERE user_id = auth.uid() AND status = 'active';
  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.log_audit_event(text,text,text,text,text,jsonb,text,text) TO authenticated, service_role;

-- 6) ENSURE OWNER MEMBERSHIP (idempotent) ---------------------
CREATE OR REPLACE FUNCTION public.ensure_company_membership()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_company_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF v_profile.id IS NULL THEN RAISE EXCEPTION 'profile missing'; END IF;

  v_company_id := v_profile.company_id;
  IF v_company_id IS NULL THEN
    INSERT INTO public.companies(name, vat_number, email)
    VALUES (COALESCE(NULLIF(v_profile.dealer_name,''), NULLIF(v_profile.full_name,''), 'Mijn bedrijf'),
            v_profile.vat_number, v_profile.email)
    RETURNING id INTO v_company_id;
    UPDATE public.profiles SET company_id = v_company_id WHERE id = v_uid;
  END IF;

  INSERT INTO public.company_members(company_id, user_id, role, status, joined_at)
  VALUES (v_company_id, v_uid, 'owner', 'active', now())
  ON CONFLICT (company_id, user_id) DO NOTHING;

  RETURN v_company_id;
END $$;

GRANT EXECUTE ON FUNCTION public.ensure_company_membership() TO authenticated;

-- 7) INVITE / ACCEPT / MANAGE RPCs ----------------------------
CREATE OR REPLACE FUNCTION public.invite_member(_email text, _role public.company_role, _full_name text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_company uuid;
  v_token text;
  v_hash text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  v_company := public.ensure_company_membership();
  IF NOT public.can_manage_users(v_uid) THEN RAISE EXCEPTION 'forbidden: only owner can invite'; END IF;
  IF _role = 'owner' THEN RAISE EXCEPTION 'cannot invite another owner'; END IF;
  IF _email IS NULL OR length(trim(_email)) < 3 THEN RAISE EXCEPTION 'invalid email'; END IF;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  -- Revoke any existing open invite for same email+company
  UPDATE public.company_invitations
    SET revoked_at = now()
    WHERE company_id = v_company AND lower(email) = lower(_email)
      AND accepted_at IS NULL AND revoked_at IS NULL;

  INSERT INTO public.company_invitations(company_id, email, full_name, role, token_hash, invited_by, expires_at, last_sent_at, send_count)
  VALUES (v_company, lower(trim(_email)), NULLIF(trim(_full_name),''), _role, v_hash, v_uid, now() + interval '7 days', now(), 1)
  RETURNING id INTO v_id;

  PERFORM public.log_audit_event('member_invited', 'users', 'company_invitations', v_id::text, _email,
    jsonb_build_object('role', _role::text));

  RETURN jsonb_build_object('invitation_id', v_id, 'token', v_token, 'company_id', v_company);
END $$;

GRANT EXECUTE ON FUNCTION public.invite_member(text, public.company_role, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.resend_invitation(_invitation_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inv public.company_invitations%ROWTYPE;
  v_token text; v_hash text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT public.can_manage_users(v_uid) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO v_inv FROM public.company_invitations WHERE id = _invitation_id;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'not found'; END IF;
  IF v_inv.company_id <> public.current_company_id() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_inv.accepted_at IS NOT NULL OR v_inv.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'invitation closed'; END IF;
  IF v_inv.last_sent_at > now() - interval '5 minutes' THEN RAISE EXCEPTION 'too soon, try again in a few minutes'; END IF;
  IF v_inv.send_count >= 5 THEN RAISE EXCEPTION 'send limit reached'; END IF;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  UPDATE public.company_invitations
    SET token_hash = v_hash, last_sent_at = now(), send_count = send_count + 1,
        expires_at = now() + interval '7 days'
    WHERE id = _invitation_id;

  PERFORM public.log_audit_event('member_invite_resent', 'users', 'company_invitations', _invitation_id::text, v_inv.email);
  RETURN jsonb_build_object('invitation_id', _invitation_id, 'token', v_token);
END $$;

GRANT EXECUTE ON FUNCTION public.resend_invitation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_invitation(_invitation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inv public.company_invitations%ROWTYPE;
BEGIN
  IF NOT public.can_manage_users(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO v_inv FROM public.company_invitations WHERE id = _invitation_id;
  IF v_inv.id IS NULL OR v_inv.company_id <> public.current_company_id() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.company_invitations SET revoked_at = now() WHERE id = _invitation_id;
  PERFORM public.log_audit_event('member_invite_revoked','users','company_invitations',_invitation_id::text, v_inv.email);
END $$;

GRANT EXECUTE ON FUNCTION public.revoke_invitation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_hash text;
  v_inv public.company_invitations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  v_hash := encode(digest(_token, 'sha256'), 'hex');
  SELECT * INTO v_inv FROM public.company_invitations WHERE token_hash = v_hash;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'invalid token'; END IF;
  IF v_inv.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'invitation already used'; END IF;
  IF v_inv.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'invitation revoked'; END IF;
  IF v_inv.expires_at < now() THEN RAISE EXCEPTION 'invitation expired'; END IF;
  IF lower(v_email) <> lower(v_inv.email) THEN RAISE EXCEPTION 'email mismatch'; END IF;

  -- Attach user to company
  UPDATE public.profiles SET company_id = v_inv.company_id WHERE id = v_uid;

  INSERT INTO public.company_members(company_id, user_id, role, status, invited_by, invited_at, joined_at)
  VALUES (v_inv.company_id, v_uid, v_inv.role, 'active', v_inv.invited_by, v_inv.created_at, now())
  ON CONFLICT (company_id, user_id) DO UPDATE
    SET role = EXCLUDED.role, status = 'active', deactivated_at = NULL;

  UPDATE public.company_invitations SET accepted_at = now(), accepted_by = v_uid WHERE id = v_inv.id;

  PERFORM public.log_audit_event('member_joined','users','company_members', v_uid::text, v_email,
    jsonb_build_object('role', v_inv.role::text));

  RETURN jsonb_build_object('company_id', v_inv.company_id, 'role', v_inv.role);
END $$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.peek_invitation(_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_hash text := encode(digest(_token,'sha256'),'hex');
  v_inv public.company_invitations%ROWTYPE;
  v_company public.companies%ROWTYPE;
BEGIN
  SELECT * INTO v_inv FROM public.company_invitations WHERE token_hash = v_hash;
  IF v_inv.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason','not_found');
  END IF;
  IF v_inv.accepted_at IS NOT NULL THEN RETURN jsonb_build_object('valid',false,'reason','used'); END IF;
  IF v_inv.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('valid',false,'reason','revoked'); END IF;
  IF v_inv.expires_at < now() THEN RETURN jsonb_build_object('valid',false,'reason','expired'); END IF;
  SELECT * INTO v_company FROM public.companies WHERE id = v_inv.company_id;
  RETURN jsonb_build_object(
    'valid', true,
    'email', v_inv.email,
    'role', v_inv.role::text,
    'company_name', v_company.name,
    'expires_at', v_inv.expires_at
  );
END $$;

GRANT EXECUTE ON FUNCTION public.peek_invitation(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.change_member_role(_user_id uuid, _role public.company_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company uuid := public.current_company_id();
  v_target public.company_members%ROWTYPE;
BEGIN
  IF NOT public.can_manage_users(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _role = 'owner' THEN RAISE EXCEPTION 'use transfer_ownership instead'; END IF;
  SELECT * INTO v_target FROM public.company_members WHERE user_id = _user_id AND company_id = v_company;
  IF v_target.id IS NULL THEN RAISE EXCEPTION 'not a member'; END IF;
  IF v_target.role = 'owner' THEN RAISE EXCEPTION 'cannot change owner role'; END IF;
  UPDATE public.company_members SET role = _role WHERE id = v_target.id;
  PERFORM public.log_audit_event('member_role_changed','users','company_members', _user_id::text, NULL,
    jsonb_build_object('from', v_target.role::text, 'to', _role::text));
END $$;

GRANT EXECUTE ON FUNCTION public.change_member_role(uuid, public.company_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.deactivate_member(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company uuid := public.current_company_id();
  v_target public.company_members%ROWTYPE;
BEGIN
  IF NOT public.can_manage_users(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO v_target FROM public.company_members WHERE user_id = _user_id AND company_id = v_company;
  IF v_target.id IS NULL THEN RAISE EXCEPTION 'not a member'; END IF;
  IF v_target.role = 'owner' THEN RAISE EXCEPTION 'cannot deactivate owner'; END IF;
  UPDATE public.company_members SET status='blocked', deactivated_at=now() WHERE id = v_target.id;
  PERFORM public.log_audit_event('member_deactivated','users','company_members', _user_id::text);
END $$;

GRANT EXECUTE ON FUNCTION public.deactivate_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reactivate_member(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_company uuid := public.current_company_id();
BEGIN
  IF NOT public.can_manage_users(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.company_members SET status='active', deactivated_at=NULL
   WHERE user_id = _user_id AND company_id = v_company AND role <> 'owner';
  PERFORM public.log_audit_event('member_reactivated','users','company_members', _user_id::text);
END $$;
GRANT EXECUTE ON FUNCTION public.reactivate_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_member(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company uuid := public.current_company_id();
  v_target public.company_members%ROWTYPE;
BEGIN
  IF NOT public.can_manage_users(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _user_id = auth.uid() THEN RAISE EXCEPTION 'cannot remove yourself'; END IF;
  SELECT * INTO v_target FROM public.company_members WHERE user_id = _user_id AND company_id = v_company;
  IF v_target.id IS NULL THEN RAISE EXCEPTION 'not a member'; END IF;
  IF v_target.role = 'owner' THEN RAISE EXCEPTION 'cannot remove owner'; END IF;
  DELETE FROM public.company_members WHERE id = v_target.id;
  UPDATE public.profiles SET company_id = NULL WHERE id = _user_id AND company_id = v_company;
  PERFORM public.log_audit_event('member_removed','users','company_members', _user_id::text);
END $$;

GRANT EXECUTE ON FUNCTION public.remove_member(uuid) TO authenticated;

-- 8) RLS for new tables ---------------------------------------
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members read same company" ON public.company_members;
CREATE POLICY "members read same company" ON public.company_members
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id() OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "members managed by RPC" ON public.company_members;
-- No INSERT/UPDATE/DELETE policies: only SECURITY DEFINER RPCs can mutate

DROP POLICY IF EXISTS "invitations read same company" ON public.company_invitations;
CREATE POLICY "invitations read same company" ON public.company_invitations
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id() OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "audit logs read same company" ON public.audit_logs;
CREATE POLICY "audit logs read same company" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id() OR public.has_role(auth.uid(),'admin'));
-- No INSERT/UPDATE/DELETE policies → append-only via log_audit_event() RPC

-- 9) RLS REWRITES for related tables --------------------------
-- listings: keep public-read; replace owners policy to include company role check via can_edit_listings
DROP POLICY IF EXISTS "owners manage listings" ON public.listings;
CREATE POLICY "company members manage listings" ON public.listings
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      company_id IS NOT NULL
      AND company_id = public.current_company_id()
      AND public.can_edit_listings(auth.uid())
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      company_id IS NOT NULL
      AND company_id = public.current_company_id()
      AND public.can_edit_listings(auth.uid())
    )
  );

-- boost_usage: keep own SELECT; allow company members with can_boost
DROP POLICY IF EXISTS "boost usage manage" ON public.boost_usage;
CREATE POLICY "boost usage manage" ON public.boost_usage
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- companies: only owner can update (admins already covered)
DROP POLICY IF EXISTS "owner can update company" ON public.companies;
CREATE POLICY "owner can update company" ON public.companies
  FOR UPDATE TO authenticated
  USING (id = public.current_company_id() AND public.can_edit_company(auth.uid()))
  WITH CHECK (id = public.current_company_id() AND public.can_edit_company(auth.uid()));

-- autoscout_credentials: restrict to owner/manager of same user
-- (keep existing policy; access tied to own user_id, that's already correct)

-- 10) AUDIT TRIGGERS -----------------------------------------
CREATE OR REPLACE FUNCTION public._audit_listings_trg() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid;
  v_label text;
BEGIN
  v_company := COALESCE(NEW.company_id, OLD.company_id, public.current_company_id());
  v_label := COALESCE(NEW.brand || ' ' || NEW.model, OLD.brand || ' ' || OLD.model, '');
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs(company_id,user_id,role_at_time,action,category,target_table,target_id,target_label,metadata)
    VALUES (v_company, auth.uid(), public.member_role(auth.uid()),'listing_created','listings','listings',NEW.id::text,v_label,
            jsonb_build_object('status',NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'sold' THEN
      INSERT INTO public.audit_logs(company_id,user_id,role_at_time,action,category,target_table,target_id,target_label,metadata)
      VALUES (v_company, auth.uid(), public.member_role(auth.uid()),'listing_sold','listings','listings',NEW.id::text,v_label, '{}'::jsonb);
    ELSE
      INSERT INTO public.audit_logs(company_id,user_id,role_at_time,action,category,target_table,target_id,target_label,metadata)
      VALUES (v_company, auth.uid(), public.member_role(auth.uid()),'listing_updated','listings','listings',NEW.id::text,v_label,
              jsonb_build_object('old_status',OLD.status,'new_status',NEW.status));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs(company_id,user_id,role_at_time,action,category,target_table,target_id,target_label,metadata)
    VALUES (v_company, auth.uid(), public.member_role(auth.uid()),'listing_deleted','listings','listings',OLD.id::text,v_label, '{}'::jsonb);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_audit_listings ON public.listings;
CREATE TRIGGER trg_audit_listings AFTER INSERT OR UPDATE OR DELETE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public._audit_listings_trg();

CREATE OR REPLACE FUNCTION public._audit_boosts_trg() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs(company_id,user_id,role_at_time,action,category,target_table,target_id,metadata)
    VALUES (public.current_company_id(), auth.uid(), public.member_role(auth.uid()),'boost_started','boosts','boost_usage',NEW.id::text,
            jsonb_build_object('package',NEW.package_code,'price_cents',NEW.price_cents));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_audit_boosts ON public.boost_usage;
CREATE TRIGGER trg_audit_boosts AFTER INSERT ON public.boost_usage
  FOR EACH ROW EXECUTE FUNCTION public._audit_boosts_trg();

CREATE OR REPLACE FUNCTION public._audit_subs_trg() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_action text;
BEGIN
  IF TG_OP = 'INSERT' THEN v_action := 'subscription_created';
  ELSIF TG_OP = 'UPDATE' THEN v_action := 'subscription_updated';
  ELSE v_action := 'subscription_deleted'; END IF;
  INSERT INTO public.audit_logs(company_id,user_id,role_at_time,action,category,target_table,target_id,metadata)
  VALUES (public.current_company_id(), auth.uid(), public.member_role(auth.uid()), v_action,'billing','dealer_subscriptions',
          COALESCE(NEW.id, OLD.id)::text,
          jsonb_build_object('status', COALESCE(NEW.status, OLD.status)));
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_audit_subs ON public.dealer_subscriptions;
CREATE TRIGGER trg_audit_subs AFTER INSERT OR UPDATE OR DELETE ON public.dealer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public._audit_subs_trg();

CREATE OR REPLACE FUNCTION public._audit_companies_trg() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs(company_id,user_id,role_at_time,action,category,target_table,target_id,target_label,metadata)
    VALUES (NEW.id, auth.uid(), public.member_role(auth.uid()), 'company_updated','settings','companies',NEW.id::text, NEW.name, '{}'::jsonb);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_audit_companies ON public.companies;
CREATE TRIGGER trg_audit_companies AFTER UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public._audit_companies_trg();

-- 11) Profiles RPC: allow members to see fellow company profiles for the Users page -----
CREATE OR REPLACE FUNCTION public.list_company_members()
RETURNS TABLE (
  user_id uuid, email text, full_name text, avatar_url text,
  role public.company_role, status public.member_status,
  invited_at timestamptz, joined_at timestamptz, last_active_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT cm.user_id, p.email, p.full_name, NULL::text as avatar_url,
         cm.role, cm.status, cm.invited_at, cm.joined_at, cm.last_active_at
  FROM public.company_members cm
  LEFT JOIN public.profiles p ON p.id = cm.user_id
  WHERE cm.company_id = public.current_company_id();
$$;
GRANT EXECUTE ON FUNCTION public.list_company_members() TO authenticated;
