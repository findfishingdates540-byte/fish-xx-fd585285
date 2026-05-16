ALTER TABLE public.fishing_teams
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS rules text;