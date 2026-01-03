-- Allow admins to insert fishing spots
CREATE POLICY "Admins can insert spots"
ON public.fishing_spots
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));