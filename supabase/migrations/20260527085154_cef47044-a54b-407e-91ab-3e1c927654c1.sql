
INSERT INTO public.fishing_challenges
  (title, description, challenge_type, target_species_name, start_date, end_date, status, created_by, is_official, prizes, entry_fee, entry_fee_enabled, prize_type, prize_description, is_admin_funded)
SELECT
  pc.title,
  pc.description,
  'largest_fish'::challenge_type,
  CASE pc.title
    WHEN 'Snook Challenge' THEN 'Snook'
    WHEN 'Largemouth Bass Challenge' THEN 'Largemouth Bass'
    WHEN 'Pacific Halibut Challenge' THEN 'Pacific Halibut'
  END,
  pc.start_date::date,
  pc.end_date::date,
  pc.status,
  pc.created_by,
  true,
  jsonb_build_object('banner_url', pc.banner_url),
  COALESCE(pc.entry_fee, 0),
  COALESCE(pc.entry_fee, 0) > 0,
  pc.prize_type,
  pc.prize_description,
  COALESCE(pc.entry_fee, 0) = 0
FROM public.photo_challenges pc
WHERE pc.title IN ('Snook Challenge','Largemouth Bass Challenge','Pacific Halibut Challenge');

DELETE FROM public.photo_challenges
WHERE title IN ('Snook Challenge','Largemouth Bass Challenge','Pacific Halibut Challenge');
