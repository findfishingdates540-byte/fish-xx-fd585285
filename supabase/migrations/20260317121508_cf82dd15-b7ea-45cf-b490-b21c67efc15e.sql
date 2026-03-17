
-- 1. Add new columns to catches table
ALTER TABLE public.catches
  ADD COLUMN IF NOT EXISTS catch_status text NOT NULL DEFAULT 'released',
  ADD COLUMN IF NOT EXISTS cover_photo_url text,
  ADD COLUMN IF NOT EXISTS measurement_photo_url text,
  ADD COLUMN IF NOT EXISTS general_location text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- 2. Create catch_photo_type enum
CREATE TYPE public.catch_photo_type AS ENUM ('cover', 'measurement', 'general');

-- 3. Create catch_photos table
CREATE TABLE public.catch_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catch_id uuid NOT NULL REFERENCES public.catches(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_type catch_photo_type NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.catch_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view catch photos" ON public.catch_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own catch photos" ON public.catch_photos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.catches WHERE catches.id = catch_photos.catch_id AND catches.user_id = (SELECT auth.uid())));
CREATE POLICY "Users can delete own catch photos" ON public.catch_photos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.catches WHERE catches.id = catch_photos.catch_id AND catches.user_id = (SELECT auth.uid())));

CREATE INDEX idx_catch_photos_catch_id ON public.catch_photos(catch_id);

-- 4. Create challenge_type enum
CREATE TYPE public.challenge_type AS ENUM ('largest_fish', 'most_caught', 'species_specific', 'team');

-- 5. Create leaderboard_entries table
CREATE TABLE public.leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  species_id uuid REFERENCES public.fish_species(id) ON DELETE CASCADE,
  species_name text NOT NULL,
  total_caught int NOT NULL DEFAULT 0,
  total_released int NOT NULL DEFAULT 0,
  total_harvested int NOT NULL DEFAULT 0,
  largest_weight_lbs numeric,
  largest_length_in numeric,
  largest_catch_id uuid REFERENCES public.catches(id) ON DELETE SET NULL,
  rank_by_weight int,
  rank_by_count int,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, species_id)
);
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage leaderboard" ON public.leaderboard_entries FOR ALL TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE INDEX idx_leaderboard_species ON public.leaderboard_entries(species_id);
CREATE INDEX idx_leaderboard_user ON public.leaderboard_entries(user_id);
CREATE INDEX idx_leaderboard_rank_weight ON public.leaderboard_entries(species_id, rank_by_weight);
CREATE INDEX idx_leaderboard_rank_count ON public.leaderboard_entries(species_id, rank_by_count);

-- 6. Create angler_badges table
CREATE TABLE public.angler_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_type text NOT NULL,
  badge_name text NOT NULL,
  badge_description text,
  species_id uuid REFERENCES public.fish_species(id) ON DELETE SET NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.angler_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON public.angler_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert badges" ON public.angler_badges FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_badges_user ON public.angler_badges(user_id);

-- 7. Create fishing_challenges table
CREATE TABLE public.fishing_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  challenge_type challenge_type NOT NULL DEFAULT 'largest_fish',
  species_id uuid REFERENCES public.fish_species(id) ON DELETE SET NULL,
  target_species_name text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  created_by uuid NOT NULL,
  is_official boolean NOT NULL DEFAULT false,
  rules jsonb DEFAULT '{}'::jsonb,
  prizes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fishing_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenges" ON public.fishing_challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage challenges" ON public.fishing_challenges FOR ALL TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));
CREATE POLICY "Users can create challenges" ON public.fishing_challenges FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE INDEX idx_challenges_status ON public.fishing_challenges(status);

-- 8. Create challenge_participants table
CREATE TABLE public.challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.fishing_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  team_id uuid,
  score numeric NOT NULL DEFAULT 0,
  rank int,
  best_catch_id uuid REFERENCES public.catches(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants" ON public.challenge_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own participation" ON public.challenge_participants FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);

-- 9. Create fishing_teams table
CREATE TABLE public.fishing_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  skill_level fishing_experience NOT NULL DEFAULT 'beginner',
  captain_id uuid NOT NULL,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fishing_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams" ON public.fishing_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create teams" ON public.fishing_teams FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = captain_id);
CREATE POLICY "Captains can update teams" ON public.fishing_teams FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = captain_id);
CREATE POLICY "Captains can delete teams" ON public.fishing_teams FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = captain_id);

-- 10. Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.fishing_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team members" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join teams" ON public.team_members FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Captains can manage members" ON public.team_members FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fishing_teams WHERE fishing_teams.id = team_members.team_id AND fishing_teams.captain_id = (SELECT auth.uid())));

-- Add FK from challenge_participants.team_id to fishing_teams
ALTER TABLE public.challenge_participants
  ADD CONSTRAINT challenge_participants_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.fishing_teams(id) ON DELETE SET NULL;

