
-- =============================================================
-- FIX 1: photo_challenges — hide gift_card_code from non-admin/non-owner users
-- =============================================================

DROP POLICY IF EXISTS "Anyone can view photo challenges" ON public.photo_challenges;

-- Only creators and admins see full rows (including gift_card_code)
CREATE POLICY "Creators and admins can view photo challenges"
  ON public.photo_challenges
  FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR has_role((SELECT auth.uid()), 'admin'::app_role)
  );

-- Create a safe view for all other users (excludes gift_card_code)
CREATE OR REPLACE VIEW public.photo_challenges_public AS
SELECT
  id, title, description, status, start_date, end_date, voting_end_date,
  entry_fee, prize_type, prize_description, banner_url,
  created_by, created_at, winner_id
FROM public.photo_challenges;

-- Grant authenticated users access to the view
GRANT SELECT ON public.photo_challenges_public TO authenticated;

-- Also need a broader SELECT policy so the view can read rows
-- We use a SECURITY DEFINER function wrapper instead
CREATE OR REPLACE FUNCTION public.get_photo_challenges_safe()
RETURNS TABLE(
  id uuid, title text, description text, status text,
  start_date timestamptz, end_date timestamptz, voting_end_date timestamptz,
  entry_fee numeric, prize_type text, prize_description text,
  banner_url text, created_by uuid, created_at timestamptz, winner_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, title, description, status, start_date, end_date, voting_end_date,
         entry_fee, prize_type, prize_description, banner_url,
         created_by, created_at, winner_id
  FROM public.photo_challenges;
$$;

-- =============================================================
-- FIX 2: user_roles — fix broken admin policy
-- =============================================================

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin'::app_role))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

-- =============================================================
-- FIX 3: audit_logs — remove client INSERT policy
-- =============================================================

DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.audit_logs;

-- Create a SECURITY DEFINER function for server-side audit log insertion
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

-- =============================================================
-- FIX 4: profiles — remove broad SELECT exposing sensitive data
-- =============================================================

DROP POLICY IF EXISTS "Authenticated users can view active profiles" ON public.profiles;

-- The app already has "Users can view own profile" and "Admins can view all profiles"
-- Other users access profiles via public_profiles view (backed by SECURITY DEFINER functions)

-- =============================================================
-- FIX 5: notifications — remove public INSERT policy
-- =============================================================

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Notifications are created by SECURITY DEFINER trigger functions
-- (notify_feed_like, notify_feed_comment, notify_buddy_request, etc.)
-- which bypass RLS. No client-facing INSERT policy needed.
