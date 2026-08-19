CREATE OR REPLACE FUNCTION public._audit_listings_trg()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid;
  v_label text;
BEGIN
  -- Weergaveteller-updates zijn machine-generated en horen niet in de audit log.
  IF TG_OP = 'UPDATE'
     AND NEW.views IS DISTINCT FROM OLD.views
     AND to_jsonb(NEW) - 'views' - 'updated_at' = to_jsonb(OLD) - 'views' - 'updated_at' THEN
    RETURN NEW;
  END IF;

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
END $function$;