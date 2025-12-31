-- =============================================
-- Performance Indexes for Find Fishing Dates
-- =============================================

-- MESSAGES TABLE - For chat performance
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_match_created ON public.messages(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(match_id, is_read) WHERE is_read = false;

-- MATCHES TABLE - For discovery and matching
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON public.matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_is_match ON public.matches(is_match) WHERE is_match = true;
CREATE INDEX IF NOT EXISTS idx_matches_matched_at ON public.matches(matched_at DESC) WHERE is_match = true;

-- CATCHES TABLE - For catch logs
CREATE INDEX IF NOT EXISTS idx_catches_user_id ON public.catches(user_id);
CREATE INDEX IF NOT EXISTS idx_catches_caught_at ON public.catches(caught_at DESC);
CREATE INDEX IF NOT EXISTS idx_catches_species_id ON public.catches(species_id);
CREATE INDEX IF NOT EXISTS idx_catches_fishing_spot_id ON public.catches(fishing_spot_id);

-- FEED_POSTS TABLE - For feed performance
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id ON public.feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON public.feed_posts(created_at DESC);

-- FEED_COMMENTS TABLE - For comment threads
CREATE INDEX IF NOT EXISTS idx_feed_comments_post_id ON public.feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_created_at ON public.feed_comments(post_id, created_at ASC);

-- FEED_LIKES TABLE - For like counts
CREATE INDEX IF NOT EXISTS idx_feed_likes_post_id ON public.feed_likes(post_id);

-- FISHING_TRIPS TABLE - For trip planning
CREATE INDEX IF NOT EXISTS idx_fishing_trips_user_id ON public.fishing_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_fishing_trips_trip_date ON public.fishing_trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_fishing_trips_status ON public.fishing_trips(status);
CREATE INDEX IF NOT EXISTS idx_fishing_trips_user_upcoming ON public.fishing_trips(user_id, trip_date) WHERE status = 'planned';

-- TRIP_PARTICIPANTS TABLE - For buddy trips
CREATE INDEX IF NOT EXISTS idx_trip_participants_trip_id ON public.trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user_id ON public.trip_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_status ON public.trip_participants(status);

-- FISHING_SPOTS TABLE - For spot discovery
CREATE INDEX IF NOT EXISTS idx_fishing_spots_created_by ON public.fishing_spots(created_by);
CREATE INDEX IF NOT EXISTS idx_fishing_spots_is_public ON public.fishing_spots(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_fishing_spots_rating ON public.fishing_spots(rating_avg DESC) WHERE is_public = true;

-- NOTIFICATIONS TABLE - For notification center
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- PROFILES TABLE - For discovery and matching
CREATE INDEX IF NOT EXISTS idx_profiles_account_mode ON public.profiles(account_mode);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active) WHERE is_active = true AND is_banned = false;
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed) WHERE onboarding_completed = true;

-- SPOT_RATINGS TABLE - For reviews
CREATE INDEX IF NOT EXISTS idx_spot_ratings_spot_id ON public.spot_ratings(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_ratings_user_id ON public.spot_ratings(user_id);

-- MESSAGE_REACTIONS TABLE - For reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);

-- BUDDY_MESSAGE_REACTIONS TABLE - For buddy chat reactions
CREATE INDEX IF NOT EXISTS idx_buddy_message_reactions_message_id ON public.buddy_message_reactions(message_id);

-- USER_SAVED_SPOTS TABLE - For saved spots
CREATE INDEX IF NOT EXISTS idx_user_saved_spots_user_id ON public.user_saved_spots(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_spots_spot_id ON public.user_saved_spots(spot_id);