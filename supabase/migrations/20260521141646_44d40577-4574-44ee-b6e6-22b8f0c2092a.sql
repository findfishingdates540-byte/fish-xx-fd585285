
-- 1. Approval status enum
DO $$ BEGIN
  CREATE TYPE public.catch_approval_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Extend catches table
ALTER TABLE public.catches
  ADD COLUMN IF NOT EXISTS challenge_id uuid REFERENCES public.fishing_challenges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES public.tournaments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approval_status public.catch_approval_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approval_notes text,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Ensure only one competition link per catch
ALTER TABLE public.catches DROP CONSTRAINT IF EXISTS catches_one_competition_only;
ALTER TABLE public.catches ADD CONSTRAINT catches_one_competition_only
  CHECK (challenge_id IS NULL OR tournament_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_catches_challenge_pending ON public.catches(challenge_id, approval_status) WHERE challenge_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catches_tournament_pending ON public.catches(tournament_id, approval_status) WHERE tournament_id IS NOT NULL;

-- 3. Participant helper functions
CREATE OR REPLACE FUNCTION public.is_challenge_participant(_user uuid, _challenge uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fishing_challenge_entries
    WHERE challenge_id = _challenge AND user_id = _user AND has_paid = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_tournament_participant(_user uuid, _tournament uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tournament_participants
    WHERE tournament_id = _tournament AND user_id = _user
  )
$$;

-- 4. Tighten catch INSERT policy to enforce participation when a competition is referenced
-- (Keep existing self-insert policy; add competition validation as a CHECK via trigger)
CREATE OR REPLACE FUNCTION public.validate_competition_catch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.challenge_id IS NOT NULL THEN
    IF NOT public.is_challenge_participant(NEW.user_id, NEW.challenge_id) THEN
      RAISE EXCEPTION 'User % is not a paid participant of challenge %', NEW.user_id, NEW.challenge_id;
    END IF;
    -- Force pending status on submission
    IF TG_OP = 'INSERT' THEN
      NEW.approval_status := 'pending';
      NEW.is_verified := false;
    END IF;
  END IF;
  IF NEW.tournament_id IS NOT NULL THEN
    IF NOT public.is_tournament_participant(NEW.user_id, NEW.tournament_id) THEN
      RAISE EXCEPTION 'User % is not a participant of tournament %', NEW.user_id, NEW.tournament_id;
    END IF;
    IF TG_OP = 'INSERT' THEN
      NEW.approval_status := 'pending';
      NEW.is_verified := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_competition_catch ON public.catches;
CREATE TRIGGER trg_validate_competition_catch
  BEFORE INSERT ON public.catches
  FOR EACH ROW EXECUTE FUNCTION public.validate_competition_catch();

-- 5. When approval flips, also flip verification + notify the angler
CREATE OR REPLACE FUNCTION public.on_catch_approval_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_title text;
  v_body text;
  v_comp_name text;
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    -- Sync verification + approval metadata
    IF NEW.approval_status = 'approved' THEN
      NEW.is_verified := true;
      NEW.approved_at := COALESCE(NEW.approved_at, now());
    ELSIF NEW.approval_status = 'rejected' THEN
      NEW.is_verified := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_catch_approval_sync ON public.catches;
CREATE TRIGGER trg_catch_approval_sync
  BEFORE UPDATE OF approval_status ON public.catches
  FOR EACH ROW EXECUTE FUNCTION public.on_catch_approval_change();

CREATE OR REPLACE FUNCTION public.notify_catch_approval_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_title text;
  v_body text;
  v_comp_name text;
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
     AND NEW.approval_status IN ('approved','rejected') THEN
    IF NEW.challenge_id IS NOT NULL THEN
      SELECT title INTO v_comp_name FROM public.fishing_challenges WHERE id = NEW.challenge_id;
    ELSIF NEW.tournament_id IS NOT NULL THEN
      SELECT name INTO v_comp_name FROM public.tournaments WHERE id = NEW.tournament_id;
    END IF;

    IF NEW.approval_status = 'approved' THEN
      v_title := 'Catch approved ✅';
      v_body := 'Your catch' || COALESCE(' for ' || v_comp_name, '') || ' was approved and counted.';
    ELSE
      v_title := 'Catch rejected';
      v_body := 'Your catch' || COALESCE(' for ' || v_comp_name, '') || ' was rejected.' || COALESCE(' Reason: ' || NEW.approval_notes, '');
    END IF;

    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_id,
      'catch_' || NEW.approval_status::text,
      v_title,
      v_body,
      jsonb_build_object('catch_id', NEW.id, 'challenge_id', NEW.challenge_id, 'tournament_id', NEW.tournament_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_catch_approval ON public.catches;
CREATE TRIGGER trg_notify_catch_approval
  AFTER UPDATE OF approval_status ON public.catches
  FOR EACH ROW EXECUTE FUNCTION public.notify_catch_approval_change();

-- 6. Update leaderboard refresh to require approved status
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_entries(p_species_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM leaderboard_entries
   WHERE (p_species_id IS NULL OR species_id = p_species_id);

  INSERT INTO leaderboard_entries (user_id, species_id, species_name, total_caught, total_released, total_harvested, largest_weight_lbs, largest_length_in, largest_catch_id, updated_at)
  SELECT
    c.user_id,
    c.species_id,
    COALESCE(fs.name, c.species_name, 'Unknown'),
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE c.catch_status = 'released')::int,
    COUNT(*) FILTER (WHERE c.catch_status = 'harvested')::int,
    MAX(c.weight_lbs),
    MAX(c.length_in),
    COALESCE(
      (SELECT c2.id FROM catches c2
        WHERE c2.user_id = c.user_id AND c2.species_id = c.species_id
          AND c2.is_verified = true AND c2.approval_status = 'approved' AND c2.weight_lbs IS NOT NULL
        ORDER BY c2.weight_lbs DESC LIMIT 1),
      (SELECT c3.id FROM catches c3
        WHERE c3.user_id = c.user_id AND c3.species_id = c.species_id
          AND c3.is_verified = true AND c3.approval_status = 'approved'
        ORDER BY COALESCE(c3.caught_at, c3.created_at) DESC LIMIT 1)
    ),
    now()
  FROM catches c
  LEFT JOIN fish_species fs ON fs.id = c.species_id
  WHERE c.species_id IS NOT NULL
    AND c.is_verified = true
    AND c.approval_status = 'approved'
    AND (p_species_id IS NULL OR c.species_id = p_species_id)
  GROUP BY c.user_id, c.species_id, fs.name, c.species_name;

  UPDATE leaderboard_entries le SET rank_by_weight = sub.rw
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY species_id ORDER BY largest_weight_lbs DESC NULLS LAST, total_caught DESC) AS rw
    FROM leaderboard_entries
    WHERE (p_species_id IS NULL OR species_id = p_species_id)
  ) sub
  WHERE le.id = sub.id;

  UPDATE leaderboard_entries le SET rank_by_count = sub.rc
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY species_id ORDER BY total_caught DESC, largest_weight_lbs DESC NULLS LAST) AS rc
    FROM leaderboard_entries
    WHERE (p_species_id IS NULL OR species_id = p_species_id)
  ) sub
  WHERE le.id = sub.id;
END;
$function$;

-- 7. Block non-admins from updating approval fields
CREATE OR REPLACE FUNCTION public.guard_catch_approval_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.approval_status IS DISTINCT FROM OLD.approval_status
      OR NEW.approval_notes IS DISTINCT FROM OLD.approval_notes
      OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
      OR NEW.approved_at IS DISTINCT FROM OLD.approved_at)
     AND NOT public.has_role((SELECT auth.uid()), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change catch approval status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_catch_approval ON public.catches;
CREATE TRIGGER trg_guard_catch_approval
  BEFORE UPDATE ON public.catches
  FOR EACH ROW EXECUTE FUNCTION public.guard_catch_approval_update();
