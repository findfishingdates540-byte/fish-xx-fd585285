
-- 1) Hard-delete any White Shark from championship tiers (defensive)
DELETE FROM public.championship_species_tiers
WHERE species_name ~* '(^|[^a-z])white shark|shark,\s*white|carcharodon';

-- 2) Add "Other Shark" generic species to master list (if missing)
INSERT INTO public.fish_species (name, category, water_type, measurement_type, base_score)
SELECT 'Other Shark', 'Saltwater', 'Saltwater', 'length_weight', 5
WHERE NOT EXISTS (SELECT 1 FROM public.fish_species WHERE name = 'Other Shark');

-- 3) Add missing common sharks to the Shark Championship tier list
INSERT INTO public.championship_species_tiers (championship_id, species_name, tier, points, species_id)
SELECT '7f8b8f5c-cf1f-41a7-ad8d-e20350c87f30'::uuid, s.name, 'common', 10,
       (SELECT id FROM public.fish_species WHERE name = s.name LIMIT 1)
FROM (VALUES
  ('Other Shark'),
  ('Sand Tiger Shark'),
  ('Smooth Dogfish'),
  ('Spiny Dogfish'),
  ('Finetooth Shark'),
  ('Blacknose Shark'),
  ('Bamboo Shark'),
  ('Leopard Shark'),
  ('Caribbean Reef Shark'),
  ('Grey Reef Shark'),
  ('Blacktip Reef Shark'),
  ('Whitetip Reef Shark'),
  ('Small Catshark'),
  ('Epaulette Shark')
) AS s(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.championship_species_tiers t
  WHERE t.championship_id = '7f8b8f5c-cf1f-41a7-ad8d-e20350c87f30'::uuid
    AND t.species_name = s.name
);
