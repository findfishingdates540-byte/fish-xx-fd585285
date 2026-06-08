CREATE OR REPLACE FUNCTION public.compute_catch_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_base numeric := 0;
  v_mult numeric := 1.0;
  v_bonus numeric := 0;
BEGIN
  IF NEW.challenge_id IS NULL AND NEW.tournament_id IS NULL THEN
    NEW.computed_score := NULL;
    RETURN NEW;
  END IF;

  IF NEW.species_id IS NOT NULL THEN
    SELECT COALESCE(base_score, 0) INTO v_base FROM public.fish_species WHERE id = NEW.species_id;
  END IF;

  IF NEW.catch_method IS NOT NULL THEN
    SELECT COALESCE(multiplier, 1.0) INTO v_mult FROM public.scoring_catch_methods WHERE key = NEW.catch_method;
    IF v_mult IS NULL THEN v_mult := 1.0; END IF;
  END IF;

  IF NEW.trophy_level IS NOT NULL THEN
    SELECT COALESCE(bonus, 0) INTO v_bonus FROM public.scoring_trophy_bonuses WHERE level = NEW.trophy_level;
    IF v_bonus IS NULL THEN v_bonus := 0; END IF;
  END IF;

  NEW.computed_score := ROUND((COALESCE(v_base,0) * COALESCE(v_mult,1.0) + COALESCE(v_bonus,0))::numeric, 2);
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_compute_catch_score ON public.catches;
CREATE TRIGGER trg_compute_catch_score
BEFORE INSERT OR UPDATE OF species_id, catch_method, trophy_level, challenge_id, tournament_id
ON public.catches
FOR EACH ROW EXECUTE FUNCTION public.compute_catch_score();

UPDATE public.catches
   SET computed_score = NULL
 WHERE challenge_id IS NULL
   AND tournament_id IS NULL
   AND computed_score IS NOT NULL;

UPDATE public.catches
   SET species_id = species_id
 WHERE species_id IS NOT NULL
   AND (challenge_id IS NOT NULL OR tournament_id IS NOT NULL);

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
          AND COALESCE(c2.approval_status::text, 'approved') = 'approved' AND c2.weight_lbs IS NOT NULL
        ORDER BY c2.weight_lbs DESC LIMIT 1),
      (SELECT c3.id FROM catches c3
        WHERE c3.user_id = c.user_id AND c3.species_id = c.species_id
          AND COALESCE(c3.approval_status::text, 'approved') = 'approved'
        ORDER BY COALESCE(c3.caught_at, c3.created_at) DESC LIMIT 1)
    ),
    now()
  FROM catches c
  LEFT JOIN fish_species fs ON fs.id = c.species_id
  WHERE c.species_id IS NOT NULL
    AND COALESCE(c.approval_status::text, 'approved') = 'approved'
    AND (p_species_id IS NULL OR c.species_id = p_species_id)
  GROUP BY c.user_id, c.species_id, fs.name, c.species_name;

  UPDATE leaderboard_entries le SET rank_by_weight = sub.rw
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY species_id ORDER BY largest_weight_lbs DESC NULLS LAST, largest_length_in DESC NULLS LAST, total_caught DESC) AS rw
    FROM leaderboard_entries
    WHERE (p_species_id IS NULL OR species_id = p_species_id)
  ) sub
  WHERE le.id = sub.id;

  UPDATE leaderboard_entries le SET rank_by_count = sub.rc
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY species_id ORDER BY total_caught DESC, largest_weight_lbs DESC NULLS LAST, largest_length_in DESC NULLS LAST) AS rc
    FROM leaderboard_entries
    WHERE (p_species_id IS NULL OR species_id = p_species_id)
  ) sub
  WHERE le.id = sub.id;
END;
$function$;

SELECT public.refresh_leaderboard_entries(NULL);