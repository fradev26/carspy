ALTER TABLE public.listings 
  ADD COLUMN is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN boost_until timestamp with time zone DEFAULT NULL;