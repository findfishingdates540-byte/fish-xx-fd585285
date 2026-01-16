-- Add read_at timestamp to messages table for detailed read receipts
ALTER TABLE public.messages
ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;