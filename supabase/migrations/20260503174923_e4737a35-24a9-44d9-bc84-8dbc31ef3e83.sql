
-- Function to get buddies with birthdays today (without exposing raw DOB)
CREATE OR REPLACE FUNCTION public.get_birthday_buddies(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  photos text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.photos
  FROM profiles p
  JOIN fishing_buddies fb ON (
    (fb.requester_id = p_user_id AND fb.recipient_id = p.id)
    OR (fb.recipient_id = p_user_id AND fb.requester_id = p.id)
  )
  WHERE fb.status = 'accepted'
    AND p.date_of_birth IS NOT NULL
    AND EXTRACT(MONTH FROM p.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM p.date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE)
    AND p.is_active = true
    AND p.is_banned = false;
$$;
