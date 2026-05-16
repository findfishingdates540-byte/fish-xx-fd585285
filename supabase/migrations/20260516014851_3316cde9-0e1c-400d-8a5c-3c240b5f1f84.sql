CREATE OR REPLACE FUNCTION public.search_users(p_query text, p_limit int DEFAULT 30)
RETURNS TABLE(
  id uuid,
  display_name text,
  photos text[],
  location_name text,
  fishing_experience fishing_experience,
  id_verified boolean,
  live_verified boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.photos, p.location_name, p.fishing_experience, p.id_verified, p.live_verified
  FROM profiles p
  WHERE p.is_active = true
    AND p.is_banned = false
    AND p.onboarding_completed = true
    AND p.display_name ILIKE '%' || p_query || '%'
  ORDER BY p.display_name ASC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_users(text, int) TO authenticated;