-- 11. Create refresh_leaderboard_entries function
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_entries(p_species_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert leaderboard entries from catches data
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
    (SELECT c2.id FROM catches c2 WHERE c2.user_id = c.user_id AND c2.species_id = c.species_id AND c2.weight_lbs IS NOT NULL ORDER BY c2.weight_lbs DESC LIMIT 1),
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

  -- Update rank_by_weight per species
  UPDATE leaderboard_entries le SET rank_by_weight = sub.rw
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY species_id ORDER BY largest_weight_lbs DESC NULLS LAST, total_caught DESC) as rw
    FROM leaderboard_entries
    WHERE (p_species_id IS NULL OR species_id = p_species_id)
  ) sub
  WHERE le.id = sub.id;

  -- Update rank_by_count per species
  UPDATE leaderboard_entries le SET rank_by_count = sub.rc
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY species_id ORDER BY total_caught DESC, largest_weight_lbs DESC NULLS LAST) as rc
    FROM leaderboard_entries
    WHERE (p_species_id IS NULL OR species_id = p_species_id)
  ) sub
  WHERE le.id = sub.id;
END;
$$;

-- 12. Create check_and_award_badges function
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_catches int;
  v_total_species int;
  v_total_released int;
  v_max_weight numeric;
  v_has_rank1 boolean;
BEGIN
  SELECT COUNT(*), COUNT(DISTINCT species_id), COUNT(*) FILTER (WHERE catch_status = 'released'), MAX(weight_lbs)
  INTO v_total_catches, v_total_species, v_total_released, v_max_weight
  FROM catches WHERE user_id = p_user_id;

  SELECT EXISTS (SELECT 1 FROM leaderboard_entries WHERE user_id = p_user_id AND rank_by_weight = 1)
  INTO v_has_rank1;

  -- First Catch
  IF v_total_catches >= 1 AND NOT EXISTS (SELECT 1 FROM angler_badges WHERE user_id = p_user_id AND badge_type = 'first_catch') THEN
    INSERT INTO angler_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (p_user_id, 'first_catch', 'First Catch', 'Logged your first catch!');
  END IF;

  -- Species Collector (10+ species)
  IF v_total_species >= 10 AND NOT EXISTS (SELECT 1 FROM angler_badges WHERE user_id = p_user_id AND badge_type = 'species_collector') THEN
    INSERT INTO angler_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (p_user_id, 'species_collector', 'Species Collector', 'Caught 10+ different species');
  END IF;

  -- Century Club (100 catches)
  IF v_total_catches >= 100 AND NOT EXISTS (SELECT 1 FROM angler_badges WHERE user_id = p_user_id AND badge_type = '100_club') THEN
    INSERT INTO angler_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (p_user_id, '100_club', 'Century Club', '100 total catches logged');
  END IF;

  -- Big Game Hunter (50+ lbs)
  IF v_max_weight >= 50 AND NOT EXISTS (SELECT 1 FROM angler_badges WHERE user_id = p_user_id AND badge_type = 'big_game') THEN
    INSERT INTO angler_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (p_user_id, 'big_game', 'Big Game Hunter', 'Caught a fish over 50 lbs');
  END IF;

  -- Release Champion (50+ released)
  IF v_total_released >= 50 AND NOT EXISTS (SELECT 1 FROM angler_badges WHERE user_id = p_user_id AND badge_type = 'release_champion') THEN
    INSERT INTO angler_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (p_user_id, 'release_champion', 'Release Champion', 'Released 50+ fish');
  END IF;

  -- Top Angler (rank #1 for any species)
  IF v_has_rank1 AND NOT EXISTS (SELECT 1 FROM angler_badges WHERE user_id = p_user_id AND badge_type = 'top_angler') THEN
    INSERT INTO angler_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (p_user_id, 'top_angler', 'Top Angler', 'Ranked #1 for a species');
  END IF;
END;
$$;

-- 13. Create get_species_leaderboard function
CREATE OR REPLACE FUNCTION public.get_species_leaderboard(p_species_id uuid, p_sort_by text DEFAULT 'weight', p_limit int DEFAULT 50)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  photo text,
  total_caught int,
  total_released int,
  total_harvested int,
  largest_weight_lbs numeric,
  largest_length_in numeric,
  largest_catch_id uuid,
  rank int,
  general_location text,
  caught_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    le.user_id,
    p.display_name,
    p.photos[1] as photo,
    le.total_caught,
    le.total_released,
    le.total_harvested,
    le.largest_weight_lbs,
    le.largest_length_in,
    le.largest_catch_id,
    CASE WHEN p_sort_by = 'weight' THEN le.rank_by_weight ELSE le.rank_by_count END as rank,
    c.general_location,
    c.caught_at
  FROM leaderboard_entries le
  JOIN profiles p ON p.id = le.user_id
  LEFT JOIN catches c ON c.id = le.largest_catch_id
  WHERE le.species_id = p_species_id
  ORDER BY
    CASE WHEN p_sort_by = 'weight' THEN le.rank_by_weight ELSE le.rank_by_count END ASC
  LIMIT p_limit;
$$;

-- 14. Index on catches for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_catches_species_user ON public.catches(species_id, user_id);
CREATE INDEX IF NOT EXISTS idx_catches_user_species ON public.catches(user_id, species_id);
