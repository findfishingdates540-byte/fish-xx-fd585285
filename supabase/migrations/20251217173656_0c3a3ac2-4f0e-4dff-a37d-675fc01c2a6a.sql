-- Create buddy messages table for fishing buddy conversations
CREATE TABLE public.buddy_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buddy_id UUID NOT NULL REFERENCES public.fishing_buddies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buddy_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their buddy relationships
CREATE POLICY "Users can view buddy messages"
ON public.buddy_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.fishing_buddies fb
    WHERE fb.id = buddy_messages.buddy_id
    AND fb.status = 'accepted'
    AND (fb.requester_id = auth.uid() OR fb.recipient_id = auth.uid())
  )
);

-- Users can send messages in their accepted buddy relationships
CREATE POLICY "Users can send buddy messages"
ON public.buddy_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.fishing_buddies fb
    WHERE fb.id = buddy_messages.buddy_id
    AND fb.status = 'accepted'
    AND (fb.requester_id = auth.uid() OR fb.recipient_id = auth.uid())
  )
);

-- Users can update read status on messages they received
CREATE POLICY "Users can mark messages as read"
ON public.buddy_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.fishing_buddies fb
    WHERE fb.id = buddy_messages.buddy_id
    AND fb.status = 'accepted'
    AND (fb.requester_id = auth.uid() OR fb.recipient_id = auth.uid())
  )
  AND sender_id != auth.uid()
);

-- Create indexes for performance
CREATE INDEX idx_buddy_messages_buddy_id ON public.buddy_messages(buddy_id);
CREATE INDEX idx_buddy_messages_sender_id ON public.buddy_messages(sender_id);
CREATE INDEX idx_buddy_messages_created_at ON public.buddy_messages(created_at DESC);

-- Enable realtime for buddy messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.buddy_messages;