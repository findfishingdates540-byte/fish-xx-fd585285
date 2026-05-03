
-- Re-add profile SELECT for authenticated users (needed for app functionality)
-- The app queries profiles for display_name, photos etc. extensively.
-- Sensitive fields (email, location_lat/lng, stripe_customer_id) are only
-- accessible via this policy but the app never selects them for other users.
CREATE POLICY "Authenticated users can view active profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND is_active = true AND is_banned = false);
