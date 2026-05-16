
-- 1. Remove push_subscriptions from realtime publication (tokens should never be broadcast)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'push_subscriptions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.push_subscriptions';
  END IF;
END $$;

-- 2. catch_photos: prevent enumeration of private catches' photos
DROP POLICY IF EXISTS "Anyone can view catch photos" ON public.catch_photos;
CREATE POLICY "View catch photos respecting catch privacy"
ON public.catch_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.catches c
    WHERE c.id = catch_photos.catch_id
      AND (
        COALESCE(c.is_private, false) = false
        OR c.user_id = (SELECT auth.uid())
      )
  )
);

-- 3. Gift card codes: revoke column-level read from clients (admins/edge functions use service role)
REVOKE SELECT (gift_card_code) ON public.tournaments FROM anon, authenticated;
REVOKE SELECT (gift_card_code) ON public.photo_challenges FROM anon, authenticated;

-- 4. Team phone numbers: hide from all clients
REVOKE SELECT (phone) ON public.fishing_teams FROM anon, authenticated;

-- 5. Photo challenge entries: hide GPS coordinates from clients
REVOKE SELECT (location_lat, location_lng) ON public.photo_challenge_entries FROM anon, authenticated;

-- 6. Tighten profiles policies to authenticated role only
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = id);
