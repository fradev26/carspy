CREATE TABLE public.listing_view_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  session_hash text NOT NULL,
  source text NOT NULL DEFAULT 'detail',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX listing_view_events_unique_daily
  ON public.listing_view_events (listing_id, day, session_hash);
CREATE INDEX listing_view_events_listing_day
  ON public.listing_view_events (listing_id, day DESC);

GRANT SELECT ON public.listing_view_events TO authenticated;
GRANT ALL ON public.listing_view_events TO service_role;

ALTER TABLE public.listing_view_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and company members can read view events"
ON public.listing_view_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_view_events.listing_id
      AND (
        l.user_id = auth.uid()
        OR (l.company_id IS NOT NULL AND l.company_id = public.current_company_id())
      )
  )
);