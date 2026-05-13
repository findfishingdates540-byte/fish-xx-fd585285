-- 1. Allow all authenticated users to view catches (privacy applied at app layer for location only)
DROP POLICY IF EXISTS "View catches respecting share_location" ON public.catches;
CREATE POLICY "Anyone can view catches"
  ON public.catches FOR SELECT
  TO authenticated
  USING (true);

-- 2. Default share_location to TRUE going forward
ALTER TABLE public.catches ALTER COLUMN share_location SET DEFAULT true;

-- 3. Fix refresh function: fall back to most-recent catch when no weight is logged
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_entries(p_species_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
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
        WHERE c2.user_id = c.user_id AND c2.species_id = c.species_id AND c2.weight_lbs IS NOT NULL
        ORDER BY c2.weight_lbs DESC LIMIT 1),
      (SELECT c3.id FROM catches c3
        WHERE c3.user_id = c.user_id AND c3.species_id = c.species_id
        ORDER BY COALESCE(c3.caught_at, c3.created_at) DESC LIMIT 1)
    ),
    now()
  FROM catches c
  LEFT JOIN fish_species fs ON fs.id = c.species_id
  WHERE c.species_id IS NOT NULL
    AND (p_species_id IS NULL OR c.species_id = p_species_id)
  GROUP BY c.user_id, c.species_id, fs.name, c.species_name
  ON CONFLICT (user_id, species_id) DO UPDATE SET
    species_name = EXCLUDED.species_name,
    total_caught = EXCLUDED.total_caught,
    total_released = EXCLUDED.total_released,
    total_harvested = EXCLUDED.total_harvested,
    largest_weight_lbs = EXCLUDED.largest_weight_lbs,
    largest_length_in = EXCLUDED.largest_length_in,
    largest_catch_id = EXCLUDED.largest_catch_id,
    updated_at = now();

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

-- 4. Backfill all leaderboard entries
SELECT public.refresh_leaderboard_entries();