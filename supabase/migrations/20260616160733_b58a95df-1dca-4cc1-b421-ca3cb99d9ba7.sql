CREATE OR REPLACE FUNCTION public.autoscout_save_password(_user_id uuid, _password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  existing_id uuid;
  new_id uuid;
BEGIN
  SELECT password_secret_id INTO existing_id
    FROM public.autoscout_credentials
    WHERE user_id = _user_id;

  IF existing_id IS NOT NULL THEN
    PERFORM vault.update_secret(existing_id, _password);
    RETURN existing_id;
  END IF;

  SELECT vault.create_secret(_password, 'autoscout_' || _user_id::text, 'AutoScout24 password') INTO new_id;
  RETURN new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.autoscout_save_password(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.autoscout_save_password(uuid, text) TO service_role;