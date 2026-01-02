-- Create function to notify mentioned users in comments
CREATE OR REPLACE FUNCTION public.notify_comment_mention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mentioned_username TEXT;
  mentioned_user_id UUID;
  commenter_name TEXT;
  post_owner_id UUID;
BEGIN
  -- Get commenter's name
  SELECT display_name INTO commenter_name FROM profiles WHERE id = NEW.user_id;
  
  -- Get post owner for context
  SELECT user_id INTO post_owner_id FROM feed_posts WHERE id = NEW.post_id;
  
  -- Find all @mentions in the comment content (format: @username)
  FOR mentioned_username IN
    SELECT DISTINCT (regexp_matches(NEW.content, '@([A-Za-z0-9_]+)', 'g'))[1]
  LOOP
    -- Find user by display_name (case insensitive)
    SELECT id INTO mentioned_user_id 
    FROM profiles 
    WHERE LOWER(REPLACE(display_name, ' ', '')) = LOWER(mentioned_username)
    LIMIT 1;
    
    -- If user found and it's not the commenter themselves
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id <> NEW.user_id THEN
      -- Create notification
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        mentioned_user_id,
        'comment_mention',
        'You were mentioned',
        COALESCE(commenter_name, 'Someone') || ' mentioned you in a comment',
        jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id)
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for comment mentions
DROP TRIGGER IF EXISTS on_comment_mention ON public.feed_comments;
CREATE TRIGGER on_comment_mention
  AFTER INSERT ON public.feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_comment_mention();

-- Enable realtime for reactions only (comments already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'feed_comment_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_comment_reactions;
  END IF;
END $$;