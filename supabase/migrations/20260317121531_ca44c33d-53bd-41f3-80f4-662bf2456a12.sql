
-- Fix angler_badges: remove overly permissive INSERT, only admins can insert directly (SECURITY DEFINER functions bypass RLS)
DROP POLICY IF EXISTS "System can insert badges" ON public.angler_badges;
CREATE POLICY "Admins can manage badges" ON public.angler_badges FOR ALL TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));

-- Add UPDATE policy for catch_photos (was missing = RLS enabled no policy for UPDATE)
CREATE POLICY "Users can update own catch photos" ON public.catch_photos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.catches WHERE catches.id = catch_photos.catch_id AND catches.user_id = (SELECT auth.uid())));

-- Add missing UPDATE policy for team_members
CREATE POLICY "Captains can update members" ON public.team_members FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fishing_teams WHERE fishing_teams.id = team_members.team_id AND fishing_teams.captain_id = (SELECT auth.uid())));
