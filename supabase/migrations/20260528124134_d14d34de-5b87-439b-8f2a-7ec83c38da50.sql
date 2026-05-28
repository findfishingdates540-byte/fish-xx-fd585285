-- 1. Lock down gift_card_code on tournaments & photo_challenges.
-- Helper functions get_tournament_gift_card / get_photo_challenge_gift_card
-- exist for winner/admin-only access. Revoke direct column access.
REVOKE SELECT (gift_card_code) ON public.tournaments FROM anon, authenticated;
REVOKE SELECT (gift_card_code) ON public.photo_challenges FROM anon, authenticated;

GRANT SELECT (
  id, title, description, banner_url, format, seeding_method, scoring_method,
  max_participants, entry_fee, prize_description, registration_start,
  registration_end, start_date, end_date, status, current_round, total_rounds,
  created_by, created_at, updated_at, prize_type, entry_fee_enabled,
  is_admin_funded, winner_id, creator_team_id, winner_team_id, is_junior_only
) ON public.tournaments TO authenticated;

GRANT SELECT (
  id, title, description, banner_url, entry_fee, prize_type, prize_description,
  start_date, end_date, voting_end_date, status, winner_id, created_by,
  created_at, entry_fee_enabled, platform_fee_percent, is_admin_funded,
  is_junior_only
) ON public.photo_challenges TO authenticated;

-- 2. Hide operational/internal columns on admin_broadcasts from non-admins.
REVOKE SELECT (last_dispatch_error, dispatch_attempts, recipient_count, sent_count, created_by)
  ON public.admin_broadcasts FROM anon, authenticated;

GRANT SELECT (
  id, title, body, body_html, popup_variant, popup_cta_label, popup_cta_url,
  status, channels, audience, scheduled_for, sent_at, created_at
) ON public.admin_broadcasts TO anon, authenticated;