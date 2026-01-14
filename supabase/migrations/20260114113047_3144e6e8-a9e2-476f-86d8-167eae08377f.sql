-- Indexes for user_follows table (social profile lookups)
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_following ON user_follows(follower_id, following_id);

-- Indexes for feed_posts table (user profile posts)
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id ON feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_created ON feed_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON feed_posts(created_at DESC);

-- Indexes for feed_likes table (like counts and user like checks)
CREATE INDEX IF NOT EXISTS idx_feed_likes_post_id ON feed_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_user_post ON feed_likes(user_id, post_id);

-- Indexes for feed_comments table (comment fetching)
CREATE INDEX IF NOT EXISTS idx_feed_comments_post_id ON feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post_created ON feed_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_comments_user_id ON feed_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_parent_id ON feed_comments(parent_id) WHERE parent_id IS NOT NULL;

-- Indexes for feed_comment_reactions table
CREATE INDEX IF NOT EXISTS idx_feed_comment_reactions_comment_id ON feed_comment_reactions(comment_id);

-- Indexes for catches table (user catch history)
CREATE INDEX IF NOT EXISTS idx_catches_user_id ON catches(user_id);
CREATE INDEX IF NOT EXISTS idx_catches_user_caught_at ON catches(user_id, caught_at DESC);
CREATE INDEX IF NOT EXISTS idx_catches_fishing_spot_id ON catches(fishing_spot_id) WHERE fishing_spot_id IS NOT NULL;

-- Indexes for notifications table (notification queries)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Indexes for matches table (match lookups)
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_is_match ON matches(is_match) WHERE is_match = true;
CREATE INDEX IF NOT EXISTS idx_matches_matched_at ON matches(matched_at DESC) WHERE matched_at IS NOT NULL;

-- Indexes for trip_participants table
CREATE INDEX IF NOT EXISTS idx_trip_participants_trip_id ON trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user_id ON trip_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_trip_status ON trip_participants(trip_id, status);

-- Indexes for message_reactions table
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);

-- Indexes for blocked_users table
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);

-- Indexes for spot_ratings table
CREATE INDEX IF NOT EXISTS idx_spot_ratings_spot_id ON spot_ratings(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_ratings_user_id ON spot_ratings(user_id);

-- Refresh statistics for query optimizer
ANALYZE user_follows;
ANALYZE feed_posts;
ANALYZE feed_likes;
ANALYZE feed_comments;
ANALYZE feed_comment_reactions;
ANALYZE catches;
ANALYZE notifications;
ANALYZE matches;
ANALYZE trip_participants;
ANALYZE message_reactions;
ANALYZE blocked_users;
ANALYZE spot_ratings;