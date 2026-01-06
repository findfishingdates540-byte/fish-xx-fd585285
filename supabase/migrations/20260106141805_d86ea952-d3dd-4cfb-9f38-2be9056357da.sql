-- Drop existing policies and recreate with proper admin access
DROP POLICY IF EXISTS "Anyone can insert support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;

-- Anyone can submit a ticket
CREATE POLICY "Anyone can insert support tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (true);

-- Users can view their own tickets (if logged in and linked)
CREATE POLICY "Users can view own tickets" 
ON public.support_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins and moderators can view all tickets
CREATE POLICY "Admins can view all tickets" 
ON public.support_tickets 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'moderator'::app_role)
);

-- Admins and moderators can update tickets
CREATE POLICY "Admins can update tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'moderator'::app_role)
);

-- Drop and recreate response policies
DROP POLICY IF EXISTS "Users can view responses to own tickets" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Admins can insert responses" ON public.support_ticket_responses;

-- Users can view non-internal responses to their tickets
CREATE POLICY "Users can view responses to own tickets" 
ON public.support_ticket_responses 
FOR SELECT 
USING (
  is_internal = false AND 
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
  )
);

-- Admins and moderators can view all responses
CREATE POLICY "Admins can view all responses" 
ON public.support_ticket_responses 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'moderator'::app_role)
);

-- Admins and moderators can insert responses
CREATE POLICY "Admins can insert responses" 
ON public.support_ticket_responses 
FOR INSERT 
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'moderator'::app_role)
);