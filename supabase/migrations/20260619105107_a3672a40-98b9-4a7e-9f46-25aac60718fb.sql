GRANT SELECT ON public.fishing_spots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fishing_spots TO authenticated;
GRANT ALL ON public.fishing_spots TO service_role;

DROP POLICY IF EXISTS "Anon can view public fishing spots" ON public.fishing_spots;
CREATE POLICY "Anon can view public fishing spots"
ON public.fishing_spots
FOR SELECT
TO anon
USING (is_public = true);

DROP POLICY IF EXISTS "Authenticated users can view public and own spots" ON public.fishing_spots;
CREATE POLICY "Authenticated users can view public and own spots"
ON public.fishing_spots
FOR SELECT
TO authenticated
USING ((is_public = true) OR (created_by = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Anyone can view public spots" ON public.fishing_spots;