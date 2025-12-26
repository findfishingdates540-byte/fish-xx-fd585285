-- Add soft delete columns to messages table
ALTER TABLE public.messages 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL,
ADD COLUMN deleted_for_everyone boolean DEFAULT false;

-- Add soft delete columns to buddy_messages table
ALTER TABLE public.buddy_messages 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL,
ADD COLUMN deleted_for_everyone boolean DEFAULT false;

-- Update RLS policy for messages to allow users to soft-delete their own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages" 
ON public.messages 
FOR UPDATE 
USING (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM matches 
    WHERE matches.id = messages.match_id 
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
)
WITH CHECK (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM matches 
    WHERE matches.id = messages.match_id 
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- Update RLS policy for buddy_messages to allow users to soft-delete their own messages
DROP POLICY IF EXISTS "Users can delete own buddy messages" ON public.buddy_messages;
CREATE POLICY "Users can delete own buddy messages" 
ON public.buddy_messages 
FOR UPDATE 
USING (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM fishing_buddies fb 
    WHERE fb.id = buddy_messages.buddy_id 
    AND fb.status = 'accepted' 
    AND (fb.requester_id = auth.uid() OR fb.recipient_id = auth.uid())
  )
)
WITH CHECK (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM fishing_buddies fb 
    WHERE fb.id = buddy_messages.buddy_id 
    AND fb.status = 'accepted' 
    AND (fb.requester_id = auth.uid() OR fb.recipient_id = auth.uid())
  )
);