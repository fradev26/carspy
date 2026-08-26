-- Nieuwe lead-RPC's afschermen: geen anonieme/public execute; helper volledig intern.
REVOKE EXECUTE ON FUNCTION public._can_manage_lead_actor(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_dealer_lead_status(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_lead_follow_up(text, uuid, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.snooze_lead(text, uuid, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.assign_lead(text, uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_lead_answered(text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._conversation_mark_answered_trg() FROM PUBLIC, anon, authenticated;