
-- 1. team_followers
CREATE TABLE IF NOT EXISTS public.team_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.fishing_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_team_followers_team ON public.team_followers(team_id);
CREATE INDEX IF NOT EXISTS idx_team_followers_user ON public.team_followers(user_id);
ALTER TABLE public.team_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team followers"
  ON public.team_followers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can follow teams"
  ON public.team_followers FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can unfollow teams"
  ON public.team_followers FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- followers_count on fishing_teams
ALTER TABLE public.fishing_teams
  ADD COLUMN IF NOT EXISTS followers_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_team_followers_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fishing_teams SET followers_count = followers_count + 1 WHERE id = NEW.team_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fishing_teams SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.team_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_team_followers_count ON public.team_followers;
CREATE TRIGGER trg_team_followers_count
AFTER INSERT OR DELETE ON public.team_followers
FOR EACH ROW EXECUTE FUNCTION public.update_team_followers_count();

-- 2. team_posts geo + visibility
ALTER TABLE public.team_posts
  ADD COLUMN IF NOT EXISTS location_lat numeric,
  ADD COLUMN IF NOT EXISTS location_lng numeric;

DO $$ BEGIN
  CREATE TYPE public.team_post_visibility AS ENUM ('public','pending_review','hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.team_posts
  ADD COLUMN IF NOT EXISTS visibility public.team_post_visibility NOT NULL DEFAULT 'public';

-- 3. media review queue
CREATE TABLE IF NOT EXISTS public.team_post_media_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.team_posts(id) ON DELETE CASCADE,
  media_index integer NOT NULL,
  kind text NOT NULL,
  url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_reviews_status ON public.team_post_media_reviews(status);
CREATE INDEX IF NOT EXISTS idx_media_reviews_post ON public.team_post_media_reviews(post_id);
ALTER TABLE public.team_post_media_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read media reviews"
  ON public.team_post_media_reviews FOR SELECT TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));
CREATE POLICY "Authors read own media reviews"
  ON public.team_post_media_reviews FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM team_posts tp WHERE tp.id = team_post_media_reviews.post_id AND tp.author_id = (SELECT auth.uid())));
CREATE POLICY "Admins update media reviews"
  ON public.team_post_media_reviews FOR UPDATE TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));

-- 4. Auto-queue video reviews + set pending visibility
CREATE OR REPLACE FUNCTION public.queue_team_post_video_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  item jsonb;
  idx int := 0;
  has_video boolean := false;
BEGIN
  IF NEW.media IS NULL OR jsonb_typeof(NEW.media) <> 'array' THEN
    RETURN NEW;
  END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.media) LOOP
    IF (item->>'type') = 'video' THEN
      has_video := true;
      INSERT INTO team_post_media_reviews(post_id, media_index, kind, url, status)
      VALUES (NEW.id, idx, 'video', item->>'url', 'pending');
    END IF;
    idx := idx + 1;
  END LOOP;
  IF has_video THEN
    UPDATE team_posts SET visibility = 'pending_review' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_queue_video_review ON public.team_posts;
CREATE TRIGGER trg_queue_video_review
AFTER INSERT ON public.team_posts
FOR EACH ROW EXECUTE FUNCTION public.queue_team_post_video_review();

-- 5. Update SELECT policy on team_posts to respect visibility
DROP POLICY IF EXISTS "View page posts public" ON public.team_posts;
DROP POLICY IF EXISTS "Anyone can view public team page posts" ON public.team_posts;

CREATE POLICY "Anyone can view public team page posts"
  ON public.team_posts FOR SELECT TO authenticated
  USING (
    surface = 'page'
    AND is_hidden = false
    AND (
      visibility = 'public'
      OR author_id = (SELECT auth.uid())
      OR is_team_captain((SELECT auth.uid()), team_id)
      OR has_role((SELECT auth.uid()), 'admin'::app_role)
    )
  );

-- 6. Notification triggers (likes & comments)
CREATE OR REPLACE FUNCTION public.notify_team_post_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  post_row team_posts%ROWTYPE;
  liker_name text;
BEGIN
  SELECT * INTO post_row FROM team_posts WHERE id = NEW.post_id;
  IF post_row.author_id IS NULL OR post_row.author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT display_name INTO liker_name FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    post_row.author_id,
    'team_post_like',
    'New Like',
    COALESCE(liker_name, 'Someone') || ' liked your team post',
    jsonb_build_object('post_id', NEW.post_id, 'team_id', post_row.team_id, 'surface', post_row.surface, 'liker_id', NEW.user_id)
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_team_post_like ON public.team_post_likes;
CREATE TRIGGER trg_notify_team_post_like
AFTER INSERT ON public.team_post_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_team_post_like();

CREATE OR REPLACE FUNCTION public.notify_team_post_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  post_row team_posts%ROWTYPE;
  commenter_name text;
BEGIN
  SELECT * INTO post_row FROM team_posts WHERE id = NEW.post_id;
  IF post_row.author_id IS NULL OR post_row.author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT display_name INTO commenter_name FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    post_row.author_id,
    'team_post_comment',
    'New Comment',
    COALESCE(commenter_name, 'Someone') || ' commented: ' || LEFT(NEW.content, 50),
    jsonb_build_object('post_id', NEW.post_id, 'team_id', post_row.team_id, 'surface', post_row.surface, 'commenter_id', NEW.user_id, 'comment_id', NEW.id)
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_team_post_comment ON public.team_post_comments;
CREATE TRIGGER trg_notify_team_post_comment
AFTER INSERT ON public.team_post_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_team_post_comment();
