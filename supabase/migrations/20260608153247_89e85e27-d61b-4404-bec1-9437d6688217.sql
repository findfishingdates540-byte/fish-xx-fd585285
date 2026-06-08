CREATE OR REPLACE FUNCTION public.normalize_species_label(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  WITH cleaned AS (
    SELECT trim(
      regexp_replace(
        regexp_replace(lower(coalesce(p_name, '')), '\\([^)]*\\)', '', 'g'),
        '[^a-z0-9, ]',
        ' ',
        'g'
      )
    ) AS value
  ), reordered AS (
    SELECT CASE
      WHEN position(',' in value) > 0 THEN
        trim(split_part(value, ',', 2)) || ' ' || trim(split_part(value, ',', 1))
      ELSE value
    END AS value
    FROM cleaned
  )
  SELECT regexp_replace(value, '\\s+', ' ', 'g')
  FROM reordered;
$$;

CREATE OR REPLACE FUNCTION public.species_labels_match(p_target_name text, p_catch_species_id uuid, p_catch_species_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    public.normalize_species_label(p_target_name) = public.normalize_species_label(p_catch_species_name)
    OR EXISTS (
      SELECT 1
      FROM public.fish_species fs
      WHERE fs.id = p_catch_species_id
        AND public.normalize_species_label(p_target_name) = public.normalize_species_label(fs.name)
    );
$$;

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
        WHEN 'most_species'  THEN COUNT(DISTINCT COALESCE(c.species_id::text, public.normalize_species_label(c.species_name)))::numeric
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
            (ch.species_id IS NOT NULL AND c2.species_id = ch.species_id)
            OR (ch.species_id IS NULL AND ch.target_species_name IS NOT NULL
                AND public.species_labels_match(ch.target_species_name, c2.species_id, c2.species_name))
            OR (ch.species_id IS NULL AND ch.target_species_name IS NULL)
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
       (ch.species_id IS NOT NULL AND c.species_id = ch.species_id)
       OR (ch.species_id IS NULL AND ch.target_species_name IS NOT NULL
           AND public.species_labels_match(ch.target_species_name, c.species_id, c.species_name))
       OR (ch.species_id IS NULL AND ch.target_species_name IS NULL)
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
         (fc.species_id IS NOT NULL AND fc.species_id = p_species_id)
         OR (fc.species_id IS NULL AND fc.target_species_name IS NOT NULL
             AND public.species_labels_match(fc.target_species_name, p_species_id, p_species_name))
         OR (fc.species_id IS NULL AND fc.target_species_name IS NULL)
       )
  LOOP
    PERFORM public.recalc_fishing_challenge_scores(ch_id);
  END LOOP;
END;
$$;