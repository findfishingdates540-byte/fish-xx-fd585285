-- Clear all old/invalid preferred_species from user profiles
-- These don't match the new imported fish species format
UPDATE profiles 
SET preferred_species = NULL 
WHERE preferred_species IS NOT NULL;