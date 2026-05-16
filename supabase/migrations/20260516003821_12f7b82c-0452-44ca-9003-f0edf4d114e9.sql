
-- Helpful index for the new views
CREATE INDEX IF NOT EXISTS idx_tournament_matchups_tournament_round
  ON public.tournament_matchups (tournament_id, round_id);

-- Per-round team scores with opponent + result
CREATE OR REPLACE VIEW public.tournament_team_round_scores
WITH (security_invoker = true) AS
SELECT
  m.tournament_id,
  m.round_id,
  r.round_number,
  r.round_name,
  r.bracket_type,
  m.id AS matchup_id,
  m.matchup_number,
  m.status AS matchup_status,
  t.id AS team_id,
  CASE WHEN m.team1_id = t.id THEN m.team1_score ELSE m.team2_score END AS score,
  CASE WHEN m.team1_id = t.id THEN m.team2_id ELSE m.team1_id END AS opponent_team_id,
  CASE
    WHEN m.status <> 'completed' THEN 'pending'
    WHEN m.winner_team_id IS NULL THEN 'pending'
    WHEN m.winner_team_id = t.id THEN 'won'
    ELSE 'lost'
  END AS result
FROM public.tournament_matchups m
JOIN public.tournament_rounds r ON r.id = m.round_id
JOIN public.fishing_teams t
  ON t.id = m.team1_id OR t.id = m.team2_id
WHERE m.team1_id IS NOT NULL OR m.team2_id IS NOT NULL;

-- Top contributor on the winning team per completed matchup
CREATE OR REPLACE VIEW public.tournament_matchup_mvps
WITH (security_invoker = true) AS
WITH win AS (
  SELECT
    m.tournament_id,
    m.id AS matchup_id,
    m.round_id,
    m.matchup_number,
    m.winner_team_id,
    r.round_number,
    r.round_name,
    r.start_date AS round_start,
    r.end_date AS round_end,
    t.scoring_method
  FROM public.tournament_matchups m
  JOIN public.tournament_rounds r ON r.id = m.round_id
  JOIN public.tournaments t ON t.id = m.tournament_id
  WHERE m.status = 'completed' AND m.winner_team_id IS NOT NULL
),
contributions AS (
  SELECT
    w.tournament_id,
    w.matchup_id,
    w.round_id,
    w.round_number,
    w.round_name,
    w.matchup_number,
    w.winner_team_id,
    tr.user_id,
    CASE w.scoring_method
      WHEN 'biggest_catch' THEN COALESCE(MAX(c.weight_lbs), 0)
      WHEN 'most_catches' THEN COUNT(c.id)::numeric
      ELSE COALESCE(SUM(c.weight_lbs), 0)
    END AS score,
    COUNT(c.id)::int AS catches_count,
    MAX(c.weight_lbs) AS biggest_catch,
    SUM(c.weight_lbs) AS total_weight
  FROM win w
  JOIN public.tournament_team_roster tr
    ON tr.tournament_id = w.tournament_id AND tr.team_id = w.winner_team_id
  LEFT JOIN public.catches c
    ON c.user_id = tr.user_id
   AND c.caught_at >= w.round_start
   AND (w.round_end IS NULL OR c.caught_at <= w.round_end)
  GROUP BY w.tournament_id, w.matchup_id, w.round_id, w.round_number, w.round_name,
           w.matchup_number, w.winner_team_id, tr.user_id, w.scoring_method
),
ranked AS (
  SELECT
    contributions.*,
    ROW_NUMBER() OVER (
      PARTITION BY matchup_id
      ORDER BY score DESC NULLS LAST, catches_count DESC
    ) AS rn
  FROM contributions
)
SELECT
  r.tournament_id,
  r.matchup_id,
  r.round_id,
  r.round_number,
  r.round_name,
  r.matchup_number,
  r.winner_team_id,
  ft.name AS team_name,
  ft.logo_url AS team_logo,
  r.user_id,
  p.display_name,
  p.photos,
  r.score,
  r.catches_count,
  r.biggest_catch,
  r.total_weight
FROM ranked r
JOIN public.fishing_teams ft ON ft.id = r.winner_team_id
LEFT JOIN public.profiles_safe p ON p.id = r.user_id
WHERE r.rn = 1;
