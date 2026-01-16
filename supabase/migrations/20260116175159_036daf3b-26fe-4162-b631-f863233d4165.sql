-- Add read_at timestamp to buddy_messages table for detailed read receipts
ALTER TABLE public.buddy_messages
ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;