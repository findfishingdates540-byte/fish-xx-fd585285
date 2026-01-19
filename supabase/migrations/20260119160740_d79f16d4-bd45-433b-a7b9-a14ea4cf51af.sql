-- Update the notify_incoming_call function to deep-link to the dedicated call screen
CREATE OR REPLACE FUNCTION public.notify_incoming_call()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    
    -- Send push notification to callee with deep-link to call screen
    BEGIN
      PERFORM net.http_post(
        url := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'userId', NEW.callee_id,
          'title', 'Incoming ' || call_type_text || ' call 📞',
          'body', COALESCE(caller_name, 'Someone') || ' is calling you',
          'url', '/app/calls/' || NEW.id::text,
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
$function$;