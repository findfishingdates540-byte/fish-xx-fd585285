DELETE FROM public.championship_species_tiers
WHERE championship_id = (
  SELECT id FROM public.fishing_challenges
  WHERE title = 'Fish-X Global Shark Championship' AND is_championship = true
  LIMIT 1
)
AND species_name ILIKE 'Shark, White';