
-- Team-vs-team tournament mechanics

-- 1. Add team columns to tournament_matchups
ALTER TABLE public.tournament_matchups
  ADD COLUMN IF NOT EXISTS team1_id uuid REFERENCES public.fishing_teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team2_id uuid REFERENCES public.fishing_teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team1_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS team2_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS winner_team_id uuid REFERENCES public.fishing_teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tournament_matchups_team1 ON public.tournament_matchups(team1_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matchups_team2 ON public.tournament_matchups(team2_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matchups_winner_team ON public.tournament_matchups(winner_team_id);

-- 2. Tournament winner team
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS winner_team_id uuid REFERENCES public.fishing_teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tournaments_winner_team ON public.tournaments(winner_team_id);

-- 3. Helper: members of a team (captain + team_members)
CREATE OR REPLACE VIEW public.tournament_team_roster AS
SELECT tp.tournament_id, ft.id AS team_id, ft.captain_id AS user_id
FROM public.tournament_participants tp
JOIN public.fishing_teams ft ON ft.id = tp.team_id
UNION
SELECT tp.tournament_id, ft.id AS team_id, tm.user_id
FROM public.tournament_participants tp
JOIN public.fishing_teams ft ON ft.id = tp.team_id
JOIN public.team_members tm ON tm.team_id = ft.id;

-- 4. Per-tournament team leaderboard (cumulative across rounds)
CREATE OR REPLACE VIEW public.tournament_team_leaderboard AS
WITH team_rosters AS (
  SELECT DISTINCT tournament_id, team_id, user_id FROM public.tournament_team_roster
),
team_catches AS (
  SELECT
    tr.tournament_id,
    tr.team_id,
    COUNT(c.id)::int AS catches_count,
    COALESCE(SUM(c.weight_lbs), 0)::numeric AS total_weight,
    COALESCE(MAX(c.weight_lbs), 0)::numeric AS biggest_catch
  FROM team_rosters tr
  JOIN public.tournaments t ON t.id = tr.tournament_id
  LEFT JOIN public.catches c
    ON c.user_id = tr.user_id
   AND c.caught_at >= t.start_date
   AND (t.end_date IS NULL OR c.caught_at <= t.end_date)
  GROUP BY tr.tournament_id, tr.team_id
),
rounds_won AS (
  SELECT tournament_id, winner_team_id AS team_id, COUNT(*)::int AS rounds_won
  FROM public.tournament_matchups
  WHERE winner_team_id IS NOT NULL
  GROUP BY tournament_id, winner_team_id
)
SELECT
  tc.tournament_id,
  tc.team_id,
  ft.name AS team_name,
  ft.logo_url,
  ft.captain_id,
  CASE t.scoring_method
    WHEN 'biggest_catch' THEN tc.biggest_catch
    WHEN 'most_catches' THEN tc.catches_count::numeric
    ELSE tc.total_weight
  END AS total_score,
  tc.catches_count,
  tc.total_weight,
  tc.biggest_catch,
  COALESCE(rw.rounds_won, 0) AS rounds_won,
  EXISTS (
    SELECT 1 FROM public.tournament_participants tp
    WHERE tp.tournament_id = tc.tournament_id AND tp.team_id = tc.team_id AND tp.eliminated = true
  ) AS eliminated
FROM team_catches tc
JOIN public.tournaments t ON t.id = tc.tournament_id
JOIN public.fishing_teams ft ON ft.id = tc.team_id
LEFT JOIN rounds_won rw ON rw.tournament_id = tc.tournament_id AND rw.team_id = tc.team_id;

-- 5. Per-tournament member contributions
CREATE OR REPLACE VIEW public.tournament_member_contributions AS
SELECT
  tr.tournament_id,
  tr.team_id,
  tr.user_id,
  p.display_name,
  p.photos,
  COUNT(c.id)::int AS catches,
  COALESCE(SUM(c.weight_lbs), 0)::numeric AS total_weight,
  COALESCE(MAX(c.weight_lbs), 0)::numeric AS biggest_catch,
  CASE t.scoring_method
    WHEN 'biggest_catch' THEN COALESCE(MAX(c.weight_lbs), 0)
    WHEN 'most_catches' THEN COUNT(c.id)::numeric
    ELSE COALESCE(SUM(c.weight_lbs), 0)
  END AS score_contribution
FROM public.tournament_team_roster tr
JOIN public.tournaments t ON t.id = tr.tournament_id
JOIN public.profiles p ON p.id = tr.user_id
LEFT JOIN public.catches c
  ON c.user_id = tr.user_id
 AND c.caught_at >= t.start_date
 AND (t.end_date IS NULL OR c.caught_at <= t.end_date)
GROUP BY tr.tournament_id, tr.team_id, tr.user_id, p.display_name, p.photos, t.scoring_method;

-- 6. Per-tournament MVP leaderboard (top individuals across all teams)
CREATE OR REPLACE VIEW public.tournament_mvp_leaderboard AS
SELECT
  mc.tournament_id,
  mc.user_id,
  mc.display_name,
  mc.photos,
  mc.team_id,
  ft.name AS team_name,
  ft.logo_url AS team_logo,
  mc.score_contribution AS total_score,
  mc.catches,
  mc.total_weight,
  mc.biggest_catch
FROM public.tournament_member_contributions mc
JOIN public.fishing_teams ft ON ft.id = mc.team_id;

GRANT SELECT ON public.tournament_team_roster TO authenticated, anon;
GRANT SELECT ON public.tournament_team_leaderboard TO authenticated, anon;
GRANT SELECT ON public.tournament_member_contributions TO authenticated, anon;
GRANT SELECT ON public.tournament_mvp_leaderboard TO authenticated, anon;
