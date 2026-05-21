
CREATE OR REPLACE FUNCTION public.is_challenge_participant(_user uuid, _challenge uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fishing_challenge_entries
    WHERE challenge_id = _challenge AND user_id = _user AND has_paid = true
  ) OR EXISTS (
    SELECT 1 FROM public.challenge_participants
    WHERE challenge_id = _challenge AND user_id = _user
  )
$$;
