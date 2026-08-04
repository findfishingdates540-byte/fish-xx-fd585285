CREATE POLICY "Admins and moderators can view all catches"
ON public.catches
FOR SELECT
TO authenticated
USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
  OR has_role((SELECT auth.uid()), 'moderator'::app_role)
);