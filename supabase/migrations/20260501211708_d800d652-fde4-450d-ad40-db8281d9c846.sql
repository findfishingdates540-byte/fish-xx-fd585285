-- Allow data_entry users to insert fishing spots
CREATE POLICY "Data entry users can insert spots"
ON public.fishing_spots
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role((SELECT auth.uid()), 'data_entry')
  AND created_by = (SELECT auth.uid())
);

-- Allow data_entry users to view their own spots
CREATE POLICY "Data entry users can view own spots"
ON public.fishing_spots
FOR SELECT
TO authenticated
USING (
  public.has_role((SELECT auth.uid()), 'data_entry')
  AND created_by = (SELECT auth.uid())
);