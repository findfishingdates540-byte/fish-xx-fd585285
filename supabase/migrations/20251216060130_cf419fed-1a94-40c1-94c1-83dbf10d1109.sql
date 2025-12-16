-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add messages to realtime publication (drop and recreate to ensure clean state)
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.messages;