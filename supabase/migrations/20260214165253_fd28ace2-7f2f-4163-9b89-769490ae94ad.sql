DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);