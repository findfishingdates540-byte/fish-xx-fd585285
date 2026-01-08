-- 1. Create user_follows table for follower relationships
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Add check constraint via trigger to prevent self-follows
CREATE OR REPLACE FUNCTION public.prevent_self_follow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.follower_id = NEW.following_id THEN
    RAISE EXCEPTION 'Users cannot follow themselves';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_self_follow
  BEFORE INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_follow();

-- 2. Add counter columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_likes_received INTEGER DEFAULT 0;

-- 3. Create trigger function for follow count updates
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_follow_counts();

-- 4. Create trigger function for total likes received
CREATE OR REPLACE FUNCTION public.update_total_likes_received()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO post_owner_id FROM public.feed_posts WHERE id = NEW.post_id;
    IF post_owner_id IS NOT NULL THEN
      UPDATE public.profiles SET total_likes_received = total_likes_received + 1 WHERE id = post_owner_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT user_id INTO post_owner_id FROM public.feed_posts WHERE id = OLD.post_id;
    IF post_owner_id IS NOT NULL THEN
      UPDATE public.profiles SET total_likes_received = GREATEST(total_likes_received - 1, 0) WHERE id = post_owner_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_like_change_update_total
  AFTER INSERT OR DELETE ON public.feed_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_total_likes_received();

-- 5. Enable RLS on user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for user_follows
CREATE POLICY "Anyone can view follows"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- 7. Create notification trigger for new followers
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
BEGIN
  SELECT display_name INTO follower_name FROM public.profiles WHERE id = NEW.follower_id;
  
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.following_id,
    'new_follower',
    'New Follower',
    COALESCE(follower_name, 'Someone') || ' started following you',
    jsonb_build_object('follower_id', NEW.follower_id)
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create follower notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_new_follow_notify
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follower();

-- 8. Backfill total_likes_received from existing data
UPDATE public.profiles p
SET total_likes_received = (
  SELECT COALESCE(SUM(fp.likes_count), 0)::INTEGER
  FROM public.feed_posts fp
  WHERE fp.user_id = p.id
);

-- 9. Update public_profiles view to include new columns
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker = true) AS
SELECT 
  id,
  display_name,
  bio,
  photos,
  cover_photo,
  city,
  state,
  location_name,
  location_lat,
  location_lng,
  gender,
  interested_in,
  looking_for,
  fishing_experience,
  fishing_styles,
  fishing_gear,
  preferred_species,
  interests,
  height_cm,
  education,
  occupation,
  zodiac_sign,
  personality_type,
  smoking,
  drinking,
  prompt_responses,
  is_verified,
  id_verified,
  live_verified,
  is_premium,
  is_active,
  is_banned,
  last_active_at,
  created_at,
  onboarding_completed,
  account_mode,
  matching_style,
  min_age_preference,
  max_age_preference,
  max_distance_miles,
  followers_count,
  following_count,
  total_likes_received,
  EXTRACT(YEAR FROM AGE(date_of_birth))::INTEGER AS age
FROM public.profiles;