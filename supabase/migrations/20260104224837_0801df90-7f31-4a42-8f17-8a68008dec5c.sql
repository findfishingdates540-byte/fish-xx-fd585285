-- Add granular address columns to profiles table for precise location
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.city IS 'User city for location precision';
COMMENT ON COLUMN public.profiles.state IS 'User state for location precision';
COMMENT ON COLUMN public.profiles.zip_code IS 'User zip code for precise geocoding';