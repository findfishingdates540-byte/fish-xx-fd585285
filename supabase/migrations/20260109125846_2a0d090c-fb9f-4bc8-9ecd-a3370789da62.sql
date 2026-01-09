-- Add video_url column to feed_posts table
ALTER TABLE public.feed_posts 
ADD COLUMN video_url TEXT DEFAULT NULL;