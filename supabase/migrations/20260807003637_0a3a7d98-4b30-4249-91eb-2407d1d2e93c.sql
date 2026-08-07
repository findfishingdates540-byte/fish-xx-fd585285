CREATE OR REPLACE FUNCTION public.recalc_championship_scores(p_championship_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  ch RECORD;
  team_row RECORD;
  start_ts timestamptz;
  end_ts timestamptz;
  v_best_n integer;
  v_bonus_total numeric;
  v_distinct integer;
  v_top_sum numeric;
  v_count integer;
  bonus_row RECORD;
BEGIN
  SELECT id, start_date, end_date, best_n_catches, diversity_bonuses
    INTO ch
  FROM public.fishing_challenges
  WHERE id = p_championship_id AND is_championship = true;

  IF ch IS NULL THEN RETURN; END IF;

  start_ts := ch.start_date::timestamptz;
  end_ts := (ch.end_date + INTERVAL '1 day' - INTERVAL '1 second')::timestamptz;
  v_best_n := GREATEST(COALESCE(ch.best_n_catches, 20), 1);

  FOR team_row IN
    SELECT ct.id AS ct_id, ct.team_id
    FROM public.championship_teams ct
    WHERE ct.championship_id = p_championship_id
  LOOP
    WITH scored AS (
      SELECT
        c.id,
        c.species_id,
        LOWER(c.species_name) AS sname,
        public.score_championship_catch(
          p_championship_id, c.species_id, c.species_name, c.trophy_level
        ) AS pts
      FROM public.catches c
      JOIN public.team_members tm
        ON tm.user_id = c.user_id AND tm.team_id = team_row.team_id AND tm.status = 'approved'
      WHERE c.challenge_id = p_championship_id
        AND COALESCE(c.approval_status::text, 'approved') = 'approved'
        AND c.caught_at >= start_ts AND c.caught_at <= end_ts
    ),
    qualifying AS (
      SELECT * FROM scored
      WHERE pts > 0
      ORDER BY pts DESC, id
      LIMIT v_best_n
    )
    SELECT COALESCE(SUM(pts), 0),
           COUNT(*)::int,
           COUNT(DISTINCT COALESCE(species_id::text, sname))::int
      INTO v_top_sum, v_count, v_distinct
    FROM qualifying;

    v_bonus_total := 0;
    FOR bonus_row IN
      SELECT (b->>'species')::int AS req, (b->>'bonus')::numeric AS bonus
      FROM jsonb_array_elements(ch.diversity_bonuses) b
    LOOP
      IF v_distinct >= bonus_row.req THEN
        v_bonus_total := GREATEST(v_bonus_total, bonus_row.bonus);
      END IF;
    END LOOP;

    UPDATE public.championship_teams
       SET total_points = v_top_sum + v_bonus_total,
           qualifying_catches = v_count,
           distinct_species = v_distinct,
           updated_at = now()
     WHERE id = team_row.ct_id;
  END LOOP;
END;
$function$;

SELECT public.recalc_championship_scores(id) FROM public.fishing_challenges WHERE is_championship = true;