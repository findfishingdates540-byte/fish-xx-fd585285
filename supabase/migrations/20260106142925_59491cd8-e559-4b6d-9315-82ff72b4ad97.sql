-- Allow users to insert responses to their own tickets
CREATE POLICY "Users can reply to own tickets"
ON public.support_ticket_responses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_id AND user_id = auth.uid()
  )
  AND is_internal = false
);