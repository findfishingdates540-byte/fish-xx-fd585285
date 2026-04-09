
ALTER TABLE public.photo_challenge_entries
  ADD COLUMN captured_at timestamp with time zone DEFAULT now(),
  ADD COLUMN location_lat numeric,
  ADD COLUMN location_lng numeric;
