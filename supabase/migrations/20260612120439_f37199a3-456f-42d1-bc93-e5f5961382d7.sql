
ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'daily';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  new_messages boolean NOT NULL DEFAULT true,
  search_alerts boolean NOT NULL DEFAULT true,
  listing_status boolean NOT NULL DEFAULT true,
  system boolean NOT NULL DEFAULT true,
  marketing boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notif prefs select" ON public.notification_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notif prefs insert" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notif prefs update" ON public.notification_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER notif_prefs_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.privacy_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  profile_public boolean NOT NULL DEFAULT true,
  show_contact boolean NOT NULL DEFAULT false,
  marketing_consent boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.privacy_preferences TO authenticated;
GRANT ALL ON public.privacy_preferences TO service_role;
ALTER TABLE public.privacy_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own privacy prefs select" ON public.privacy_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own privacy prefs insert" ON public.privacy_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own privacy prefs update" ON public.privacy_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER privacy_prefs_updated_at BEFORE UPDATE ON public.privacy_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.support_messages TO anon, authenticated;
GRANT SELECT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can send support message" ON public.support_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read support messages" ON public.support_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
