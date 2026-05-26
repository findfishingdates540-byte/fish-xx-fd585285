
-- Threads
CREATE TABLE public.team_page_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.fishing_teams(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  last_sender_id uuid,
  unread_for_captain integer NOT NULL DEFAULT 0,
  unread_for_visitor integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, visitor_id)
);
CREATE INDEX idx_tpt_team ON public.team_page_threads(team_id, last_message_at DESC);
CREATE INDEX idx_tpt_visitor ON public.team_page_threads(visitor_id, last_message_at DESC);
ALTER TABLE public.team_page_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitor or team staff can read thread"
  ON public.team_page_threads FOR SELECT
  USING (
    visitor_id = (SELECT auth.uid())
    OR public.is_team_poster((SELECT auth.uid()), team_id)
  );

CREATE POLICY "Authenticated users can create their own thread"
  ON public.team_page_threads FOR INSERT
  WITH CHECK (visitor_id = (SELECT auth.uid()));

CREATE POLICY "Visitor or team staff can update thread"
  ON public.team_page_threads FOR UPDATE
  USING (
    visitor_id = (SELECT auth.uid())
    OR public.is_team_poster((SELECT auth.uid()), team_id)
  );

CREATE TRIGGER trg_tpt_updated_at BEFORE UPDATE ON public.team_page_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.team_page_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.team_page_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tpm_thread ON public.team_page_messages(thread_id, created_at);
ALTER TABLE public.team_page_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitor or team staff can read messages"
  ON public.team_page_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_page_threads t
      WHERE t.id = thread_id
        AND (t.visitor_id = (SELECT auth.uid())
             OR public.is_team_poster((SELECT auth.uid()), t.team_id))
    )
  );

CREATE POLICY "Visitor or team staff can send messages"
  ON public.team_page_messages FOR INSERT
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.team_page_threads t
      WHERE t.id = thread_id
        AND (t.visitor_id = (SELECT auth.uid())
             OR public.is_team_poster((SELECT auth.uid()), t.team_id))
    )
  );

-- Trigger: bump thread + notify
CREATE OR REPLACE FUNCTION public.on_team_page_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread public.team_page_threads%ROWTYPE;
  v_team public.fishing_teams%ROWTYPE;
  v_sender_name text;
  v_from_visitor boolean;
BEGIN
  SELECT * INTO v_thread FROM public.team_page_threads WHERE id = NEW.thread_id;
  SELECT * INTO v_team FROM public.fishing_teams WHERE id = v_thread.team_id;
  SELECT display_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;

  v_from_visitor := (NEW.sender_id = v_thread.visitor_id);

  UPDATE public.team_page_threads SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 140),
    last_sender_id = NEW.sender_id,
    unread_for_captain = CASE WHEN v_from_visitor THEN unread_for_captain + 1 ELSE unread_for_captain END,
    unread_for_visitor = CASE WHEN v_from_visitor THEN unread_for_visitor ELSE unread_for_visitor + 1 END
  WHERE id = NEW.thread_id;

  IF v_from_visitor THEN
    -- Notify captain
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_team.captain_id,
      'team_page_message',
      'New page message',
      COALESCE(v_sender_name, 'Someone') || ' messaged ' || v_team.name || ': ' || LEFT(NEW.content, 80),
      jsonb_build_object('team_id', v_team.id, 'thread_id', NEW.thread_id, 'sender_id', NEW.sender_id)
    );
  ELSE
    -- Notify visitor
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_thread.visitor_id,
      'team_page_message',
      v_team.name || ' replied',
      LEFT(NEW.content, 120),
      jsonb_build_object('team_id', v_team.id, 'thread_id', NEW.thread_id, 'sender_id', NEW.sender_id)
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'team_page_message trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tpm_after_insert
  AFTER INSERT ON public.team_page_messages
  FOR EACH ROW EXECUTE FUNCTION public.on_team_page_message_insert();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_page_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_page_messages;
