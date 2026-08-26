ALTER TABLE public.conversations ADD COLUMN status text NOT NULL DEFAULT 'in_progress';

CREATE OR REPLACE FUNCTION public.set_conversation_status(_conversation_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _status NOT IN ('new', 'in_progress', 'done') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  UPDATE public.conversations
     SET status = _status
   WHERE id = _conversation_id
     AND seller_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'conversation not found or not owned by caller';
  END IF;
END
$$;

REVOKE ALL ON FUNCTION public.set_conversation_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_conversation_status(uuid, text) TO authenticated;