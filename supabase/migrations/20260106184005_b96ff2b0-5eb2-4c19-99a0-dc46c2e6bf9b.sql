-- Step 1: Drop the dependent index
DROP INDEX IF EXISTS idx_profiles_display_name_trgm;

-- Step 2: Drop the extension from public schema
DROP EXTENSION IF EXISTS pg_trgm;

-- Step 3: Create dedicated extensions schema (if not exists from previous attempt)
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 4: Grant usage to roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Step 5: Create extension in extensions schema
CREATE EXTENSION pg_trgm WITH SCHEMA extensions;

-- Step 6: Grant execute on extension functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Step 7: Recreate the trigram index using the extension from extensions schema
CREATE INDEX idx_profiles_display_name_trgm 
ON public.profiles 
USING gin (display_name extensions.gin_trgm_ops);