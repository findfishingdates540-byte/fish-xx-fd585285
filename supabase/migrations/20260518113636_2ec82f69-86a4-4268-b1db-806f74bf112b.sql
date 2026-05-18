
-- ============ Fish Species enrichment ============
ALTER TABLE public.fish_species
  ADD COLUMN IF NOT EXISTS base_score smallint,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS water_type text,
  ADD COLUMN IF NOT EXISTS measurement_type text DEFAULT 'TL',
  ADD COLUMN IF NOT EXISTS safe_release boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trophy_quality numeric,
  ADD COLUMN IF NOT EXISTS trophy_trophy numeric,
  ADD COLUMN IF NOT EXISTS trophy_exceptional numeric,
  ADD COLUMN IF NOT EXISTS trophy_unit text;

CREATE INDEX IF NOT EXISTS idx_fish_species_category ON public.fish_species(category);
CREATE INDEX IF NOT EXISTS idx_fish_species_water_type ON public.fish_species(water_type);

-- ============ Catches enrichment ============
ALTER TABLE public.catches
  ADD COLUMN IF NOT EXISTS catch_method text,
  ADD COLUMN IF NOT EXISTS is_estimated_size boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trophy_level text,
  ADD COLUMN IF NOT EXISTS computed_score numeric;

