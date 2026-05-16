-- Server-side enforcement of photo challenge voting window
CREATE OR REPLACE FUNCTION public.enforce_photo_challenge_vote_window()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  c RECORD;
  entry_owner uuid;
BEGIN
  SELECT pc.status, pc.end_date, pc.voting_end_date
    INTO c
  FROM public.photo_challenges pc
  JOIN public.photo_challenge_entries e ON e.challenge_id = pc.id
  WHERE e.id = NEW.entry_id;

  IF c IS NULL THEN
    RAISE EXCEPTION 'Entry not found';
  END IF;

  IF c.status <> 'voting' THEN
    RAISE EXCEPTION 'Voting is not currently open for this challenge';
  END IF;

  IF now() < c.end_date THEN
    RAISE EXCEPTION 'Voting has not started yet';
  END IF;

  IF c.voting_end_date IS NOT NULL AND now() >= c.voting_end_date THEN
    RAISE EXCEPTION 'Voting window has ended';
  END IF;

  -- Prevent voting for your own entry
  SELECT user_id INTO entry_owner FROM public.photo_challenge_entries WHERE id = NEW.entry_id;
  IF entry_owner = NEW.user_id THEN
    RAISE EXCEPTION 'You cannot vote for your own entry';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_photo_challenge_vote_window ON public.photo_challenge_votes;
CREATE TRIGGER trg_enforce_photo_challenge_vote_window
BEFORE INSERT ON public.photo_challenge_votes
FOR EACH ROW
EXECUTE FUNCTION public.enforce_photo_challenge_vote_window();