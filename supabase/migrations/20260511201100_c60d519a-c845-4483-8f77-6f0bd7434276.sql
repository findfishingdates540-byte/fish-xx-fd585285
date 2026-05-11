ALTER TABLE public.fishing_teams 
  ADD COLUMN IF NOT EXISTS team_type text NOT NULL DEFAULT 'team',
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.fishing_teams DROP CONSTRAINT IF EXISTS fishing_teams_team_type_check;
ALTER TABLE public.fishing_teams ADD CONSTRAINT fishing_teams_team_type_check CHECK (team_type IN ('team','charter'));