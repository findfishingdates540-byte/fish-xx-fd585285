
-- 1. Enable pg_net for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Preferences table
CREATE TABLE IF NOT EXISTS public.notification_email_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  master_enabled boolean NOT NULL DEFAULT true,
  buddy_request boolean NOT NULL DEFAULT true,
  message boolean NOT NULL DEFAULT true,
  buddy_message boolean NOT NULL DEFAULT true,
  match boolean NOT NULL DEFAULT true,
  trip_invite boolean NOT NULL DEFAULT true,
  trip_reminder boolean NOT NULL DEFAULT true,
  feed_like boolean NOT NULL DEFAULT true,
  feed_comment boolean NOT NULL DEFAULT true,
  comment_mention boolean NOT NULL DEFAULT true,
  new_follower boolean NOT NULL DEFAULT true,
  prize_won boolean NOT NULL DEFAULT true,
  challenge_new boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_email_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own email prefs"
ON public.notification_email_prefs FOR SELECT
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert their own email prefs"
ON public.notification_email_prefs FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update their own email prefs"
ON public.notification_email_prefs FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER trg_notification_email_prefs_updated_at
BEFORE UPDATE ON public.notification_email_prefs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Trigger: when a notification is inserted, call send-notification-email edge function
CREATE OR REPLACE FUNCTION public.handle_notification_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  fn_url text := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/send-notification-email';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqbW5sZWxxb2ljbGticnFlZnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzEzODksImV4cCI6MjA4MTEwNzM4OX0.tiO8ZVNokkENlh0D5cy0GVrwJN_jKiGZi_JUUNgASH0';
BEGIN
  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object('notification_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifications_email ON public.notifications;
CREATE TRIGGER trg_notifications_email
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.handle_notification_email();

-- 4. Fan-out helper for "new challenge published" notifications
CREATE OR REPLACE FUNCTION public.fanout_challenge_new(
  _title text,
  _body text,
  _data jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data, is_read)
  SELECT p.id, 'challenge_new', _title, _body, _data, false
  FROM public.profiles p
  WHERE p.is_active = true;
END;
$$;

-- 5. Triggers on the three challenge sources
CREATE OR REPLACE FUNCTION public.handle_fishing_challenge_published()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND COALESCE(NEW.status,'') IN ('active','published','upcoming'))
     OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status
         AND NEW.status IN ('active','published')) THEN
    PERFORM public.fanout_challenge_new(
      'New challenge: ' || NEW.title,
      COALESCE(NEW.description, 'A new fishing challenge has just been posted. Jump in!'),
      jsonb_build_object('challenge_id', NEW.id, 'kind', 'fishing_challenge')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fishing_challenge_email ON public.fishing_challenges;
CREATE TRIGGER trg_fishing_challenge_email
AFTER INSERT OR UPDATE OF status ON public.fishing_challenges
FOR EACH ROW EXECUTE FUNCTION public.handle_fishing_challenge_published();

CREATE OR REPLACE FUNCTION public.handle_photo_challenge_published()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND COALESCE(NEW.status,'') IN ('active','published','upcoming'))
     OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status
         AND NEW.status IN ('active','published')) THEN
    PERFORM public.fanout_challenge_new(
      'New photo challenge: ' || NEW.title,
      COALESCE(NEW.description, 'A new photo challenge has just been posted. Submit your shot!'),
      jsonb_build_object('challenge_id', NEW.id, 'kind', 'photo_challenge')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_photo_challenge_email ON public.photo_challenges;
CREATE TRIGGER trg_photo_challenge_email
AFTER INSERT OR UPDATE OF status ON public.photo_challenges
FOR EACH ROW EXECUTE FUNCTION public.handle_photo_challenge_published();

CREATE OR REPLACE FUNCTION public.handle_tournament_published()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND COALESCE(NEW.status,'') IN ('active','published','upcoming','registration_open'))
     OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status
         AND NEW.status IN ('active','published','registration_open')) THEN
    PERFORM public.fanout_challenge_new(
      'New tournament: ' || NEW.name,
      COALESCE(NEW.description, 'A new tournament is open. Register now!'),
      jsonb_build_object('challenge_id', NEW.id, 'kind', 'tournament')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tournament_email ON public.tournaments;
CREATE TRIGGER trg_tournament_email
AFTER INSERT OR UPDATE OF status ON public.tournaments
FOR EACH ROW EXECUTE FUNCTION public.handle_tournament_published();
