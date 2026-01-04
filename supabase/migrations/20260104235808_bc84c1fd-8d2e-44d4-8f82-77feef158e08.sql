-- Enable trigram extension for fast ILIKE pattern matching (mentions)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm ON profiles USING gin(display_name gin_trgm_ops);

-- Fishing buddies indexes
CREATE INDEX IF NOT EXISTS idx_fishing_buddies_requester_status ON fishing_buddies(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_fishing_buddies_recipient_status ON fishing_buddies(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_fishing_buddies_accepted ON fishing_buddies(status) WHERE status = 'accepted';

-- User roles index (admin check optimization)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_pending ON reports(status) WHERE status = 'pending';

-- Advertisements index
CREATE INDEX IF NOT EXISTS idx_advertisements_active_dates ON advertisements(is_active, start_date, end_date) WHERE is_active = true;

-- Blocked users index
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);

-- Feed comments indexes
CREATE INDEX IF NOT EXISTS idx_feed_comments_user_id ON feed_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_comment_reactions_lookup ON feed_comment_reactions(comment_id, user_id, emoji);