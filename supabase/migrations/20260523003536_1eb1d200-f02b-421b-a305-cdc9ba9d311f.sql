
-- Repost notification trigger
CREATE OR REPLACE FUNCTION public.notify_feed_repost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  reposter_name TEXT;
BEGIN
  SELECT user_id INTO post_owner_id FROM feed_posts WHERE id = NEW.post_id;
  IF post_owner_id IS NULL OR post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT display_name INTO reposter_name FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    post_owner_id,
    'feed_repost',
    'New Repost',
    COALESCE(reposter_name, 'Someone') || ' reposted your post',
    jsonb_build_object('post_id', NEW.post_id, 'reposter_id', NEW.user_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_feed_repost ON public.post_reposts;
CREATE TRIGGER on_feed_repost
AFTER INSERT ON public.post_reposts
FOR EACH ROW
EXECUTE FUNCTION public.notify_feed_repost();

-- Post shares table
CREATE TABLE IF NOT EXISTS public.post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  recipient_id UUID,
  channel TEXT NOT NULL DEFAULT 'external',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON public.post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON public.post_shares(user_id);

ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own shares"
ON public.post_shares FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view their own shares"
ON public.post_shares FOR SELECT
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Post owners can view shares of their posts"
ON public.post_shares FOR SELECT
USING (EXISTS (
  SELECT 1 FROM feed_posts fp
  WHERE fp.id = post_shares.post_id AND fp.user_id = (SELECT auth.uid())
));

-- Share notification trigger
CREATE OR REPLACE FUNCTION public.notify_feed_share()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  sharer_name TEXT;
BEGIN
  SELECT user_id INTO post_owner_id FROM feed_posts WHERE id = NEW.post_id;
  IF post_owner_id IS NULL OR post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT display_name INTO sharer_name FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    post_owner_id,
    'feed_share',
    'New Share',
    COALESCE(sharer_name, 'Someone') || ' shared your post',
    jsonb_build_object('post_id', NEW.post_id, 'sharer_id', NEW.user_id, 'channel', NEW.channel)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_feed_share ON public.post_shares;
CREATE TRIGGER on_feed_share
AFTER INSERT ON public.post_shares
FOR EACH ROW
EXECUTE FUNCTION public.notify_feed_share();
