-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'feed_like', 'feed_comment'
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (via trigger)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function to create notification on like
CREATE OR REPLACE FUNCTION public.notify_feed_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  liker_name TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id FROM feed_posts WHERE id = NEW.post_id;
  
  -- Don't notify if liking own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker's name
  SELECT display_name INTO liker_name FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    post_owner_id,
    'feed_like',
    'New Like',
    COALESCE(liker_name, 'Someone') || ' liked your post',
    jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for likes
CREATE TRIGGER on_feed_like
AFTER INSERT ON public.feed_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_feed_like();

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION public.notify_feed_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  commenter_name TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id FROM feed_posts WHERE id = NEW.post_id;
  
  -- Don't notify if commenting on own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter's name
  SELECT display_name INTO commenter_name FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    post_owner_id,
    'feed_comment',
    'New Comment',
    COALESCE(commenter_name, 'Someone') || ' commented: ' || LEFT(NEW.content, 50),
    jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for comments
CREATE TRIGGER on_feed_comment
AFTER INSERT ON public.feed_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_feed_comment();