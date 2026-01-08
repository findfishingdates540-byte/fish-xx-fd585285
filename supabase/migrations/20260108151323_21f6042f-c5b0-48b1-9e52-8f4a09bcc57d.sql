-- Clear invalid preferred_species data for user with non-fish items
UPDATE profiles 
SET preferred_species = '{}'::text[]
WHERE id = '41e1205d-2053-429e-b02e-eab75faf4964';

-- Also fix any other users who may have dating interests saved as species
UPDATE profiles
SET preferred_species = ARRAY(
  SELECT unnest(preferred_species) 
  INTERSECT 
  SELECT unnest(ARRAY['fly_fishing', 'deep_sea', 'kayak_fishing', 'catch_and_cook', 'ice_fishing', 'bass_fishing'])
)
WHERE preferred_species && ARRAY['music', 'movies', 'fitness', 'art', 'gaming', 'reading'];