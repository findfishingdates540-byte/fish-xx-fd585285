-- Add RLS policy for admins to view all matches
CREATE POLICY "Admins can view all matches" 
ON public.matches 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to view all messages (for stats)
CREATE POLICY "Admins can view all messages" 
ON public.messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));