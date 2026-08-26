ALTER TABLE public.dealer_leads REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dealer_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;