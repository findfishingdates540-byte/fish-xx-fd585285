DROP FUNCTION IF EXISTS public.admin_search_spots(text, int, int);

CREATE OR REPLACE FUNCTION public.admin_search_spots(
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 60,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  location_name text,
  location_lat numeric,
  location_lng numeric,
  photos text[],
  species_available text[],
  is_public boolean,
  is_verified boolean,
  rating_avg numeric,
  rating_count integer,
  area_type text,
  created_at timestamptz,
  created_by uuid,
  creator jsonb,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role((SELECT auth.uid()), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT s.*
    FROM public.fishing_spots s
    WHERE p_search IS NULL
       OR s.name ILIKE '%' || p_search || '%'
       OR s.location_name ILIKE '%' || p_search || '%'
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS total FROM filtered
  )
  SELECT
    f.id,
    f.name,
    f.description,
    f.location_name,
    f.location_lat,
    f.location_lng,
    f.photos,
    f.species_available,
    f.is_public,
    f.is_verified,
    f.rating_avg,
    f.rating_count,
    f.area_type,
    f.created_at,
    f.created_by,
    CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', p.id,
      'display_name', p.display_name,
      'photos', p.photos
    ) END AS creator,
    (SELECT total FROM counted) AS total_count
  FROM filtered f
  LEFT JOIN public.profiles p ON p.id = f.created_by
  ORDER BY f.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;