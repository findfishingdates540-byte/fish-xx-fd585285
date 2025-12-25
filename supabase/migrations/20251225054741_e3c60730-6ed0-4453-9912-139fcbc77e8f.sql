-- Add triggers to persist notifications for buddy requests, matches, and trip invites

-- 1. Trigger for new buddy requests
CREATE OR REPLACE FUNCTION public.notify_buddy_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name text;
BEGIN
  -- Only notify for new pending requests
  IF NEW.status = 'pending' THEN
    -- Get requester's name
    SELECT display_name INTO requester_name FROM profiles WHERE id = NEW.requester_id;
    
    -- Create notification record
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.recipient_id,
      'buddy_request',
      'New Buddy Request',
      COALESCE(requester_name, 'Someone') || ' wants to be your fishing buddy',
      jsonb_build_object('buddy_id', NEW.id, 'requester_id', NEW.requester_id)
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create buddy request notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for buddy requests
DROP TRIGGER IF EXISTS on_buddy_request ON fishing_buddies;
CREATE TRIGGER on_buddy_request
  AFTER INSERT ON fishing_buddies
  FOR EACH ROW
  EXECUTE FUNCTION notify_buddy_request();

-- 2. Update match notification to also persist to notifications table
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
    
    -- Create notification for user1
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user1_id,
      'match',
      'New Match! 🎉',
      'You matched with ' || COALESCE(user2_name, 'someone') || '!',
      jsonb_build_object('match_id', NEW.id, 'other_user_id', NEW.user2_id)
    );
    
    -- Create notification for user2
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user2_id,
      'match',
      'New Match! 🎉',
      'You matched with ' || COALESCE(user1_name, 'someone') || '!',
      jsonb_build_object('match_id', NEW.id, 'other_user_id', NEW.user1_id)
    );
    
    -- Also try to send push notifications (existing behavior)
    BEGIN
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
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to send push notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create match notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Update trip invite notification to also persist to notifications table
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
    
    -- Create notification record
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_id,
      'trip_invite',
      'Trip Invitation 🎣',
      COALESCE(owner_name, 'Someone') || ' invited you to "' || COALESCE(trip_title, 'a fishing trip') || '"',
      jsonb_build_object('trip_id', NEW.trip_id, 'participant_id', NEW.id, 'owner_id', trip_owner_id)
    );
    
    -- Also try to send push notification (existing behavior)
    BEGIN
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
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to send push notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create trip invite notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Trigger for new messages (dating)
CREATE OR REPLACE FUNCTION public.notify_new_message_persistent()
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
  
  -- Create notification record
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    recipient_id,
    'message',
    'New Message',
    COALESCE(sender_name, 'Someone') || ': ' || LEFT(NEW.content, 50),
    jsonb_build_object('match_id', NEW.match_id, 'message_id', NEW.id, 'sender_id', NEW.sender_id)
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create message notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_message_persistent ON messages;
CREATE TRIGGER on_new_message_persistent
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message_persistent();

-- 5. Trigger for buddy messages
CREATE OR REPLACE FUNCTION public.notify_buddy_message_persistent()
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
  
  -- Create notification record
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    recipient_id,
    'buddy_message',
    'Buddy Message 🎣',
    COALESCE(sender_name, 'A buddy') || ': ' || LEFT(NEW.content, 50),
    jsonb_build_object('buddy_id', NEW.buddy_id, 'message_id', NEW.id, 'sender_id', NEW.sender_id)
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create buddy message notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_buddy_message_persistent ON buddy_messages;
CREATE TRIGGER on_buddy_message_persistent
  AFTER INSERT ON buddy_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_buddy_message_persistent();