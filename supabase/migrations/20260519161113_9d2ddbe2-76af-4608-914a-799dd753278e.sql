
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Feed
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_created ON public.feed_posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_catch ON public.feed_posts (catch_id) WHERE catch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feed_posts_content_trgm ON public.feed_posts USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON public.feed_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_user_post ON public.feed_likes (user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post_created ON public.feed_comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_comments_user ON public.feed_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_parent ON public.feed_comments (parent_id) WHERE parent_id IS NOT NULL;

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id) WHERE is_read = false;

-- Messages / matches
CREATE INDEX IF NOT EXISTS idx_messages_match_created ON public.messages (match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_match_unread ON public.messages (match_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON public.matches (user1_id) WHERE is_match = true;
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON public.matches (user2_id) WHERE is_match = true;
CREATE INDEX IF NOT EXISTS idx_matches_expires_at ON public.matches (expires_at) WHERE expires_at IS NOT NULL;

-- Buddies
CREATE INDEX IF NOT EXISTS idx_fishing_buddies_requester_status ON public.fishing_buddies (requester_id, status);
CREATE INDEX IF NOT EXISTS idx_fishing_buddies_recipient_status ON public.fishing_buddies (recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_buddy_messages_buddy_created ON public.buddy_messages (buddy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buddy_messages_buddy_unread ON public.buddy_messages (buddy_id) WHERE is_read = false;

-- Catches & leaderboards
CREATE INDEX IF NOT EXISTS idx_catches_user_caught ON public.catches (user_id, caught_at DESC);
CREATE INDEX IF NOT EXISTS idx_catches_species_verified ON public.catches (species_id) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_catches_verified_caught ON public.catches (caught_at DESC) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_catches_spot ON public.catches (fishing_spot_id) WHERE fishing_spot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_species_rank_weight ON public.leaderboard_entries (species_id, rank_by_weight);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_species_rank_count ON public.leaderboard_entries (species_id, rank_by_count);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user ON public.leaderboard_entries (user_id);

-- Teams
CREATE INDEX IF NOT EXISTS idx_team_posts_team_surface_created ON public.team_posts (team_id, surface, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_posts_visibility_created ON public.team_posts (visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_posts_author ON public.team_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_team_followers_user ON public.team_followers (user_id);
CREATE INDEX IF NOT EXISTS idx_team_followers_team ON public.team_followers (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members (user_id);
CREATE INDEX IF NOT EXISTS idx_team_post_comments_post_created ON public.team_post_comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_post_likes_post ON public.team_post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_fishing_teams_name_trgm ON public.fishing_teams USING gin (name gin_trgm_ops);

-- Profiles search
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm ON public.profiles USING gin (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_active_mode ON public.profiles (account_mode) WHERE is_active = true AND is_banned = false;
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles (last_active_at DESC) WHERE is_active = true;

-- Follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows (following_id);

-- Spots
CREATE INDEX IF NOT EXISTS idx_fishing_spots_created_by ON public.fishing_spots (created_by);
CREATE INDEX IF NOT EXISTS idx_fishing_spots_public_verified ON public.fishing_spots (is_public, is_verified);
CREATE INDEX IF NOT EXISTS idx_fishing_spots_latlng ON public.fishing_spots (location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_spot_ratings_spot ON public.spot_ratings (spot_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_spots_user ON public.user_saved_spots (user_id);

-- Trips
CREATE INDEX IF NOT EXISTS idx_fishing_trips_user_date ON public.fishing_trips (user_id, trip_date DESC);
CREATE INDEX IF NOT EXISTS idx_trip_participants_trip ON public.trip_participants (trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user ON public.trip_participants (user_id);

-- Challenges
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants (challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_reminders_due ON public.challenge_reminders (remind_at) WHERE sent = false;
CREATE INDEX IF NOT EXISTS idx_challenge_reminders_user ON public.challenge_reminders (user_id);
CREATE INDEX IF NOT EXISTS idx_fishing_challenges_status_start ON public.fishing_challenges (status, start_date DESC);

-- Stories
CREATE INDEX IF NOT EXISTS idx_stories_user_created ON public.stories (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON public.stories (expires_at);

-- Bookmarks / reposts
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user_created ON public.post_bookmarks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reposts_user_created ON public.post_reposts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reposts_post ON public.post_reposts (post_id);

-- Call sessions
CREATE INDEX IF NOT EXISTS idx_call_sessions_callee_status ON public.call_sessions (callee_id, status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller_created ON public.call_sessions (caller_id, created_at DESC);
