-- Phase 1: Create Missing Indexes for Active Query Patterns

-- Feed Likes - User Lookup Index (optimizes checking if user liked a post)
CREATE INDEX IF NOT EXISTS idx_feed_likes_user_id_post_id 
ON public.feed_likes(user_id, post_id);

-- Support Tickets - User ID Index (optimizes My Tickets page)
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id 
ON public.support_tickets(user_id) 
WHERE user_id IS NOT NULL;

-- Notifications - Type + Unread Partial Index (optimizes mention counts)
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_unread 
ON public.notifications(user_id, type) 
WHERE is_read = false;

-- Phase 2: Remove Unused Indexes (0 scans, add write overhead)

-- Profiles table unused indexes
DROP INDEX IF EXISTS idx_profiles_account_mode;
DROP INDEX IF EXISTS idx_profiles_is_active;
DROP INDEX IF EXISTS idx_profiles_is_verified;
DROP INDEX IF EXISTS idx_profiles_stripe_customer_id;
DROP INDEX IF EXISTS idx_profiles_verification_reminder;

-- Fishing buddies redundant indexes
DROP INDEX IF EXISTS idx_fishing_buddies_requester_status;
DROP INDEX IF EXISTS idx_fishing_buddies_recipient_status;

-- Matches unused index
DROP INDEX IF EXISTS idx_matches_is_match;

-- Feed tables (indexes not being used)
DROP INDEX IF EXISTS idx_feed_posts_user_id;
DROP INDEX IF EXISTS idx_feed_posts_created_at;
DROP INDEX IF EXISTS idx_feed_comments_user_id;
DROP INDEX IF EXISTS idx_feed_comments_parent_id;
DROP INDEX IF EXISTS idx_feed_likes_post_id;

-- Phase 3: Refresh Statistics for Query Planner
ANALYZE public.profiles;
ANALYZE public.notifications;
ANALYZE public.feed_posts;
ANALYZE public.feed_comments;
ANALYZE public.feed_likes;
ANALYZE public.messages;
ANALYZE public.buddy_messages;
ANALYZE public.matches;
ANALYZE public.support_tickets;