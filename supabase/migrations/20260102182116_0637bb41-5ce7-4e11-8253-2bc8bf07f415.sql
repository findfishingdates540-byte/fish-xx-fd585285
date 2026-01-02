-- Update the notify_comment_mention function to also send push notifications
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
    -- Find user by display_name (case insensitive, removing spaces)
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
      
      -- Send push notification for mentions
      BEGIN
        PERFORM extensions.http_post(
          url := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/send-push-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body := jsonb_build_object(
            'userId', mentioned_user_id,
            'title', '💬 You were mentioned',
            'body', COALESCE(commenter_name, 'Someone') || ' mentioned you: ' || LEFT(NEW.content, 50),
            'url', '/app/feed?post=' || NEW.post_id || '&comment=' || NEW.id,
            'tag', 'mention-' || NEW.id
          )
        );
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to send mention push notification: %', SQLERRM;
      END;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_comment_mention ON feed_comments;
CREATE TRIGGER on_comment_mention
  AFTER INSERT ON feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_mention();