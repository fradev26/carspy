CREATE OR REPLACE FUNCTION public._audit_lead_status_trg()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.audit_logs(company_id, user_id, role_at_time, action, category, target_table, target_id, target_label, metadata)
    VALUES (
      COALESCE(NEW.company_id, public.current_company_id()),
      auth.uid(),
      public.member_role(auth.uid()),
      'lead_status_changed',
      'leads',
      TG_TABLE_NAME,
      NEW.id::text,
      CASE WHEN TG_TABLE_NAME = 'dealer_leads' THEN NEW.name ELSE NULL END,
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END
$function$;

REVOKE EXECUTE ON FUNCTION public._audit_lead_status_trg() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_audit_dealer_lead_status
  AFTER UPDATE ON public.dealer_leads
  FOR EACH ROW EXECUTE FUNCTION public._audit_lead_status_trg();

CREATE TRIGGER trg_audit_conversation_status
  AFTER UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public._audit_lead_status_trg();