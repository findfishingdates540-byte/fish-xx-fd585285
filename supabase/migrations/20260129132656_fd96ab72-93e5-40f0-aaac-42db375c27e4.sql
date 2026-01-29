-- Add room_url column to call_sessions to store the Daily room URL
-- This ensures both caller and callee join the same room
ALTER TABLE public.call_sessions 
ADD COLUMN IF NOT EXISTS room_url TEXT;