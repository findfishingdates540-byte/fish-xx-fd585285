-- Add recurrence support to fishing_trips
ALTER TABLE public.fishing_trips 
ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS parent_trip_id UUID REFERENCES public.fishing_trips(id) ON DELETE SET NULL;

-- Add index for efficient parent trip lookups
CREATE INDEX IF NOT EXISTS idx_fishing_trips_parent ON public.fishing_trips(parent_trip_id) WHERE parent_trip_id IS NOT NULL;

COMMENT ON COLUMN public.fishing_trips.recurrence_type IS 'Recurrence pattern: weekly, biweekly, monthly, or null for non-recurring';
COMMENT ON COLUMN public.fishing_trips.recurrence_end_date IS 'End date for recurring trips';
COMMENT ON COLUMN public.fishing_trips.parent_trip_id IS 'Reference to parent trip for recurring instances';