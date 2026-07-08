CREATE OR REPLACE FUNCTION public.is_challenge_participant(_user uuid, _challenge uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    EXISTS (
      SELECT 1 FROM public.fishing_challenge_entries
      WHERE challenge_id = _challenge AND user_id = _user AND has_paid = true
    )
    OR EXISTS (
      SELECT 1 FROM public.challenge_participants
      WHERE challenge_id = _challenge AND user_id = _user
    )
    -- Championship: allow any member of a registered team (calcutta is optional)
    OR EXISTS (
      SELECT 1
      FROM public.fishing_challenges fc
      JOIN public.championship_teams ct ON ct.championship_id = fc.id
      JOIN public.team_members tm ON tm.team_id = ct.team_id
      WHERE fc.id = _challenge
        AND fc.is_championship = true
        AND tm.user_id = _user
        AND COALESCE(tm.status, 'active') = 'active'
    )
    -- Championship: team captain also counts even if not in team_members
    OR EXISTS (
      SELECT 1
      FROM public.fishing_challenges fc
      JOIN public.championship_teams ct ON ct.championship_id = fc.id
      JOIN public.fishing_teams ft ON ft.id = ct.team_id
      WHERE fc.id = _challenge
        AND fc.is_championship = true
        AND ft.captain_id = _user
    )
$function$;