-- Create a function to get all buddy page data in a single call
CREATE OR REPLACE FUNCTION public.get_buddy_page_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  buddy_ids uuid[];
  discover_ids uuid[];
  received_ids uuid[];
  sent_ids uuid[];
  accepted_buddy_ids uuid[];
BEGIN
  -- Get all buddy relationship IDs to exclude from discover
  SELECT array_agg(DISTINCT 
    CASE 
      WHEN requester_id = p_user_id THEN recipient_id 
      ELSE requester_id 
    END
  )
  INTO buddy_ids
  FROM fishing_buddies
  WHERE requester_id = p_user_id OR recipient_id = p_user_id;

  -- Get accepted buddy other-user IDs
  SELECT array_agg(
    CASE 
      WHEN requester_id = p_user_id THEN recipient_id 
      ELSE requester_id 
    END
  )
  INTO accepted_buddy_ids
  FROM fishing_buddies
  WHERE (requester_id = p_user_id OR recipient_id = p_user_id)
    AND status = 'accepted';

  -- Get received pending request requester IDs
  SELECT array_agg(requester_id)
  INTO received_ids
  FROM fishing_buddies
  WHERE recipient_id = p_user_id AND status = 'pending';

  -- Get sent pending request recipient IDs
  SELECT array_agg(recipient_id)
  INTO sent_ids
  FROM fishing_buddies
  WHERE requester_id = p_user_id AND status = 'pending';

  -- Build the result JSON
  result := jsonb_build_object(
    'discover_profiles', (
      SELECT COALESCE(jsonb_agg(row_to_json(p)::jsonb), '[]'::jsonb)
      FROM (
        SELECT id, display_name, photos, location_name, fishing_experience, 
               preferred_species, bio, id_verified, live_verified
        FROM public_profiles
        WHERE account_mode IN ('fishing', 'both')
          AND id != p_user_id
          AND onboarding_completed = true
          AND (buddy_ids IS NULL OR id != ALL(buddy_ids))
        LIMIT 100
      ) p
    ),
    'received_requests', (
      SELECT COALESCE(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb)
      FROM (
        SELECT 
          fb.id,
          fb.requester_id,
          fb.recipient_id,
          fb.status,
          fb.created_at,
          jsonb_build_object(
            'id', pp.id,
            'display_name', pp.display_name,
            'photos', pp.photos,
            'location_name', pp.location_name,
            'fishing_experience', pp.fishing_experience,
            'id_verified', pp.id_verified,
            'live_verified', pp.live_verified
          ) as profile
        FROM fishing_buddies fb
        JOIN public_profiles pp ON pp.id = fb.requester_id
        WHERE fb.recipient_id = p_user_id AND fb.status = 'pending'
      ) r
    ),
    'sent_requests', (
      SELECT COALESCE(jsonb_agg(row_to_json(s)::jsonb), '[]'::jsonb)
      FROM (
        SELECT 
          fb.id,
          fb.requester_id,
          fb.recipient_id,
          fb.status,
          fb.created_at,
          jsonb_build_object(
            'id', pp.id,
            'display_name', pp.display_name,
            'photos', pp.photos,
            'location_name', pp.location_name,
            'fishing_experience', pp.fishing_experience,
            'id_verified', pp.id_verified,
            'live_verified', pp.live_verified
          ) as profile
        FROM fishing_buddies fb
        JOIN public_profiles pp ON pp.id = fb.recipient_id
        WHERE fb.requester_id = p_user_id AND fb.status = 'pending'
      ) s
    ),
    'my_buddies', (
      SELECT COALESCE(jsonb_agg(row_to_json(b)::jsonb), '[]'::jsonb)
      FROM (
        SELECT 
          pp.id,
          pp.display_name,
          pp.photos,
          pp.location_name,
          pp.fishing_experience,
          pp.preferred_species,
          pp.bio,
          pp.id_verified,
          pp.live_verified,
          fb.id as "buddyId"
        FROM fishing_buddies fb
        JOIN public_profiles pp ON pp.id = (
          CASE 
            WHEN fb.requester_id = p_user_id THEN fb.recipient_id 
            ELSE fb.requester_id 
          END
        )
        WHERE (fb.requester_id = p_user_id OR fb.recipient_id = p_user_id)
          AND fb.status = 'accepted'
      ) b
    ),
    'catch_counts', (
      SELECT COALESCE(jsonb_object_agg(user_id, count), '{}'::jsonb)
      FROM (
        SELECT user_id, COUNT(*)::int as count
        FROM catches
        WHERE user_id = ANY(
          COALESCE(buddy_ids, ARRAY[]::uuid[]) || 
          COALESCE(accepted_buddy_ids, ARRAY[]::uuid[])
        )
        GROUP BY user_id
      ) cc
    ),
    'requested_ids', COALESCE(to_jsonb(sent_ids), '[]'::jsonb)
  );

  RETURN result;
END;
$$;