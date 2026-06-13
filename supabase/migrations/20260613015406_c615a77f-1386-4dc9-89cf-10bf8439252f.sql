CREATE OR REPLACE FUNCTION public.is_team_poster(_user uuid, _team uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM fishing_teams WHERE id = _team AND captain_id = _user
  ) OR EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = _team AND user_id = _user
      AND status = 'approved' AND role IN ('officer','captain','vice_captain')
  )
$function$;