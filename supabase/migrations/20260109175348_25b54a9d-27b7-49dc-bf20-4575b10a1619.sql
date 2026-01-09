-- Admin-side performance indexes

-- Support ticket responses (for ticket detail loading)
CREATE INDEX IF NOT EXISTS idx_support_ticket_responses_ticket_id ON public.support_ticket_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_responses_created_at ON public.support_ticket_responses(created_at DESC);

-- Audit logs (admin activity monitoring)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Reports (moderation)
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.reports(status, created_at DESC);

-- Verification requests
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_type ON public.verification_requests(type);
CREATE INDEX IF NOT EXISTS idx_verification_requests_created_at ON public.verification_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);

-- User roles (admin checks)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Profiles (admin user management)
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned) WHERE is_banned = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON public.profiles(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Matches (admin overview)
CREATE INDEX IF NOT EXISTS idx_matches_is_match ON public.matches(is_match) WHERE is_match = true;
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_matched_at ON public.matches(matched_at DESC) WHERE matched_at IS NOT NULL;

-- Feed posts (content moderation)
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id ON public.feed_posts(user_id);

-- Feed comments (content moderation)
CREATE INDEX IF NOT EXISTS idx_feed_comments_created_at ON public.feed_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post_id ON public.feed_comments(post_id);

-- Fishing trips (admin overview)
CREATE INDEX IF NOT EXISTS idx_fishing_trips_status ON public.fishing_trips(status);
CREATE INDEX IF NOT EXISTS idx_fishing_trips_trip_date ON public.fishing_trips(trip_date DESC);

-- Catches (admin overview)
CREATE INDEX IF NOT EXISTS idx_catches_created_at ON public.catches(created_at DESC);

-- Advertisements (admin management)
CREATE INDEX IF NOT EXISTS idx_advertisements_is_active ON public.advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_advertisements_start_date ON public.advertisements(start_date);
CREATE INDEX IF NOT EXISTS idx_advertisements_end_date ON public.advertisements(end_date);

-- Refresh statistics for query planner
ANALYZE public.support_ticket_responses;
ANALYZE public.audit_logs;
ANALYZE public.reports;
ANALYZE public.verification_requests;
ANALYZE public.user_roles;
ANALYZE public.profiles;
ANALYZE public.matches;
ANALYZE public.feed_posts;
ANALYZE public.feed_comments;
ANALYZE public.fishing_trips;
ANALYZE public.catches;
ANALYZE public.advertisements;