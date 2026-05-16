-- 1) Page views log -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.fishing_teams(id) ON DELETE CASCADE,
  viewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_team_page_views_team_created ON public.team_page_views(team_id, created_at DESC);

ALTER TABLE public.team_page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can log a page view" ON public.team_page_views;
CREATE POLICY "Anyone can log a page view"
ON public.team_page_views FOR INSERT TO authenticated
WITH CHECK (viewer_id IS NULL OR viewer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Captain can read team views" ON public.team_page_views;
CREATE POLICY "Captain can read team views"
ON public.team_page_views FOR SELECT TO authenticated
USING (public.is_team_captain((SELECT auth.uid()), team_id) OR public.has_role((SELECT auth.uid()), 'admin'));

-- 2) Follower mute toggle ------------------------------------------------------
ALTER TABLE public.team_followers
  ADD COLUMN IF NOT EXISTS notifications_muted boolean NOT NULL DEFAULT false;

-- 3) Notify un-muted followers on new public page posts -----------------------
CREATE OR REPLACE FUNCTION public.notify_page_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  team_row fishing_teams%ROWTYPE;
  author_name text;
BEGIN
  IF NEW.surface <> 'page' OR NEW.visibility <> 'public' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.visibility = 'public' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO team_row FROM fishing_teams WHERE id = NEW.team_id;
  SELECT display_name INTO author_name FROM profiles WHERE id = NEW.author_id;

  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT
    tf.user_id,
    'team_page_post',
    'New post from ' || COALESCE(team_row.name, 'a team you follow'),
    COALESCE(author_name, 'A teammate') || ': ' || LEFT(COALESCE(NEW.content, 'shared an update'), 80),
    jsonb_build_object('post_id', NEW.id, 'team_id', NEW.team_id, 'surface', 'page')
  FROM team_followers tf
  WHERE tf.team_id = NEW.team_id
    AND tf.notifications_muted = false
    AND tf.user_id <> NEW.author_id;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_page_post_insert ON public.team_posts;
CREATE TRIGGER trg_notify_page_post_insert
AFTER INSERT ON public.team_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_page_post();

DROP TRIGGER IF EXISTS trg_notify_page_post_approved ON public.team_posts;
CREATE TRIGGER trg_notify_page_post_approved
AFTER UPDATE OF visibility ON public.team_posts
FOR EACH ROW
WHEN (NEW.visibility = 'public' AND OLD.visibility IS DISTINCT FROM 'public')
EXECUTE FUNCTION public.notify_page_post();

-- 4) Captain insights RPC ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_team_page_insights(p_team_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller uuid := (SELECT auth.uid());
  result jsonb;
BEGIN
  IF NOT (public.is_team_captain(caller, p_team_id) OR public.has_role(caller, 'admin')) THEN
    RAISE EXCEPTION 'Captain only';
  END IF;

  SELECT jsonb_build_object(
    'views_30d', (
      SELECT COUNT(*) FROM team_page_views
      WHERE team_id = p_team_id AND created_at >= now() - interval '30 days'
    ),
    'unique_viewers_30d', (
      SELECT COUNT(DISTINCT viewer_id) FROM team_page_views
      WHERE team_id = p_team_id AND created_at >= now() - interval '30 days'
        AND viewer_id IS NOT NULL
    ),
    'views_7d', (
      SELECT COUNT(*) FROM team_page_views
      WHERE team_id = p_team_id AND created_at >= now() - interval '7 days'
    ),
    'followers_total', (
      SELECT COUNT(*) FROM team_followers WHERE team_id = p_team_id
    ),
    'followers_new_30d', (
      SELECT COUNT(*) FROM team_followers
      WHERE team_id = p_team_id AND created_at >= now() - interval '30 days'
    ),
    'followers_new_7d', (
      SELECT COUNT(*) FROM team_followers
      WHERE team_id = p_team_id AND created_at >= now() - interval '7 days'
    ),
    'top_post', (
      SELECT to_jsonb(t) FROM (
        SELECT id, content, media, likes_count, comments_count, created_at,
               (likes_count + comments_count * 2) AS engagement
        FROM team_posts
        WHERE team_id = p_team_id AND surface = 'page' AND visibility = 'public'
          AND created_at >= now() - interval '90 days'
        ORDER BY (likes_count + comments_count * 2) DESC, created_at DESC
        LIMIT 1
      ) t
    )
  ) INTO result;

  RETURN result;
END $$;