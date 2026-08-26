-- Opvolgwerkplek voor leads: follow-up, snooze, answered-tracking en toewijzing.

-- 1. Nieuwe kolommen op beide leadbronnen
ALTER TABLE public.dealer_leads
  ADD COLUMN IF NOT EXISTS follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz,
  ADD COLUMN IF NOT EXISTS answered_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.company_members(id) ON DELETE SET NULL;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz,
  ADD COLUMN IF NOT EXISTS answered_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.company_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS dealer_leads_follow_up_at_idx ON public.dealer_leads (follow_up_at) WHERE follow_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS conversations_follow_up_at_idx ON public.conversations (follow_up_at) WHERE follow_up_at IS NOT NULL;

-- 2. Helper: mag de huidige gebruiker leads van deze dealer beheren?
CREATE OR REPLACE FUNCTION public._can_manage_lead_actor(_dealer_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    _dealer_user_id = auth.uid()
    OR (
      public.can_view_leads(auth.uid())
      AND (SELECT company_id FROM public.profiles WHERE id = _dealer_user_id) IS NOT NULL
      AND (SELECT company_id FROM public.profiles WHERE id = _dealer_user_id) = public.current_company_id()
    )
  );
$$;

-- 3. Bestaande status-RPC verruimen met de nieuwe statussen
CREATE OR REPLACE FUNCTION public.set_conversation_status(_conversation_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _status NOT IN ('new', 'in_progress', 'waiting_customer', 'scheduled', 'done') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  UPDATE public.conversations
     SET status = _status
   WHERE id = _conversation_id
     AND public._can_manage_lead_actor(seller_id);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'conversation not found or not owned by caller';
  END IF;
END
$function$;

-- 4. Status-RPC voor contactaanvragen (zelfde patroon)
CREATE OR REPLACE FUNCTION public.set_dealer_lead_status(_lead_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _status NOT IN ('new', 'in_progress', 'waiting_customer', 'scheduled', 'done') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  UPDATE public.dealer_leads
     SET status = _status
   WHERE id = _lead_id
     AND public._can_manage_lead_actor(dealer_user_id);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead not found or not owned by caller';
  END IF;
END
$function$;

-- 5. Follow-up inplannen (null = wissen). Zet status op 'scheduled' bij een datum.
CREATE OR REPLACE FUNCTION public.set_lead_follow_up(_kind text, _id uuid, _follow_up_at timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _kind = 'conversation' THEN
    UPDATE public.conversations
       SET follow_up_at = _follow_up_at,
           snoozed_until = NULL,
           status = CASE WHEN _follow_up_at IS NOT NULL THEN 'scheduled' ELSE status END
     WHERE id = _id AND public._can_manage_lead_actor(seller_id);
  ELSIF _kind = 'lead' THEN
    UPDATE public.dealer_leads
       SET follow_up_at = _follow_up_at,
           snoozed_until = NULL,
           status = CASE WHEN _follow_up_at IS NOT NULL THEN 'scheduled' ELSE status END
     WHERE id = _id AND public._can_manage_lead_actor(dealer_user_id);
  ELSE
    RAISE EXCEPTION 'invalid kind';
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead not found or not owned by caller';
  END IF;
  PERFORM public.log_audit_event('lead_follow_up_set', 'leads', _kind, _id::text, NULL,
    jsonb_build_object('follow_up_at', _follow_up_at), NULL, NULL);
END
$function$;

-- 6. Snoozen tot een tijdstip (null = snooze opheffen)
CREATE OR REPLACE FUNCTION public.snooze_lead(_kind text, _id uuid, _until timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _kind = 'conversation' THEN
    UPDATE public.conversations SET snoozed_until = _until
     WHERE id = _id AND public._can_manage_lead_actor(seller_id);
  ELSIF _kind = 'lead' THEN
    UPDATE public.dealer_leads SET snoozed_until = _until
     WHERE id = _id AND public._can_manage_lead_actor(dealer_user_id);
  ELSE
    RAISE EXCEPTION 'invalid kind';
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead not found or not owned by caller';
  END IF;
  PERFORM public.log_audit_event('lead_snoozed', 'leads', _kind, _id::text, NULL,
    jsonb_build_object('snoozed_until', _until), NULL, NULL);
END
$function$;

-- 7. Toewijzen aan een verkoper (company_member) van het eigen bedrijf
CREATE OR REPLACE FUNCTION public.assign_lead(_kind text, _id uuid, _member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _company uuid := public.current_company_id();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _member_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.company_members m
     WHERE m.id = _member_id AND m.company_id = _company AND m.status = 'active'
  ) THEN
    RAISE EXCEPTION 'member not found in your company';
  END IF;
  IF _kind = 'conversation' THEN
    UPDATE public.conversations SET assigned_to = _member_id
     WHERE id = _id AND public._can_manage_lead_actor(seller_id);
  ELSIF _kind = 'lead' THEN
    UPDATE public.dealer_leads SET assigned_to = _member_id
     WHERE id = _id AND public._can_manage_lead_actor(dealer_user_id);
  ELSE
    RAISE EXCEPTION 'invalid kind';
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead not found or not owned by caller';
  END IF;
  PERFORM public.log_audit_event('lead_assigned', 'leads', _kind, _id::text, NULL,
    jsonb_build_object('assigned_to', _member_id), NULL, NULL);
END
$function$;

-- 8. Markeer als beantwoord (bijv. na bellen/mailen vanuit de UI)
CREATE OR REPLACE FUNCTION public.mark_lead_answered(_kind text, _id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _kind = 'conversation' THEN
    UPDATE public.conversations SET answered_at = COALESCE(answered_at, now())
     WHERE id = _id AND public._can_manage_lead_actor(seller_id);
  ELSIF _kind = 'lead' THEN
    UPDATE public.dealer_leads SET answered_at = COALESCE(answered_at, now())
     WHERE id = _id AND public._can_manage_lead_actor(dealer_user_id);
  ELSE
    RAISE EXCEPTION 'invalid kind';
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead not found or not owned by caller';
  END IF;
END
$function$;

-- 9. Automatisch: eerste bericht van de verkoper markeert het gesprek als beantwoord
CREATE OR REPLACE FUNCTION public._conversation_mark_answered_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.conversations c
     SET answered_at = now()
   WHERE c.id = NEW.conversation_id
     AND c.answered_at IS NULL
     AND c.seller_id = NEW.sender_id;
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS conversation_mark_answered ON public.messages;
CREATE TRIGGER conversation_mark_answered
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public._conversation_mark_answered_trg();

-- 10. Execute-rechten voor de app
GRANT EXECUTE ON FUNCTION public.set_dealer_lead_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_lead_follow_up(text, uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.snooze_lead(text, uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_lead(text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_lead_answered(text, uuid) TO authenticated;