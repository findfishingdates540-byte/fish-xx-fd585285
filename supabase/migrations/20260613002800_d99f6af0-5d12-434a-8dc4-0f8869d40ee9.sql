
-- ============================================================
-- 1. Extend fishing_challenges with championship configuration
-- ============================================================
ALTER TABLE public.fishing_challenges
  ADD COLUMN IF NOT EXISTS is_championship boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS best_n_catches integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS diversity_bonuses jsonb NOT NULL DEFAULT
    '[{"species":5,"bonus":100},{"species":8,"bonus":250},{"species":10,"bonus":500}]'::jsonb,
  ADD COLUMN IF NOT EXISTS calcutta_entry_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS calcutta_payout_split jsonb NOT NULL DEFAULT
    '{"first":0.5,"second":0.3,"third":0.2,"platform":0.25}'::jsonb,
  ADD COLUMN IF NOT EXISTS banner_url text;

-- ============================================================
-- 2. championship_species_tiers — per-championship species list
-- ============================================================
CREATE TABLE IF NOT EXISTS public.championship_species_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid NOT NULL REFERENCES public.fishing_challenges(id) ON DELETE CASCADE,
  species_id uuid REFERENCES public.fish_species(id) ON DELETE CASCADE,
  species_name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('common','premium')),
  points integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (championship_id, species_id),
  UNIQUE (championship_id, species_name)
);
CREATE INDEX IF NOT EXISTS idx_champ_species_tiers_champ ON public.championship_species_tiers(championship_id);

GRANT SELECT ON public.championship_species_tiers TO anon, authenticated;
GRANT ALL ON public.championship_species_tiers TO service_role;

ALTER TABLE public.championship_species_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view championship species tiers"
  ON public.championship_species_tiers FOR SELECT
  USING (true);
CREATE POLICY "Admins manage championship species tiers"
  ON public.championship_species_tiers FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

-- ============================================================
-- 3. championship_teams — team registrations + cached score
-- ============================================================
CREATE TABLE IF NOT EXISTS public.championship_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid NOT NULL REFERENCES public.fishing_challenges(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.fishing_teams(id) ON DELETE CASCADE,
  registered_by uuid NOT NULL,
  calcutta_paid boolean NOT NULL DEFAULT false,
  calcutta_paid_at timestamptz,
  stripe_session_id text,
  total_points numeric NOT NULL DEFAULT 0,
  qualifying_catches integer NOT NULL DEFAULT 0,
  distinct_species integer NOT NULL DEFAULT 0,
  final_placement integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (championship_id, team_id)
);
CREATE INDEX IF NOT EXISTS idx_champ_teams_champ ON public.championship_teams(championship_id);
CREATE INDEX IF NOT EXISTS idx_champ_teams_team ON public.championship_teams(team_id);

GRANT SELECT ON public.championship_teams TO anon, authenticated;
GRANT INSERT, UPDATE ON public.championship_teams TO authenticated;
GRANT ALL ON public.championship_teams TO service_role;

ALTER TABLE public.championship_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view championship teams"
  ON public.championship_teams FOR SELECT
  USING (true);
CREATE POLICY "Captains can register their team"
  ON public.championship_teams FOR INSERT
  TO authenticated
  WITH CHECK (
    registered_by = (SELECT auth.uid())
    AND (
      public.is_team_captain((SELECT auth.uid()), team_id)
      OR public.has_role((SELECT auth.uid()), 'admin')
    )
  );
CREATE POLICY "Captains or admins can update registration"
  ON public.championship_teams FOR UPDATE
  TO authenticated
  USING (
    public.is_team_captain((SELECT auth.uid()), team_id)
    OR public.has_role((SELECT auth.uid()), 'admin')
  )
  WITH CHECK (
    public.is_team_captain((SELECT auth.uid()), team_id)
    OR public.has_role((SELECT auth.uid()), 'admin')
  );
CREATE POLICY "Admins can delete registrations"
  ON public.championship_teams FOR DELETE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE TRIGGER trg_championship_teams_updated_at
  BEFORE UPDATE ON public.championship_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. Helper: score one catch within a championship
-- ============================================================
CREATE OR REPLACE FUNCTION public.score_championship_catch(
  p_championship_id uuid,
  p_species_id uuid,
  p_species_name text,
  p_trophy_level text
) RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tier text;
  v_base numeric;
