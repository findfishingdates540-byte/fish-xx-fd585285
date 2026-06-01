
-- 1. Auto-update fishing challenge status based on dates
CREATE OR REPLACE FUNCTION public.refresh_fishing_challenge_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.fishing_challenges
  SET status = 'active'
  WHERE status = 'upcoming'
    AND start_date <= CURRENT_DATE
    AND end_date >= CURRENT_DATE;

  UPDATE public.fishing_challenges
  SET status = 'completed'
  WHERE status IN ('upcoming','active')
    AND end_date < CURRENT_DATE;
END;
$$;

-- 2. Recalculate scores for all participants of a given fishing challenge
CREATE OR REPLACE FUNCTION public.recalc_fishing_challenge_scores(p_challenge_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ch RECORD;
  start_ts timestamptz;
  end_ts timestamptz;
BEGIN
  SELECT id, challenge_type, species_id, target_species_name, start_date, end_date
    INTO ch
  FROM public.fishing_challenges
  WHERE id = p_challenge_id;

  IF ch IS NULL THEN RETURN; END IF;

  start_ts := ch.start_date::timestamptz;
  end_ts := (ch.end_date + INTERVAL '1 day' - INTERVAL '1 second')::timestamptz;

  -- Reset
  UPDATE public.challenge_participants
     SET score = 0, best_catch_id = NULL
   WHERE challenge_id = p_challenge_id;

  -- Compute scores from catches
  WITH scored AS (
    SELECT
      cp.id AS participant_id,
      cp.user_id,
      CASE ch.challenge_type::text
        WHEN 'largest_fish'  THEN COALESCE(MAX(c.length_in), 0)
        WHEN 'total_weight'  THEN COALESCE(SUM(c.length_in), 0)
        WHEN 'most_caught'   THEN COUNT(c.id)::numeric
        WHEN 'most_species'  THEN COUNT(DISTINCT c.species_id)::numeric
        ELSE 0
      END AS new_score,
      (
        SELECT c2.id FROM public.catches c2
        WHERE c2.user_id = cp.user_id
          AND c2.is_private = false
          AND c2.caught_at >= start_ts AND c2.caught_at <= end_ts
          AND (
            ch.species_id IS NOT NULL AND c2.species_id = ch.species_id
            OR ch.species_id IS NULL AND ch.target_species_name IS NOT NULL
               AND LOWER(c2.species_name) = LOWER(ch.target_species_name)
            OR ch.species_id IS NULL AND ch.target_species_name IS NULL
          )
        ORDER BY c2.length_in DESC NULLS LAST, c2.caught_at DESC
        LIMIT 1
      ) AS best_id
    FROM public.challenge_participants cp
    LEFT JOIN public.catches c
      ON c.user_id = cp.user_id
     AND c.is_private = false
     AND c.caught_at >= start_ts AND c.caught_at <= end_ts
     AND (
       ch.species_id IS NOT NULL AND c.species_id = ch.species_id
       OR ch.species_id IS NULL AND ch.target_species_name IS NOT NULL
          AND LOWER(c.species_name) = LOWER(ch.target_species_name)
       OR ch.species_id IS NULL AND ch.target_species_name IS NULL
     )
    WHERE cp.challenge_id = p_challenge_id
    GROUP BY cp.id, cp.user_id, ch.challenge_type, ch.species_id, ch.target_species_name
  )
  UPDATE public.challenge_participants cp
     SET score = s.new_score,
         best_catch_id = s.best_id
    FROM scored s
   WHERE cp.id = s.participant_id;
END;
$$;

-- 3. Recalculate any active fishing challenges a user/catch may belong to
CREATE OR REPLACE FUNCTION public.recalc_fishing_challenges_for_catch(
  p_user_id uuid,
  p_caught_at timestamptz,
  p_species_id uuid,
  p_species_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ch_id uuid;
BEGIN
  PERFORM public.refresh_fishing_challenge_statuses();

  FOR ch_id IN
    SELECT fc.id
      FROM public.fishing_challenges fc
      JOIN public.challenge_participants cp ON cp.challenge_id = fc.id AND cp.user_id = p_user_id
     WHERE fc.status IN ('active','upcoming','completed')
       AND p_caught_at >= fc.start_date::timestamptz
       AND p_caught_at <= (fc.end_date + INTERVAL '1 day' - INTERVAL '1 second')::timestamptz
       AND (
         fc.species_id IS NOT NULL AND fc.species_id = p_species_id
         OR fc.species_id IS NULL AND fc.target_species_name IS NOT NULL
            AND LOWER(fc.target_species_name) = LOWER(COALESCE(p_species_name,''))
         OR fc.species_id IS NULL AND fc.target_species_name IS NULL
       )
  LOOP
    PERFORM public.recalc_fishing_challenge_scores(ch_id);
  END LOOP;
END;
$$;

-- 4. Trigger on catches
CREATE OR REPLACE FUNCTION public.trg_catches_recalc_challenges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_fishing_challenges_for_catch(OLD.user_id, OLD.caught_at, OLD.species_id, OLD.species_name);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_fishing_challenges_for_catch(NEW.user_id, NEW.caught_at, NEW.species_id, NEW.species_name);
    IF TG_OP = 'UPDATE' AND (
       OLD.user_id IS DISTINCT FROM NEW.user_id
       OR OLD.caught_at IS DISTINCT FROM NEW.caught_at
       OR OLD.species_id IS DISTINCT FROM NEW.species_id
       OR OLD.species_name IS DISTINCT FROM NEW.species_name
    ) THEN
      PERFORM public.recalc_fishing_challenges_for_catch(OLD.user_id, OLD.caught_at, OLD.species_id, OLD.species_name);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_catches_recalc_challenges ON public.catches;
CREATE TRIGGER trg_catches_recalc_challenges
AFTER INSERT OR UPDATE OR DELETE ON public.catches
FOR EACH ROW EXECUTE FUNCTION public.trg_catches_recalc_challenges();

-- 5. Promote statuses now and backfill all existing challenge scores
SELECT public.refresh_fishing_challenge_statuses();

DO $$
DECLARE rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM public.fishing_challenges LOOP
    PERFORM public.recalc_fishing_challenge_scores(rec.id);
  END LOOP;
END $$;
