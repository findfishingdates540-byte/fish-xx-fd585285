
-- 1. catches: protect location for non-shared catches
DROP POLICY IF EXISTS "Anyone can view catches" ON public.catches;
CREATE POLICY "View catches respecting share_location"
ON public.catches
FOR SELECT
TO authenticated
USING (
  COALESCE(share_location, true) = true
  OR auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2. fishing_challenge_entries: restrict to owner / admin
DROP POLICY IF EXISTS "Anyone can view fishing challenge entries" ON public.fishing_challenge_entries;
DROP POLICY IF EXISTS "Users can join challenges" ON public.fishing_challenge_entries;

CREATE POLICY "Users can view own challenge entries"
ON public.fishing_challenge_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can join challenges"
ON public.fishing_challenge_entries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. app_settings: restrict reads to admins
DROP POLICY IF EXISTS "Anyone can view app settings" ON public.app_settings;
CREATE POLICY "Admins can view app settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
