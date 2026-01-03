-- Add viewed_at columns to track when each user last viewed their matches
ALTER TABLE public.matches 
ADD COLUMN user1_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN user2_viewed_at TIMESTAMP WITH TIME ZONE;