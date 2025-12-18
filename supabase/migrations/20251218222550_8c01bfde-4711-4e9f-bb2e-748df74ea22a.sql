-- Update existing profiles that have non-binary/other gender values to null
UPDATE public.profiles 
SET gender = NULL 
WHERE gender NOT IN ('male', 'female');

-- Update interested_in arrays to only contain male/female
UPDATE public.profiles 
SET interested_in = ARRAY(
  SELECT unnest(interested_in) 
  INTERSECT 
  SELECT unnest(ARRAY['male', 'female']::gender_type[])
)
WHERE interested_in IS NOT NULL;