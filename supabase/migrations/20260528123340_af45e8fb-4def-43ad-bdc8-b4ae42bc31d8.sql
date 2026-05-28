-- 1. Photo challenges: gift_card_code restricted to winner/admin via RPC
REVOKE SELECT (gift_card_code) ON public.photo_challenges FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_photo_challenge_gift_card(p_challenge_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code text;
  v_winner uuid;
  v_creator uuid;
BEGIN
  SELECT gift_card_code, winner_id, created_by
    INTO v_code, v_winner, v_creator
  FROM public.photo_challenges
  WHERE id = p_challenge_id;

  IF v_winner = (SELECT auth.uid()) OR public.has_role((SELECT auth.uid()), 'admin') THEN
    RETURN v_code;
  END IF;
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_photo_challenge_gift_card(uuid) TO authenticated;

-- 2. Tournaments: gift_card_code already has get_tournament_gift_card(); revoke column SELECT
REVOKE SELECT (gift_card_code) ON public.tournaments FROM anon, authenticated;

-- 3. Fishing teams: phone restricted to captain / approved member / admin
REVOKE SELECT (phone) ON public.fishing_teams FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_team_phone(p_team_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phone text;
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;

  SELECT phone INTO v_phone FROM public.fishing_teams WHERE id = p_team_id;

  IF public.has_role(v_uid, 'admin')
     OR public.is_team_member(v_uid, p_team_id) THEN
    RETURN v_phone;
  END IF;
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_phone(uuid) TO authenticated;

-- 4. Photo challenge entries: precise GPS restricted to entry owner / admin
REVOKE SELECT (location_lat, location_lng) ON public.photo_challenge_entries FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_photo_entry_location(p_entry_id uuid)
RETURNS TABLE(location_lat numeric, location_lng numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.photo_challenge_entries WHERE id = p_entry_id;
  IF v_uid IS NULL THEN RETURN; END IF;

  IF v_owner = v_uid OR public.has_role(v_uid, 'admin') THEN
    RETURN QUERY
      SELECT e.location_lat, e.location_lng
      FROM public.photo_challenge_entries e
      WHERE e.id = p_entry_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_photo_entry_location(uuid) TO authenticated;