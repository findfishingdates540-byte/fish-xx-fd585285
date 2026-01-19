-- Create a function to notify callee of incoming calls
CREATE OR REPLACE FUNCTION public.notify_incoming_call()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_name text;
  call_type_text text;
BEGIN
  -- Only notify for new ringing calls
  IF NEW.status = 'ringing' THEN
    -- Get caller's name
    SELECT display_name INTO caller_name FROM profiles WHERE id = NEW.caller_id;
    
    -- Set call type text
    call_type_text := CASE WHEN NEW.call_type = 'video' THEN 'video' ELSE 'voice' END;
    
    -- Send push notification to callee
    BEGIN
      PERFORM extensions.http_post(
        url := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'userId', NEW.callee_id,
          'title', 'Incoming ' || call_type_text || ' call 📞',
          'body', COALESCE(caller_name, 'Someone') || ' is calling you',
          'url', '/app/messages',
          'tag', 'call-' || NEW.id
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to send incoming call push notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for incoming call notifications
DROP TRIGGER IF EXISTS on_incoming_call ON public.call_sessions;
CREATE TRIGGER on_incoming_call
  AFTER INSERT ON public.call_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_incoming_call();