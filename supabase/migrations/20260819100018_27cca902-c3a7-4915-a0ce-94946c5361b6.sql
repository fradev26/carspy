-- Dealer openingsuren
CREATE TABLE public.dealer_opening_hours (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  closed boolean NOT NULL DEFAULT false,
  opens time,
  closes time,
  break_start time,
  break_end time,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, weekday)
);

GRANT SELECT ON public.dealer_opening_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dealer_opening_hours TO authenticated;
GRANT ALL ON public.dealer_opening_hours TO service_role;

ALTER TABLE public.dealer_opening_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Opening hours are public"
  ON public.dealer_opening_hours FOR SELECT
  USING (true);

CREATE POLICY "Dealers manage their own opening hours"
  ON public.dealer_opening_hours FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Dealer reviews
CREATE TABLE public.dealer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text CHECK (title IS NULL OR char_length(title) <= 120),
  body text CHECK (body IS NULL OR char_length(body) <= 2000),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dealer_reviews_one_per_author UNIQUE (dealer_user_id, author_id),
  CONSTRAINT dealer_reviews_no_self_review CHECK (dealer_user_id <> author_id)
);

CREATE INDEX dealer_reviews_dealer_idx ON public.dealer_reviews (dealer_user_id, created_at DESC);

GRANT SELECT ON public.dealer_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dealer_reviews TO authenticated;
GRANT ALL ON public.dealer_reviews TO service_role;

ALTER TABLE public.dealer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published reviews are public"
  ON public.dealer_reviews FOR SELECT
  USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Users write their own review"
  ON public.dealer_reviews FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users edit their own review"
  ON public.dealer_reviews FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users delete their own review"
  ON public.dealer_reviews FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

CREATE TRIGGER dealer_reviews_updated_at
  BEFORE UPDATE ON public.dealer_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();