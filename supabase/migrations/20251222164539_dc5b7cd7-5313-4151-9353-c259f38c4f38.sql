-- Add audio_url column to messages table for voice messages
ALTER TABLE public.messages ADD COLUMN audio_url text;

-- Add audio_url column to buddy_messages table as well
ALTER TABLE public.buddy_messages ADD COLUMN audio_url text;