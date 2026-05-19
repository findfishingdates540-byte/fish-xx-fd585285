
-- 1. catch_comments table
CREATE TABLE public.catch_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catch_id uuid NOT NULL REFERENCES public.catches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL CHECK (length(trim(body)) > 0 AND length(body) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_catch_comments_catch ON public.catch_comments(catch_id, created_at DESC);
CREATE INDEX idx_catch_comments_user ON public.catch_comments(user_id);

ALTER TABLE public.catch_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view catch comments"
  ON public.catch_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can post own catch comments"
  ON public.catch_comments FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own catch comments"
  ON public.catch_comments FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users or admins can delete catch comments"
  ON public.catch_comments FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE TRIGGER trg_catch_comments_updated_at
  BEFORE UPDATE ON public.catch_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Update refresh_leaderboard_entries to count only verified catches
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_entries(p_species_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Wipe existing entries for affected species so unverified-only users disappear
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
          AND c2.is_verified = true AND c2.weight_lbs IS NOT NULL
        ORDER BY c2.weight_lbs DESC LIMIT 1),
      (SELECT c3.id FROM catches c3
        WHERE c3.user_id = c.user_id AND c3.species_id = c.species_id
          AND c3.is_verified = true
        ORDER BY COALESCE(c3.caught_at, c3.created_at) DESC LIMIT 1)
    ),
    now()
  FROM catches c
  LEFT JOIN fish_species fs ON fs.id = c.species_id
  WHERE c.species_id IS NOT NULL
    AND c.is_verified = true
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

-- 3. Trigger to auto-refresh when verification changes
CREATE OR REPLACE FUNCTION public.on_catch_verification_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.species_id IS NOT NULL THEN
    PERFORM public.refresh_leaderboard_entries(NEW.species_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_catch_verification_change ON public.catches;
CREATE TRIGGER trg_catch_verification_change
  AFTER UPDATE OF is_verified ON public.catches
  FOR EACH ROW
  WHEN (OLD.is_verified IS DISTINCT FROM NEW.is_verified)
  EXECUTE FUNCTION public.on_catch_verification_change();

-- 4. Allow admins to update any catch (for verification toggle)
CREATE POLICY "Admins can update any catch"
  ON public.catches FOR UPDATE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));
