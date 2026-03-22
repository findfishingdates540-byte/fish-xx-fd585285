
-- Add category column to fishing_teams
ALTER TABLE public.fishing_teams ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'teams';

-- Update get_team_scores to filter by category instead of skill_level
CREATE OR REPLACE FUNCTION public.get_team_scores(p_category text DEFAULT NULL)
RETURNS TABLE(
  team_id uuid,
  team_name text,
  logo_url text,
  skill_level public.fishing_experience,
  category text,
  captain_id uuid,
  total_score numeric,
  catch_count bigint,
  member_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ft.id AS team_id,
    ft.name AS team_name,
    ft.logo_url,
    ft.skill_level,
    ft.category,
    ft.captain_id,
    COALESCE(SUM(c.weight_lbs), 0) + (COUNT(c.id) * 10) AS total_score,
    COUNT(c.id) AS catch_count,
    (SELECT COUNT(*) FROM team_members tm2 WHERE tm2.team_id = ft.id) + 1 AS member_count
  FROM fishing_teams ft
  LEFT JOIN team_members tm ON tm.team_id = ft.id
  LEFT JOIN catches c ON (c.user_id = tm.user_id OR c.user_id = ft.captain_id)
    AND c.caught_at >= NOW() - INTERVAL '7 days'
  WHERE (p_category IS NULL OR ft.category = p_category)
  GROUP BY ft.id, ft.name, ft.logo_url, ft.skill_level, ft.category, ft.captain_id
  ORDER BY total_score DESC;
$$;
