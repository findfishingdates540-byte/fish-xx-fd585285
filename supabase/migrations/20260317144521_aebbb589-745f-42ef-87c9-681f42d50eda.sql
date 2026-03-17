
-- Fix 1: Allow members to leave teams
CREATE POLICY "Members can leave teams"
ON public.team_members
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Fix 2: Recreate get_team_scores with caught_at for 7-day filter
CREATE OR REPLACE FUNCTION public.get_team_scores(p_skill_level fishing_experience)
 RETURNS TABLE(team_id uuid, team_name text, logo_url text, captain_id uuid, member_count integer, season_points numeric, last_7_days_catches integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT
    ft.id as team_id,
    ft.name as team_name,
    ft.logo_url,
    ft.captain_id,
    (SELECT COUNT(*)::int FROM team_members tm2 WHERE tm2.team_id = ft.id) as member_count,
    COALESCE(SUM(c.weight_lbs), 0) + (COUNT(c.id) * 10) as season_points,
    COUNT(c.id) FILTER (WHERE c.caught_at >= now() - interval '7 days')::int as last_7_days_catches
  FROM fishing_teams ft
  LEFT JOIN team_members tm ON tm.team_id = ft.id
  LEFT JOIN catches c ON c.user_id = tm.user_id
  WHERE ft.skill_level = p_skill_level
  GROUP BY ft.id, ft.name, ft.logo_url, ft.captain_id
  ORDER BY (COALESCE(SUM(c.weight_lbs), 0) + (COUNT(c.id) * 10)) DESC
  LIMIT 20;
$$;
