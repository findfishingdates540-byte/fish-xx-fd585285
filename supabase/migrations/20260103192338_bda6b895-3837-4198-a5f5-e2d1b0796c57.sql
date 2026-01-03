-- Add seen_at column to trip_participants for dismissible notifications
ALTER TABLE public.trip_participants 
ADD COLUMN seen_at TIMESTAMP WITH TIME ZONE;