-- ============ Scoring reference tables ============
CREATE TABLE IF NOT EXISTS public.scoring_catch_methods (
  key text PRIMARY KEY,
  label text NOT NULL,
  multiplier numeric NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scoring_trophy_bonuses (
  level text PRIMARY KEY,
  label text NOT NULL,
  bonus numeric NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.scoring_variety_milestones (
  species_count int PRIMARY KEY,
  bonus numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS public.scoring_streak_bonuses (
  streak_type text PRIMARY KEY,
  label text NOT NULL,
  bonus numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS public.scoring_tournament_multipliers (
  key text PRIMARY KEY,
  label text NOT NULL,
  multiplier_text text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.scoring_catch_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_trophy_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_variety_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_streak_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_tournament_multipliers ENABLE ROW LEVEL SECURITY;

-- Public read, admin write (5 tables)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'scoring_catch_methods','scoring_trophy_bonuses','scoring_variety_milestones',
    'scoring_streak_bonuses','scoring_tournament_multipliers'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "read_%1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "read_%1$s" ON public.%1$I FOR SELECT USING (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_write_%1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "admin_write_%1$s" ON public.%1$I FOR ALL USING (public.has_role((SELECT auth.uid()), ''admin'')) WITH CHECK (public.has_role((SELECT auth.uid()), ''admin''))', t);
  END LOOP;
END$$;

-- ============ Seed reference data ============
INSERT INTO public.scoring_catch_methods(key,label,multiplier,sort_order) VALUES
  ('shore','Land-Based Shore Fishing',1.30,1),
  ('surf','Surf Fishing',1.25,2),
  ('kayak','Kayak / Paddlecraft',1.20,3),
  ('pier','Pier / Jetty',1.15,4),
  ('flats','Flats Boat / Small Skiff',1.00,5),
  ('private_offshore','Private Offshore Boat',0.95,6),
  ('charter','Charter Boat',0.85,7)
ON CONFLICT (key) DO UPDATE SET label=EXCLUDED.label, multiplier=EXCLUDED.multiplier, sort_order=EXCLUDED.sort_order;

INSERT INTO public.scoring_trophy_bonuses(level,label,bonus,sort_order) VALUES
  ('keeper','Legal Keeper',0,1),
  ('quality','Quality Catch',0.5,2),
  ('trophy','Trophy Fish',1,3),
  ('exceptional','Exceptional Trophy',2,4)
ON CONFLICT (level) DO UPDATE SET label=EXCLUDED.label, bonus=EXCLUDED.bonus, sort_order=EXCLUDED.sort_order;

INSERT INTO public.scoring_variety_milestones(species_count,bonus) VALUES
  (5,5),(10,15),(25,50),(50,150),(100,500)
ON CONFLICT (species_count) DO UPDATE SET bonus=EXCLUDED.bonus;

INSERT INTO public.scoring_streak_bonuses(streak_type,label,bonus) VALUES
  ('daily','Daily Catch Streak',1),
  ('weekly','Weekly Catch Streak',10),
  ('monthly','Monthly Catch Streak',50)
ON CONFLICT (streak_type) DO UPDATE SET label=EXCLUDED.label, bonus=EXCLUDED.bonus;

INSERT INTO public.scoring_tournament_multipliers(key,label,multiplier_text,sort_order) VALUES
  ('featured_species','Featured Species Week','2x',1),
  ('state_challenge','State Challenge','1.5x',2),
  ('seasonal_migration','Seasonal Migration Event','2x',3),
  ('rookie_weekend','Rookie Weekend','Beginner Species Bonus',4),
  ('land_based','Land-Based Challenge','Shore Multiplier Boost',5)
ON CONFLICT (key) DO UPDATE SET label=EXCLUDED.label, multiplier_text=EXCLUDED.multiplier_text, sort_order=EXCLUDED.sort_order;

-- ============ Seed / upsert species ============
-- Helper: upsert by lowercase(name)
WITH src(name, base_score, category, water_type, measurement_type, safe_release) AS (VALUES
  -- Billfish (FL/LJFL, safe release)
  ('Blue Marlin',10,'billfish','saltwater','LJFL',true),
  ('Black Marlin',10,'billfish','saltwater','LJFL',true),
  ('White Marlin',9,'billfish','saltwater','LJFL',true),
  ('Striped Marlin',9,'billfish','saltwater','LJFL',true),
  ('Sailfish',9,'billfish','saltwater','LJFL',true),
  ('Swordfish',10,'billfish','saltwater','LJFL',true),
  ('Spearfish',8,'billfish','saltwater','LJFL',true),
  -- Tuna & Pelagics
  ('Bluefin Tuna',10,'tuna_pelagic','saltwater','FL',true),
  ('Yellowfin Tuna',9,'tuna_pelagic','saltwater','FL',false),
  ('Bigeye Tuna',9,'tuna_pelagic','saltwater','FL',false),
  ('Albacore Tuna',7,'tuna_pelagic','saltwater','FL',false),
  ('Blackfin Tuna',6,'tuna_pelagic','saltwater','FL',false),
  ('Skipjack Tuna',4,'tuna_pelagic','saltwater','FL',false),
  ('Wahoo',8,'tuna_pelagic','saltwater','FL',false),
  ('Mahi-Mahi',7,'tuna_pelagic','saltwater','FL',false),
  ('King Mackerel',6,'tuna_pelagic','saltwater','FL',false),
  ('Spanish Mackerel',4,'tuna_pelagic','saltwater','FL',false),
  ('Cero Mackerel',5,'tuna_pelagic','saltwater','FL',false),
  ('Cobia',7,'tuna_pelagic','saltwater','TL',false),
  ('Amberjack',8,'tuna_pelagic','saltwater','FL',false),
  ('African Pompano',7,'tuna_pelagic','saltwater','TL',false),
  ('Tripletail',6,'tuna_pelagic','saltwater','TL',false),
  -- Reef & Bottom
  ('Goliath Grouper',9,'reef_bottom','saltwater','TL',true),
  ('Warsaw Grouper',9,'reef_bottom','saltwater','TL',false),
  ('Gag Grouper',7,'reef_bottom','saltwater','TL',false),
  ('Red Grouper',6,'reef_bottom','saltwater','TL',false),
  ('Black Grouper',8,'reef_bottom','saltwater','TL',false),
  ('Nassau Grouper',8,'reef_bottom','saltwater','TL',false),
  ('Snowy Grouper',8,'reef_bottom','saltwater','TL',false),
  ('Scamp Grouper',7,'reef_bottom','saltwater','TL',false),
  ('Cubera Snapper',9,'reef_bottom','saltwater','TL',false),
  ('Mangrove Snapper',5,'reef_bottom','saltwater','TL',false),
  ('Mutton Snapper',7,'reef_bottom','saltwater','TL',false),
  ('Yellowtail Snapper',5,'reef_bottom','saltwater','TL',false),
  ('Red Snapper',6,'reef_bottom','saltwater','TL',false),
  ('Vermillion Snapper',3,'reef_bottom','saltwater','TL',false),
  ('Lane Snapper',3,'reef_bottom','saltwater','TL',false),
  ('Hogfish',7,'reef_bottom','saltwater','TL',false),
  ('Triggerfish',4,'reef_bottom','saltwater','TL',false),
  ('Porgy',3,'reef_bottom','saltwater','TL',false),
  ('Sheepshead',5,'reef_bottom','saltwater','TL',false),
  ('Tilefish',7,'reef_bottom','saltwater','TL',false),
  -- Inshore Saltwater
  ('Tarpon',9,'inshore_saltwater','saltwater','TL',true),
  ('Juvenile Tarpon',7,'inshore_saltwater','saltwater','TL',false),
  ('Snook',7,'inshore_saltwater','saltwater','TL',false),
  ('Redfish',5,'inshore_saltwater','saltwater','TL',false),
  ('Speckled Trout',5,'inshore_saltwater','saltwater','TL',false),
  ('Black Drum',5,'inshore_saltwater','saltwater','TL',false),
  ('Permit',9,'inshore_saltwater','saltwater','FL',false),
  ('Bonefish',8,'inshore_saltwater','saltwater','FL',false),
  ('Jack Crevalle',5,'inshore_saltwater','saltwater','FL',false),
  ('Ladyfish',2,'inshore_saltwater','saltwater','TL',false),
  ('Flounder',4,'inshore_saltwater','saltwater','TL',false),
  ('Bluefish',4,'inshore_saltwater','saltwater','FL',false),
  ('Weakfish',5,'inshore_saltwater','saltwater','TL',false),
  ('Pompano',5,'inshore_saltwater','saltwater','FL',false),
  ('Whiting',2,'inshore_saltwater','saltwater','TL',false),
  ('Croaker',1,'inshore_saltwater','saltwater','TL',false),
  ('Spot',1,'inshore_saltwater','saltwater','TL',false),
  ('Stingray',3,'inshore_saltwater','saltwater','TL',true),
  -- Sharks (safe release)
  ('Great Hammerhead',10,'shark','saltwater','FL',true),
  ('Tiger Shark',9,'shark','saltwater','FL',true),
  ('Bull Shark',8,'shark','saltwater','FL',true),
  ('Lemon Shark',6,'shark','saltwater','FL',true),
  ('Blacktip Shark',5,'shark','saltwater','FL',true),
  ('Spinner Shark',5,'shark','saltwater','FL',true),
  ('Mako Shark',9,'shark','saltwater','FL',true),
  ('Thresher Shark',9,'shark','saltwater','FL',true),
  ('Nurse Shark',3,'shark','saltwater','FL',true),
  ('Sandbar Shark',5,'shark','saltwater','FL',true),
  -- Bass
  ('Largemouth Bass',5,'bass','freshwater','TL',false),
  ('Smallmouth Bass',7,'bass','freshwater','TL',false),
  ('Peacock Bass',6,'bass','freshwater','TL',false),
  ('Spotted Bass',5,'bass','freshwater','TL',false),
  ('Guadalupe Bass',5,'bass','freshwater','TL',false),
  ('Shoal Bass',6,'bass','freshwater','TL',false),
  ('Striped Bass',7,'bass','freshwater','TL',false),
  ('White Bass',4,'bass','freshwater','TL',false),
  ('Hybrid Bass',5,'bass','freshwater','TL',false),
  -- Trout & Salmon
  ('Rainbow Trout',5,'trout_salmon','freshwater','TL',false),
  ('Brown Trout',7,'trout_salmon','freshwater','TL',false),
  ('Brook Trout',6,'trout_salmon','freshwater','TL',false),
  ('Lake Trout',7,'trout_salmon','freshwater','TL',false),
  ('Cutthroat Trout',6,'trout_salmon','freshwater','TL',false),
  ('Golden Trout',8,'trout_salmon','freshwater','TL',false),
  ('Arctic Char',8,'trout_salmon','freshwater','TL',false),
  ('Chinook Salmon',9,'trout_salmon','freshwater','TL',false),
  ('Coho Salmon',7,'trout_salmon','freshwater','TL',false),
  ('Sockeye Salmon',7,'trout_salmon','freshwater','TL',false),
  ('Atlantic Salmon',9,'trout_salmon','freshwater','TL',false),
  ('Pink Salmon',4,'trout_salmon','freshwater','TL',false),
  ('Chum Salmon',5,'trout_salmon','freshwater','TL',false),
  -- Exotic Freshwater
  ('Alligator Gar',9,'exotic_freshwater','freshwater','TL',true),
  ('Musky',9,'exotic_freshwater','freshwater','TL',false),
  ('Northern Pike',7,'exotic_freshwater','freshwater','TL',false),
  ('Walleye',6,'exotic_freshwater','freshwater','TL',false),
  ('Snakehead',6,'exotic_freshwater','freshwater','TL',false),
  ('Bowfin',5,'exotic_freshwater','freshwater','TL',false),
  ('Freshwater Drum',3,'exotic_freshwater','freshwater','TL',false),
  ('Carp',5,'exotic_freshwater','freshwater','TL',false),
  ('Grass Carp',6,'exotic_freshwater','freshwater','TL',false),
  ('Pacu',6,'exotic_freshwater','freshwater','TL',false),
  ('Oscar',3,'exotic_freshwater','freshwater','TL',false),
  ('Clown Knifefish',8,'exotic_freshwater','freshwater','TL',false),
  ('Arapaima',10,'exotic_freshwater','freshwater','TL',true),
  -- Catfish
  ('Blue Catfish',6,'catfish','freshwater','TL',false),
  ('Flathead Catfish',7,'catfish','freshwater','TL',false),
  ('Channel Catfish',4,'catfish','freshwater','TL',false),
  ('White Catfish',3,'catfish','freshwater','TL',false),
  ('Bullhead Catfish',2,'catfish','freshwater','TL',false),
  -- International Exotic
  ('Giant Trevally',10,'international_exotic','saltwater','FL',true),
  ('Roosterfish',8,'international_exotic','saltwater','FL',false),
  ('Dorado (Golden Dorado)',9,'international_exotic','freshwater','TL',false),
  ('Nile Perch',9,'international_exotic','freshwater','TL',false),
  ('Tigerfish',9,'international_exotic','freshwater','TL',false),
  ('Giant Snakehead',8,'international_exotic','freshwater','TL',false),
  ('Barramundi',7,'international_exotic','saltwater','TL',false),
  ('Murray Cod',8,'international_exotic','freshwater','TL',false),
  ('Peacock Grouper',6,'international_exotic','saltwater','TL',false),
  ('Trevally Species',7,'international_exotic','saltwater','FL',false)
),
existing AS (
  UPDATE public.fish_species fs
  SET base_score = src.base_score,
      category = src.category,
      water_type = src.water_type,
      measurement_type = COALESCE(fs.measurement_type, src.measurement_type),
      safe_release = src.safe_release
  FROM src
  WHERE LOWER(fs.name) = LOWER(src.name)
  RETURNING src.name
)
INSERT INTO public.fish_species(name, base_score, category, water_type, measurement_type, safe_release)
SELECT src.name, src.base_score, src.category, src.water_type, src.measurement_type, src.safe_release
FROM src
WHERE LOWER(src.name) NOT IN (SELECT LOWER(name) FROM existing);

-- Trophy thresholds (subset from doc)
WITH thresholds(name, q, t, e, unit) AS (VALUES
  ('Largemouth Bass', 5, 8, 10, 'lb'),
  ('Peacock Bass', 4, 7, 9, 'lb'),
  ('Musky', 40, 48, 54, 'in'),
  ('Alligator Gar', 5, 6, 7, 'ft'),
  ('Snook', 30, 40, 45, 'in'),
  ('Redfish', 30, 40, 45, 'in'),
  ('Tarpon', 80, 120, 180, 'lb'),
  ('Sailfish', 70, 100, 140, 'lb'),
  ('Blue Marlin', 250, 500, 800, 'lb'),
  ('Yellowfin Tuna', 80, 150, 250, 'lb')
)
UPDATE public.fish_species fs
SET trophy_quality = thresholds.q,
    trophy_trophy = thresholds.t,
    trophy_exceptional = thresholds.e,
    trophy_unit = thresholds.unit
FROM thresholds
WHERE LOWER(fs.name) = LOWER(thresholds.name);

-- ============ Score-compute trigger ============
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
BEFORE INSERT OR UPDATE OF species_id, catch_method, trophy_level
ON public.catches
FOR EACH ROW EXECUTE FUNCTION public.compute_catch_score();

-- Backfill computed_score for existing rows that have species
UPDATE public.catches SET species_id = species_id WHERE computed_score IS NULL AND species_id IS NOT NULL;
