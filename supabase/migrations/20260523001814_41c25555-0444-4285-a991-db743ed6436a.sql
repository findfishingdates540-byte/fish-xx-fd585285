-- Allow admins to moderate teams and their content
CREATE POLICY "Admins can delete teams"
ON public.fishing_teams FOR DELETE TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can update teams"
ON public.fishing_teams FOR UPDATE TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can delete team posts"
ON public.team_posts FOR DELETE TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can update team posts"
ON public.team_posts FOR UPDATE TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can delete team members"
ON public.team_members FOR DELETE TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can delete team followers"
ON public.team_followers FOR DELETE TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can delete team post comments"
ON public.team_post_comments FOR DELETE TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));