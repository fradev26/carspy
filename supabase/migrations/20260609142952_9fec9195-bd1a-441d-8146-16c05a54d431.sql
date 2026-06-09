
CREATE TABLE public.marketing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page TEXT,
  email TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.marketing_events TO anon, authenticated;
GRANT SELECT ON public.marketing_events TO authenticated;
GRANT ALL ON public.marketing_events TO service_role;

ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert marketing events"
  ON public.marketing_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view marketing events"
  ON public.marketing_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_marketing_events_event_name ON public.marketing_events(event_name);
CREATE INDEX idx_marketing_events_session_id ON public.marketing_events(session_id);
CREATE INDEX idx_marketing_events_created_at ON public.marketing_events(created_at DESC);
