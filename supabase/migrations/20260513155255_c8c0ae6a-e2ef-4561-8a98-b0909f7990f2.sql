
-- Tournaments are now team-based: add team_id to participants
ALTER TABLE public.tournament_participants
  ADD COLUMN IF NOT EXISTS team_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS tournament_participants_tournament_team_unique
  ON public.tournament_participants (tournament_id, team_id)
  WHERE team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS tournament_participants_team_idx
  ON public.tournament_participants (team_id);
