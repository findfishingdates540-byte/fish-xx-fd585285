CREATE OR REPLACE FUNCTION public.is_challenge_participant(_user uuid, _challenge uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    -- Championships: open to any signed-in angler. Calcutta is optional and never gates logging.
    EXISTS (
      SELECT 1 FROM public.fishing_challenges fc
      WHERE fc.id = _challenge AND fc.is_championship = true
    )
    OR EXISTS (
      SELECT 1 FROM public.fishing_challenge_entries
      WHERE challenge_id = _challenge AND user_id = _user AND has_paid = true
    )
    OR EXISTS (
      SELECT 1 FROM public.challenge_participants
      WHERE challenge_id = _challenge AND user_id = _user
    )
$function$;