-- Enable pg_net extension for HTTP requests from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send push notification for new messages
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id uuid;
  sender_name text;
  match_record record;
BEGIN
  -- Get the match to find the recipient
  SELECT * INTO match_record FROM matches WHERE id = NEW.match_id;
  
  IF match_record IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determine recipient (the other user in the match)
  IF match_record.user1_id = NEW.sender_id THEN
    recipient_id := match_record.user2_id;
  ELSE
    recipient_id := match_record.user1_id;
  END IF;
  
  -- Get sender's name
  SELECT display_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  
  -- Call the edge function to send push notification
  PERFORM extensions.http_post(
    url := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'userId', recipient_id,
      'title', 'New Message',
      'body', COALESCE(sender_name, 'Someone') || ': ' || LEFT(NEW.content, 50),
      'url', '/app/messages/' || NEW.match_id,
      'tag', 'message-' || NEW.match_id
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send push notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Function to send push notification for new matches
CREATE OR REPLACE FUNCTION public.notify_new_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user1_name text;
  user2_name text;
BEGIN
  -- Only notify when is_match becomes true
  IF NEW.is_match = true AND (OLD.is_match IS NULL OR OLD.is_match = false) THEN
    -- Get user names
    SELECT display_name INTO user1_name FROM profiles WHERE id = NEW.user1_id;
    SELECT display_name INTO user2_name FROM profiles WHERE id = NEW.user2_id;
    
    -- Notify user1
    PERFORM extensions.http_post(
      url := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'userId', NEW.user1_id,
        'title', 'New Match! 🎉',
        'body', 'You matched with ' || COALESCE(user2_name, 'someone') || '!',
        'url', '/app/matches',
        'tag', 'match-' || NEW.id
      )
    );
    
    -- Notify user2
    PERFORM extensions.http_post(
      url := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'userId', NEW.user2_id,
        'title', 'New Match! 🎉',
        'body', 'You matched with ' || COALESCE(user1_name, 'someone') || '!',
        'url', '/app/matches',
        'tag', 'match-' || NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send match notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Function to send push notification for buddy messages
CREATE OR REPLACE FUNCTION public.notify_new_buddy_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id uuid;
  sender_name text;
  buddy_record record;
BEGIN
  -- Get the buddy relationship
  SELECT * INTO buddy_record FROM fishing_buddies WHERE id = NEW.buddy_id;
  
  IF buddy_record IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determine recipient
  IF buddy_record.requester_id = NEW.sender_id THEN
    recipient_id := buddy_record.recipient_id;
  ELSE
    recipient_id := buddy_record.requester_id;
  END IF;
  
  -- Get sender's name
  SELECT display_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  
  -- Send notification
  PERFORM extensions.http_post(
    url := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'userId', recipient_id,
      'title', 'Buddy Message 🎣',
      'body', COALESCE(sender_name, 'A buddy') || ': ' || LEFT(NEW.content, 50),
      'url', '/app/buddy-chat/' || NEW.buddy_id,
      'tag', 'buddy-' || NEW.buddy_id
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send buddy message notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Function to send push notification for trip invites
CREATE OR REPLACE FUNCTION public.notify_trip_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trip_title text;
  owner_name text;
  trip_owner_id uuid;
BEGIN
  -- Only notify for new invites
  IF NEW.status IN ('pending', 'invited') THEN
    -- Get trip details
    SELECT title, user_id INTO trip_title, trip_owner_id 
    FROM fishing_trips WHERE id = NEW.trip_id;
    
    -- Get owner name
    SELECT display_name INTO owner_name FROM profiles WHERE id = trip_owner_id;
    
    -- Send notification
    PERFORM extensions.http_post(
      url := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'userId', NEW.user_id,
        'title', 'Trip Invitation 🎣',
        'body', COALESCE(owner_name, 'Someone') || ' invited you to "' || COALESCE(trip_title, 'a fishing trip') || '"',
        'url', '/app/trips/' || NEW.trip_id,
        'tag', 'trip-' || NEW.trip_id
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send trip invite notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS on_new_message_notify ON messages;
CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

DROP TRIGGER IF EXISTS on_new_match_notify ON matches;
CREATE TRIGGER on_new_match_notify
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_match();

DROP TRIGGER IF EXISTS on_new_buddy_message_notify ON buddy_messages;
CREATE TRIGGER on_new_buddy_message_notify
  AFTER INSERT ON buddy_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_buddy_message();

DROP TRIGGER IF EXISTS on_trip_invite_notify ON trip_participants;
CREATE TRIGGER on_trip_invite_notify
  AFTER INSERT ON trip_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_trip_invite();