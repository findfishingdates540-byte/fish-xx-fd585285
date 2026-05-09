ALTER TABLE public.fishing_spots DROP CONSTRAINT IF EXISTS fishing_spots_area_type_check;
ALTER TABLE public.fishing_spots ADD CONSTRAINT fishing_spots_area_type_check
  CHECK (area_type = ANY (ARRAY['freshwater'::text, 'saltwater'::text, 'land_based'::text]));