BEGIN
  SELECT tier, points INTO v_tier, v_base
  FROM public.championship_species_tiers
  WHERE championship_id = p_championship_id
    AND (
      (p_species_id IS NOT NULL AND species_id = p_species_id)
      OR (species_name ILIKE p_species_name)
    )
  ORDER BY (species_id IS NOT NULL) DESC
  LIMIT 1;

  IF v_tier IS NULL THEN
    RETURN 0;
  END IF;

  IF v_tier = 'common' THEN
    RETURN COALESCE(v_base, 10);
  END IF;

  -- premium: trophy_level bonuses, default to Standard
  RETURN CASE LOWER(COALESCE(p_trophy_level, 'standard'))
    WHEN 'trophy' THEN 100
    WHEN 'large'  THEN 75
    ELSE 50
  END;
END;
$$;

-- ============================================================
-- 5. Recalculate championship scores
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalc_championship_scores(p_championship_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
      WHERE c.is_private = false
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

    -- diversity bonus over the top-N qualifying catches
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
$$;

GRANT EXECUTE ON FUNCTION public.recalc_championship_scores(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.score_championship_catch(uuid, uuid, text, text) TO anon, authenticated, service_role;

-- ============================================================
-- 6. Trigger: recalc when a championship catch is approved/edited
-- ============================================================
CREATE OR REPLACE FUNCTION public.on_catch_change_recalc_championship()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_champ_id uuid;
BEGIN
  v_champ_id := COALESCE(NEW.challenge_id, OLD.challenge_id);
  IF v_champ_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  IF EXISTS (SELECT 1 FROM public.fishing_challenges
              WHERE id = v_champ_id AND is_championship = true) THEN
    PERFORM public.recalc_championship_scores(v_champ_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_catches_championship_recalc ON public.catches;
CREATE TRIGGER trg_catches_championship_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.catches
  FOR EACH ROW EXECUTE FUNCTION public.on_catch_change_recalc_championship();

-- ============================================================
-- 7. Finalize Calcutta payouts (top 3 paying teams)
-- ============================================================
CREATE OR REPLACE FUNCTION public.finalize_championship_calcutta(p_championship_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ch RECORD;
  v_pool numeric;
  v_paying_count int;
  v_platform_pct numeric;
  v_first_pct numeric;
  v_second_pct numeric;
  v_third_pct numeric;
  v_distributable numeric;
  team_row RECORD;
  v_payout numeric;
  v_pct numeric;
  v_placement int := 0;
  v_results jsonb := '[]'::jsonb;
BEGIN
  IF NOT public.has_role((SELECT auth.uid()), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO ch FROM public.fishing_challenges
    WHERE id = p_championship_id AND is_championship = true;
  IF ch IS NULL THEN
    RAISE EXCEPTION 'Championship not found';
  END IF;

  SELECT COUNT(*) INTO v_paying_count
    FROM public.championship_teams
   WHERE championship_id = p_championship_id AND calcutta_paid = true;

  v_pool := COALESCE(ch.calcutta_entry_fee, 0) * v_paying_count;
  v_platform_pct := COALESCE((ch.calcutta_payout_split->>'platform')::numeric, 0.25);
  v_first_pct  := COALESCE((ch.calcutta_payout_split->>'first')::numeric, 0.5);
  v_second_pct := COALESCE((ch.calcutta_payout_split->>'second')::numeric, 0.3);
  v_third_pct  := COALESCE((ch.calcutta_payout_split->>'third')::numeric, 0.2);
  v_distributable := v_pool * (1 - v_platform_pct);

  IF v_distributable <= 0 OR v_paying_count = 0 THEN
    RETURN jsonb_build_object('pool', v_pool, 'distributable', v_distributable, 'payouts', '[]'::jsonb);
  END IF;

  FOR team_row IN
    SELECT ct.id AS ct_id, ct.team_id, ct.total_points, ft.captain_id, ft.name AS team_name
    FROM public.championship_teams ct
    JOIN public.fishing_teams ft ON ft.id = ct.team_id
    WHERE ct.championship_id = p_championship_id AND ct.calcutta_paid = true
    ORDER BY ct.total_points DESC NULLS LAST, ct.created_at ASC
    LIMIT 3
  LOOP
    v_placement := v_placement + 1;
    v_pct := CASE v_placement WHEN 1 THEN v_first_pct WHEN 2 THEN v_second_pct ELSE v_third_pct END;
    v_payout := ROUND((v_distributable * v_pct)::numeric, 2);

    UPDATE public.championship_teams
       SET final_placement = v_placement
     WHERE id = team_row.ct_id;

    INSERT INTO public.prize_payouts (
      challenge_id, winner_user_id, amount, payout_type, status, notes
    ) VALUES (
      p_championship_id,
      team_row.captain_id,
      v_payout,
      'cash',
      'pending',
      'Calcutta payout · Place ' || v_placement || ' · Team ' || team_row.team_name
    );

    v_results := v_results || jsonb_build_object(
      'placement', v_placement,
      'team_id', team_row.team_id,
      'team_name', team_row.team_name,
      'amount', v_payout
    );
  END LOOP;

  RETURN jsonb_build_object(
    'pool', v_pool,
    'distributable', v_distributable,
    'payouts', v_results
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_championship_calcutta(uuid) TO authenticated, service_role;

-- ============================================================
-- 8. Seed the 2026 Global Shark Championship
-- ============================================================
DO $$
DECLARE
  v_admin uuid;
  v_champ_id uuid;
  v_premium text[] := ARRAY[
    'Bull Shark','Lemon Shark','Sandbar Shark','Dusky Shark','Tiger Shark',
    'Great Hammerhead','Scalloped Hammerhead','Mako Shark','Thresher Shark',
    'Silky Shark','Oceanic Whitetip Shark','Porbeagle Shark','Salmon Shark',
    'Shark, Tiger','Shark, Mako','Shark, Hammerhead','Shark, Thresher',
    'Shark, Porbeagle','Shark, White'
  ];
  v_common text[] := ARRAY[
    'Blacktip Shark','Spinner Shark','Nurse Shark','Atlantic Sharpnose Shark',
    'Bonnethead Shark','Shark, Blacktip','Shark, Bonnethead','Shark, Blue',
    'Shark, Whaler','Shark, Tope'
  ];
  s text;
  v_species_id uuid;
BEGIN
  SELECT user_id INTO v_admin FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF v_admin IS NULL THEN RETURN; END IF;

  IF EXISTS (SELECT 1 FROM public.fishing_challenges
             WHERE title = 'Fish-X Global Shark Championship' AND is_championship = true) THEN
    RETURN;
  END IF;

  INSERT INTO public.fishing_challenges (
    title, description, challenge_type, start_date, end_date, status,
    created_by, is_official, is_championship, best_n_catches,
    calcutta_entry_fee, prize_description, prize_type, is_admin_funded,
    prizes, rules
  ) VALUES (
    'Fish-X Global Shark Championship',
    'The world''s largest catch-photo-release shark tournament. Worldwide team participation, January 1 – December 31. Team size 2–6 anglers. Free entry for the $5,000 Fish-X Championship prize pool; optional $100 Team Calcutta side-pot.',
    'most_caught'::challenge_type,
    '2026-01-01'::date,
    '2026-12-31'::date,
    'active',
    v_admin,
    true,
    true,
    20,
    100,
    '$5,000 Guaranteed Prize Pool (free entry). Optional Team Calcutta pays Top 3 (50/30/20 of 75% pool).',
    'cash',
    true,
    jsonb_build_object('total', 5000, 'location', 'Worldwide'),
    jsonb_build_object('description',
      'Team scoring: only your team''s best 20 sharks count. Common sharks = 10 pts. Premium sharks = 50 pts (Standard), 75 pts (Large), 100 pts (Trophy) — Fish-X judges determine size from your photos/video. Species diversity bonuses: 5 species +100, 8 species +250, 10 species +500. Required for each catch: Fish-X verification code, shark photo, team, species ID. Strongly encouraged: release video.')
  )
  RETURNING id INTO v_champ_id;

  -- Seed Common-tier species
  FOREACH s IN ARRAY v_common LOOP
    SELECT id INTO v_species_id FROM public.fish_species WHERE name ILIKE s LIMIT 1;
    INSERT INTO public.championship_species_tiers (championship_id, species_id, species_name, tier, points)
    VALUES (v_champ_id, v_species_id, s, 'common', 10)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Seed Premium-tier species
  FOREACH s IN ARRAY v_premium LOOP
    SELECT id INTO v_species_id FROM public.fish_species WHERE name ILIKE s LIMIT 1;
    INSERT INTO public.championship_species_tiers (championship_id, species_id, species_name, tier, points)
    VALUES (v_champ_id, v_species_id, s, 'premium', 50)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
