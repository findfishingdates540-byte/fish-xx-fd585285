-- Create optimized RPC function to get all chat data in a single call
CREATE OR REPLACE FUNCTION public.get_chat_data(p_user_id uuid, p_match_id uuid)
RETURNS TABLE (
  match_id uuid,
  other_user_id uuid,
  display_name text,
  photos text[],
  bio text,
  location_name text,
  preferred_species text[],
  id_verified boolean,
  live_verified boolean,
  messages jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH match_data AS (
    SELECT 
      m.id,
      CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END as other_id
    FROM matches m
    WHERE m.id = p_match_id
      AND (m.user1_id = p_user_id OR m.user2_id = p_user_id)
      AND m.is_match = true
  ),
  chat_messages AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', msg.id,
        'content', msg.content,
        'sender_id', msg.sender_id,
        'created_at', msg.created_at,
        'is_read', msg.is_read,
        'read_at', msg.read_at,
        'delivered_at', msg.delivered_at,
        'image_url', msg.image_url,
        'audio_url', msg.audio_url,
        'reply_to_id', msg.reply_to_id,
        'deleted_at', msg.deleted_at,
        'deleted_for_everyone', msg.deleted_for_everyone
      ) ORDER BY msg.created_at ASC
    ) as msgs
    FROM messages msg
    WHERE msg.match_id = p_match_id
  )
  SELECT 
    md.id as match_id,
    md.other_id as other_user_id,
    p.display_name,
    p.photos,
    p.bio,
    p.location_name,
    p.preferred_species,
    p.id_verified,
    p.live_verified,
    COALESCE(cm.msgs, '[]'::jsonb) as messages
  FROM match_data md
  JOIN profiles p ON p.id = md.other_id
  CROSS JOIN chat_messages cm;
END;
$$;