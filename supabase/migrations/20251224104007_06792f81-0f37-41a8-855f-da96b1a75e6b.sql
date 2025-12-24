-- Create feed_posts table
CREATE TABLE public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  catch_id UUID REFERENCES catches(id) ON DELETE SET NULL,
  content TEXT,
  photos TEXT[],
  location_name TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create feed_likes table
CREATE TABLE public.feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create feed_comments table
CREATE TABLE public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- Feed posts policies
CREATE POLICY "Anyone can view feed posts"
ON public.feed_posts FOR SELECT
USING (true);

CREATE POLICY "Users can create own posts"
ON public.feed_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
ON public.feed_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
ON public.feed_posts FOR DELETE
USING (auth.uid() = user_id);

-- Feed likes policies
CREATE POLICY "Anyone can view likes"
ON public.feed_likes FOR SELECT
USING (true);

CREATE POLICY "Users can create own likes"
ON public.feed_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
ON public.feed_likes FOR DELETE
USING (auth.uid() = user_id);

-- Feed comments policies
CREATE POLICY "Anyone can view comments"
ON public.feed_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create own comments"
ON public.feed_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.feed_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.feed_comments FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE feed_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE feed_comments;

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_feed_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for likes count
CREATE TRIGGER update_likes_count
AFTER INSERT OR DELETE ON public.feed_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_feed_post_likes_count();

-- Function to update comments count
CREATE OR REPLACE FUNCTION public.update_feed_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for comments count
CREATE TRIGGER update_comments_count
AFTER INSERT OR DELETE ON public.feed_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_feed_post_comments_count();

-- Updated at trigger for posts
CREATE TRIGGER update_feed_posts_updated_at
BEFORE UPDATE ON public.feed_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Updated at trigger for comments
CREATE TRIGGER update_feed_comments_updated_at
BEFORE UPDATE ON public.feed_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();