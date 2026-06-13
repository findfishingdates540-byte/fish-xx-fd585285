
REVOKE SELECT ON public.tournaments FROM anon, authenticated;
GRANT SELECT (
  id, title, description, banner_url, format, seeding_method, scoring_method,
  max_participants, entry_fee, prize_description, registration_start,
  registration_end, start_date, end_date, status, current_round, total_rounds,
  created_by, created_at, updated_at, prize_type, entry_fee_enabled,
  is_admin_funded, winner_id, creator_team_id, winner_team_id, is_junior_only
) ON public.tournaments TO authenticated;
GRANT SELECT (
  id, title, description, banner_url, format, seeding_method, scoring_method,
  max_participants, entry_fee, prize_description, registration_start,
  registration_end, start_date, end_date, status, current_round, total_rounds,
  created_by, created_at, updated_at, prize_type, entry_fee_enabled,
  is_admin_funded, winner_id, creator_team_id, winner_team_id, is_junior_only
) ON public.tournaments TO anon;

REVOKE SELECT ON public.photo_challenges FROM anon, authenticated;
GRANT SELECT (
  id, title, description, banner_url, entry_fee, prize_type, prize_description,
  start_date, end_date, voting_end_date, status, winner_id, created_by,
  created_at, entry_fee_enabled, platform_fee_percent, is_admin_funded,
  is_junior_only
) ON public.photo_challenges TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can view public photo challenges" ON public.photo_challenges;
CREATE POLICY "Authenticated users can view public photo challenges"
ON public.photo_challenges
FOR SELECT
TO authenticated
USING (status IN ('active','voting','completed'));
