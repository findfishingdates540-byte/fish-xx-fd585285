-- Allow admins to delete fishing spots
CREATE POLICY "Admins can delete spots" 
ON public.fishing_spots 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));