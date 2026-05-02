-- Add reef-specific columns to fishing_spots
ALTER TABLE public.fishing_spots
  ADD COLUMN IF NOT EXISTS deploy_id text,
  ADD COLUMN IF NOT EXISTS county text,
  ADD COLUMN IF NOT EXISTS deploy_date date,
  ADD COLUMN IF NOT EXISTS primary_material text,
  ADD COLUMN IF NOT EXISTS tons numeric,
  ADD COLUMN IF NOT EXISTS relief_ft numeric,
  ADD COLUMN IF NOT EXISTS depth_ft numeric,
  ADD COLUMN IF NOT EXISTS jurisdiction text,
  ADD COLUMN IF NOT EXISTS coast text,
  ADD COLUMN IF NOT EXISTS location_accuracy text,
  ADD COLUMN IF NOT EXISTS source text;

-- Index on deploy_id for dedup during imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_fishing_spots_deploy_id ON public.fishing_spots (deploy_id) WHERE deploy_id IS NOT NULL;

-- Index on county for filtering
CREATE INDEX IF NOT EXISTS idx_fishing_spots_county ON public.fishing_spots (county) WHERE county IS NOT NULL;