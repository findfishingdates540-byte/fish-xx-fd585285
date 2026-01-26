-- Drop and recreate the get_dating_conversations function to include last_sender_id
DROP FUNCTION IF EXISTS get_dating_conversations(uuid);

CREATE FUNCTION get_dating_conversations(p_user_id uuid)
RETURNS TABLE (
  match_id uuid,
  matched_user_id uuid,
  display_name text,
  photo text,
  last_message text,
  last_message_time timestamptz,
  unread_count bigint,
  matched_at timestamptz,
  last_sender_id uuid
) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id as match_id,
    CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END as matched_user_id,
    p.display_name,
    p.photos[1] as photo,
    (SELECT msg.content FROM messages msg WHERE msg.match_id = m.id AND msg.deleted_for_everyone = false ORDER BY msg.created_at DESC LIMIT 1),
    (SELECT msg.created_at FROM messages msg WHERE msg.match_id = m.id ORDER BY msg.created_at DESC LIMIT 1),
    (SELECT COUNT(*) FROM messages msg WHERE msg.match_id = m.id AND msg.is_read = false AND msg.sender_id != p_user_id),
    m.matched_at,
    (SELECT msg.sender_id FROM messages msg WHERE msg.match_id = m.id ORDER BY msg.created_at DESC LIMIT 1)
  FROM matches m
  JOIN profiles p ON p.id = CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END
  WHERE m.is_match = true AND (m.user1_id = p_user_id OR m.user2_id = p_user_id)
  ORDER BY COALESCE(
    (SELECT msg.created_at FROM messages msg WHERE msg.match_id = m.id ORDER BY msg.created_at DESC LIMIT 1),
    m.matched_at
  ) DESC;
$$;