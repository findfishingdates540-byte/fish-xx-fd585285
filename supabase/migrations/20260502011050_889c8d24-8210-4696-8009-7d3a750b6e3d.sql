-- Allow bulk import inserts (anon key, no created_by)
CREATE POLICY "Allow bulk data import inserts"
ON public.fishing_spots
FOR INSERT
TO anon
WITH CHECK (source IS NOT NULL AND created_by IS NULL);

-- Temporary select for conflict resolution during import
CREATE POLICY "Anon can read for import conflict check"
ON public.fishing_spots
FOR SELECT
TO anon
USING (source IS NOT NULL);