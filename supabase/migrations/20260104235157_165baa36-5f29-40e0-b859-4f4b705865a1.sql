-- Fix search_path security warning for get_dating_conversations
CREATE OR REPLACE FUNCTION get_dating_conversations(p_user_id uuid)
RETURNS TABLE (
  match_id uuid,
  matched_user_id uuid,
  display_name text,
  photo text,
  last_message text,
  last_message_time timestamptz,
  unread_count bigint,
  matched_at timestamptz
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
    m.matched_at
  FROM matches m
  JOIN profiles p ON p.id = CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END
  WHERE m.is_match = true AND (m.user1_id = p_user_id OR m.user2_id = p_user_id)
  ORDER BY COALESCE(
    (SELECT msg.created_at FROM messages msg WHERE msg.match_id = m.id ORDER BY msg.created_at DESC LIMIT 1),
    m.matched_at
  ) DESC;
$$;

-- Fix search_path security warning for get_buddy_conversations
CREATE OR REPLACE FUNCTION get_buddy_conversations(p_user_id uuid)
RETURNS TABLE (
  buddy_id uuid,
  buddy_user_id uuid,
  display_name text,
  photo text,
  last_message text,
  last_message_time timestamptz,
  last_message_sender_id uuid,
  unread_count bigint
) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.id as buddy_id,
    CASE WHEN b.requester_id = p_user_id THEN b.recipient_id ELSE b.requester_id END as buddy_user_id,
    p.display_name,
    p.photos[1] as photo,
    (SELECT bm.content FROM buddy_messages bm WHERE bm.buddy_id = b.id AND bm.deleted_for_everyone = false ORDER BY bm.created_at DESC LIMIT 1),
    (SELECT bm.created_at FROM buddy_messages bm WHERE bm.buddy_id = b.id ORDER BY bm.created_at DESC LIMIT 1),
    (SELECT bm.sender_id FROM buddy_messages bm WHERE bm.buddy_id = b.id ORDER BY bm.created_at DESC LIMIT 1),
    (SELECT COUNT(*) FROM buddy_messages bm WHERE bm.buddy_id = b.id AND bm.is_read = false AND bm.sender_id != p_user_id)
  FROM fishing_buddies b
  JOIN profiles p ON p.id = CASE WHEN b.requester_id = p_user_id THEN b.recipient_id ELSE b.requester_id END
  WHERE b.status = 'accepted' AND (b.requester_id = p_user_id OR b.recipient_id = p_user_id)
  ORDER BY COALESCE(
    (SELECT bm.created_at FROM buddy_messages bm WHERE bm.buddy_id = b.id ORDER BY bm.created_at DESC LIMIT 1),
    b.created_at
  ) DESC;
$$;