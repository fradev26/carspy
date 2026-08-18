-- 1) public_profiles view: switch to security invoker + safe column exposure
REVOKE SELECT (email, phone, vat_number, company_id, theme_preference) ON public.profiles FROM authenticated;
GRANT SELECT (id, full_name, dealer_name, is_dealer, avatar_url, company_website, location, created_at, updated_at) ON public.profiles TO authenticated, anon;

DROP POLICY IF EXISTS "Public profile basics are readable" ON public.profiles;
CREATE POLICY "Public profile basics are readable"
ON public.profiles FOR SELECT TO anon, authenticated
USING (true);

ALTER VIEW public.public_profiles SET (security_invoker = on);
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2) messages: restrict UPDATE to the read_at column only
REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;

DROP POLICY IF EXISTS "Users can update read status" ON public.messages;
CREATE POLICY "Users can update read status"
ON public.messages FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
));