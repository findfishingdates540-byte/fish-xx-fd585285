
-- 1) Backfill base_score for alternate "Family, Common" naming used by imports
WITH alt(name, base_score, category, water_type, measurement_type, safe_release) AS (VALUES
  ('Bass, Largemouth', 5, 'bass', 'freshwater', 'TL', false),
  ('Bass, Smallmouth', 7, 'bass', 'freshwater', 'TL', false),
  ('Bass, Spotted', 5, 'bass', 'freshwater', 'TL', false),
  ('Bass, Striped', 7, 'bass', 'freshwater', 'TL', false),
  ('Bass, White', 4, 'bass', 'freshwater', 'TL', false),
  ('Bass, Peacock', 6, 'bass', 'freshwater', 'TL', false),
  ('Bass, Hybrid', 5, 'bass', 'freshwater', 'TL', false),
  ('Catfish, Channel', 4, 'catfish', 'freshwater', 'TL', false),
  ('Catfish, Blue', 6, 'catfish', 'freshwater', 'TL', false),
  ('Catfish, Flathead', 7, 'catfish', 'freshwater', 'TL', false),
  ('Catfish, White', 3, 'catfish', 'freshwater', 'TL', false),
  ('Catfish, Bullhead', 2, 'catfish', 'freshwater', 'TL', false),
  ('Trout, Rainbow', 5, 'trout_salmon', 'freshwater', 'TL', false),
  ('Trout, Brown', 7, 'trout_salmon', 'freshwater', 'TL', false),
  ('Trout, Brook', 6, 'trout_salmon', 'freshwater', 'TL', false),
  ('Trout, Lake', 7, 'trout_salmon', 'freshwater', 'TL', false),
  ('Trout, Cutthroat', 6, 'trout_salmon', 'freshwater', 'TL', false),
  ('Trout, Golden', 8, 'trout_salmon', 'freshwater', 'TL', false),
  ('Salmon, Chinook', 9, 'trout_salmon', 'freshwater', 'TL', false),
  ('Salmon, Coho', 7, 'trout_salmon', 'freshwater', 'TL', false),
  ('Salmon, Sockeye', 7, 'trout_salmon', 'freshwater', 'TL', false),
  ('Salmon, Atlantic', 9, 'trout_salmon', 'freshwater', 'TL', false),
  ('Salmon, Pink', 4, 'trout_salmon', 'freshwater', 'TL', false),
  ('Salmon, Chum', 5, 'trout_salmon', 'freshwater', 'TL', false),
  ('Tuna, Yellowfin', 9, 'tuna_pelagic', 'saltwater', 'FL', false),
  ('Tuna, Bluefin', 10, 'tuna_pelagic', 'saltwater', 'FL', true),
  ('Tuna, Bigeye', 9, 'tuna_pelagic', 'saltwater', 'FL', false),
  ('Tuna, Albacore', 7, 'tuna_pelagic', 'saltwater', 'FL', false),
  ('Tuna, Blackfin', 6, 'tuna_pelagic', 'saltwater', 'FL', false),
  ('Tuna, Skipjack', 4, 'tuna_pelagic', 'saltwater', 'FL', false),
  ('Pike, Northern', 7, 'exotic_freshwater', 'freshwater', 'TL', false),
  ('Gar, Alligator', 9, 'exotic_freshwater', 'freshwater', 'TL', true)
)
UPDATE public.fish_species fs
SET base_score = COALESCE(fs.base_score, alt.base_score),
    category = COALESCE(fs.category, alt.category),
    water_type = COALESCE(fs.water_type, alt.water_type),
    measurement_type = COALESCE(fs.measurement_type, alt.measurement_type),
    safe_release = COALESCE(fs.safe_release, alt.safe_release)
FROM alt
WHERE LOWER(fs.name) = LOWER(alt.name);

-- 2) Default catch_method + trophy_level on existing rows so score formula works
UPDATE public.catches
   SET catch_method = COALESCE(catch_method, 'flats'),
       trophy_level = COALESCE(trophy_level, 'keeper');

-- 3) Recompute computed_score for every catch with a species
--    (re-assigning species_id fires the BEFORE trigger compute_catch_score)
UPDATE public.catches
   SET species_id = species_id
 WHERE species_id IS NOT NULL;

-- 4) Update get_team_scores: keep total_score for compatibility, add season_points + last_7_days_catches
DROP FUNCTION IF EXISTS public.get_team_scores(text);
CREATE OR REPLACE FUNCTION public.get_team_scores(p_category text DEFAULT NULL)
RETURNS TABLE(
  team_id uuid,
  team_name text,
  logo_url text,
  skill_level public.fishing_experience,
  category text,
  captain_id uuid,
  total_score numeric,
  catch_count bigint,
  member_count bigint,
  season_points numeric,
  last_7_days_catches bigint
)
LANGUAGE sql
STABLE
AS $$
  WITH base AS (
    SELECT
      ft.id AS team_id,
      ft.name AS team_name,
      ft.logo_url,
      ft.skill_level,
      ft.category,
      ft.captain_id,
      COALESCE(SUM(c.computed_score) FILTER (WHERE c.is_verified = true), 0)::numeric AS season_points,
      COUNT(c.id) FILTER (
        WHERE c.is_verified = true AND c.caught_at >= NOW() - INTERVAL '7 days'
      )::bigint AS last_7_days_catches,
      COUNT(c.id) FILTER (WHERE c.is_verified = true)::bigint AS catch_count,
      (SELECT COUNT(*) FROM public.team_members tm2 WHERE tm2.team_id = ft.id) + 1 AS member_count
    FROM public.fishing_teams ft
    LEFT JOIN public.team_members tm ON tm.team_id = ft.id
    LEFT JOIN public.catches c
      ON (c.user_id = tm.user_id OR c.user_id = ft.captain_id)
    WHERE (p_category IS NULL OR ft.category = p_category)
    GROUP BY ft.id, ft.name, ft.logo_url, ft.skill_level, ft.category, ft.captain_id
  )
  SELECT
    team_id, team_name, logo_url, skill_level, category, captain_id,
    season_points AS total_score,
    catch_count,
    member_count,
    season_points,
    last_7_days_catches
  FROM base
  ORDER BY season_points DESC, catch_count DESC;
$$;

-- 5) Tighten challenge scoring to verified + approved catches only
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

  UPDATE public.challenge_participants
     SET score = 0, best_catch_id = NULL
   WHERE challenge_id = p_challenge_id;

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
          AND c2.is_verified = true
          AND COALESCE(c2.approval_status::text, 'approved') = 'approved'
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
     AND c.is_verified = true
     AND COALESCE(c.approval_status::text, 'approved') = 'approved'
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

-- 6) Recompute all existing fishing challenge scores
DO $$
DECLARE rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM public.fishing_challenges LOOP
    PERFORM public.recalc_fishing_challenge_scores(rec.id);
  END LOOP;
END $$;

-- 7) Refresh leaderboard_entries materialization for all species
SELECT public.refresh_leaderboard_entries(NULL);
