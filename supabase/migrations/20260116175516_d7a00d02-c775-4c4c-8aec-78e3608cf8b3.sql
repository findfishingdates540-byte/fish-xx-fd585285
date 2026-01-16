-- Add delivered_at timestamp to messages table for delivery receipts
ALTER TABLE public.messages
ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;

-- Add delivered_at timestamp to buddy_messages table for delivery receipts
ALTER TABLE public.buddy_messages
ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;