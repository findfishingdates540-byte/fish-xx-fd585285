-- Drop the existing check constraint and add a new one that includes 'dismissed'
ALTER TABLE public.fishing_buddies 
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE public.fishing_buddies 
ADD CONSTRAINT valid_status 
CHECK (status IN ('pending', 'accepted', 'declined', 'dismissed'));