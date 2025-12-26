-- Add reply_to_id to messages table for dating chat replies
ALTER TABLE public.messages
ADD COLUMN reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Add reply_to_id to buddy_messages table for buddy chat replies
ALTER TABLE public.buddy_messages
ADD COLUMN reply_to_id uuid REFERENCES public.buddy_messages(id) ON DELETE SET NULL;

-- Create buddy_message_reactions table for emoji reactions on buddy messages
CREATE TABLE public.buddy_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.buddy_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS on buddy_message_reactions
ALTER TABLE public.buddy_message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reactions in their buddy chats
CREATE POLICY "Users can view reactions in their buddy chats"
ON public.buddy_message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.buddy_messages bm
    JOIN public.fishing_buddies fb ON bm.buddy_id = fb.id
    WHERE bm.id = buddy_message_reactions.message_id
    AND fb.status = 'accepted'
    AND (fb.requester_id = auth.uid() OR fb.recipient_id = auth.uid())
  )
);

-- Policy: Users can add reactions in their buddy chats
CREATE POLICY "Users can add reactions in their buddy chats"
ON public.buddy_message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.buddy_messages bm
    JOIN public.fishing_buddies fb ON bm.buddy_id = fb.id
    WHERE bm.id = buddy_message_reactions.message_id
    AND fb.status = 'accepted'
    AND (fb.requester_id = auth.uid() OR fb.recipient_id = auth.uid())
  )
);

-- Policy: Users can remove their own reactions
CREATE POLICY "Users can remove own buddy reactions"
ON public.buddy_message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for buddy_message_reactions
ALTER TABLE public.buddy_message_reactions REPLICA IDENTITY FULL;