-- Add indexes for messages table to optimize conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_match_id_created_at ON messages(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_match_id_is_read ON messages(match_id, is_read) WHERE is_read = false;

-- Add indexes for buddy_messages table to optimize conversation queries
CREATE INDEX IF NOT EXISTS idx_buddy_messages_buddy_id_created_at ON buddy_messages(buddy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buddy_messages_buddy_id_is_read ON buddy_messages(buddy_id, is_read) WHERE is_read = false;