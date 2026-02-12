-- Allow users to delete their own profile (needed for account deletion via edge function with service role)
-- The edge function uses service_role which bypasses RLS, but let's also allow self-deletion
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);
