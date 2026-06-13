
CREATE TEMP TABLE species_dedup_map2(delete_id uuid PRIMARY KEY, keep_id uuid NOT NULL);
INSERT INTO species_dedup_map2(delete_id, keep_id) VALUES
  ('0b4c2db5-ad64-4350-9163-ecb80977e0fe','d42f614f-3965-4357-aec3-882f155c8584'),  -- Spanish Mackerel -> Mackerel, Spanish
  ('ff8277d1-4697-4642-9fdc-99609200be5d','8176fbfb-2ce5-4b6c-8f0d-a8f0e1f2c407'),  -- Cero Mackerel -> Mackerel, Cero
  ('c344ae7c-29ab-4a67-b5f5-e22e57b9cc3c','2a0a08c8-4fe1-4d1a-8600-e3aae931809f'),  -- Albacore Tuna -> Albacore
  ('dca66b40-35bc-4fca-a46f-857a25060aeb','f603a4a1-6be1-42e5-87ee-06dddc752865'),  -- Yellowfin Tuna -> Tuna, Yellowfin
  ('6c14a589-5b68-4f4f-8d0a-280261a64ff3','11254f02-75b2-46eb-9ffc-ccb3b2dce702'),  -- Blackfin Tuna -> Tuna, Blackfin
  ('be942afa-620d-48fc-9506-33bab84bba1d','d7255de2-c87d-4893-86de-5a9c758c5c17'),  -- Bluefin Tuna -> Tuna, Bluefin
  ('9256c7b5-4f73-407f-b797-b177a39efa93','effaf393-adb1-4429-a861-80b915fb582f'),  -- Bigeye Tuna -> Tuna, Bigeye (Atlantic)
  ('c23508a3-465d-4800-a272-370ac734bfe3','effaf393-adb1-4429-a861-80b915fb582f');  -- Tuna, Bigeye (generic) -> Tuna, Bigeye (Atlantic)

UPDATE public.catches c SET species_id = m.keep_id FROM species_dedup_map2 m WHERE c.species_id = m.delete_id;
UPDATE public.angler_badges b SET species_id = m.keep_id FROM species_dedup_map2 m WHERE b.species_id = m.delete_id;
UPDATE public.fishing_challenges fc SET species_id = m.keep_id FROM species_dedup_map2 m WHERE fc.species_id = m.delete_id;

WITH conflicts AS (
  SELECT le_dup.id AS dup_id, le_keep.id AS keep_id,
         le_dup.total_caught AS d_caught, le_dup.total_released AS d_released, le_dup.total_harvested AS d_harvested,
         le_dup.largest_weight_lbs AS d_w, le_dup.largest_length_in AS d_l, le_dup.largest_catch_id AS d_cid
  FROM public.leaderboard_entries le_dup
  JOIN species_dedup_map2 m ON le_dup.species_id = m.delete_id
  JOIN public.leaderboard_entries le_keep ON le_keep.user_id = le_dup.user_id AND le_keep.species_id = m.keep_id
)
UPDATE public.leaderboard_entries le
SET total_caught   = COALESCE(le.total_caught,0)   + COALESCE(c.d_caught,0),
    total_released = COALESCE(le.total_released,0) + COALESCE(c.d_released,0),
    total_harvested= COALESCE(le.total_harvested,0)+ COALESCE(c.d_harvested,0),
    largest_weight_lbs = GREATEST(COALESCE(le.largest_weight_lbs,0), COALESCE(c.d_w,0)),
    largest_length_in  = GREATEST(COALESCE(le.largest_length_in,0),  COALESCE(c.d_l,0)),
    largest_catch_id   = CASE WHEN COALESCE(c.d_w,0) > COALESCE(le.largest_weight_lbs,0) THEN c.d_cid ELSE le.largest_catch_id END,
    updated_at = now()
FROM conflicts c
WHERE le.id = c.keep_id;

DELETE FROM public.leaderboard_entries le
USING species_dedup_map2 m, public.leaderboard_entries le_keep
WHERE le.species_id = m.delete_id
  AND le_keep.user_id = le.user_id
  AND le_keep.species_id = m.keep_id;

UPDATE public.leaderboard_entries le SET species_id = m.keep_id FROM species_dedup_map2 m WHERE le.species_id = m.delete_id;

DELETE FROM public.championship_species_tiers t
USING species_dedup_map2 m, public.championship_species_tiers t2
WHERE t.species_id = m.delete_id AND t2.championship_id = t.championship_id AND t2.species_id = m.keep_id;

UPDATE public.championship_species_tiers t SET species_id = m.keep_id FROM species_dedup_map2 m WHERE t.species_id = m.delete_id;

DELETE FROM public.fish_species s USING species_dedup_map2 m WHERE s.id = m.delete_id;
