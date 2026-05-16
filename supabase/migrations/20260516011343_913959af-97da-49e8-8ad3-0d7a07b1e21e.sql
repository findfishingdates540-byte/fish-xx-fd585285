
-- Enums
CREATE TYPE public.team_post_surface AS ENUM ('page', 'group');
CREATE TYPE public.team_post_type AS ENUM ('announcement','matchup','winning','teaser','update','catch','general');
CREATE TYPE public.team_report_status AS ENUM ('pending','reviewed','actioned','dismissed');

-- team_posts
CREATE TABLE public.team_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.fishing_teams(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  surface public.team_post_surface NOT NULL,
  post_type public.team_post_type NOT NULL DEFAULT 'general',
  content TEXT,
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  location_name TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  pinned BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  cross_posted_feed_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_team_posts_team_surface ON public.team_posts(team_id, surface, pinned DESC, created_at DESC);
CREATE INDEX idx_team_posts_author ON public.team_posts(author_id);
ALTER TABLE public.team_posts ENABLE ROW LEVEL SECURITY;

-- team_post_likes
CREATE TABLE public.team_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.team_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
ALTER TABLE public.team_post_likes ENABLE ROW LEVEL SECURITY;

-- team_post_comments
CREATE TABLE public.team_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.team_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.team_post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_team_post_comments_post ON public.team_post_comments(post_id, created_at);
ALTER TABLE public.team_post_comments ENABLE ROW LEVEL SECURITY;

-- team_post_reports
CREATE TABLE public.team_post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.team_posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status public.team_report_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, reporter_id)
);
ALTER TABLE public.team_post_reports ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_team_member(_user uuid, _team uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM fishing_teams WHERE id = _team AND captain_id = _user
  ) OR EXISTS (
    SELECT 1 FROM team_members WHERE team_id = _team AND user_id = _user
  )
$$;

CREATE OR REPLACE FUNCTION public.is_team_poster(_user uuid, _team uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM fishing_teams WHERE id = _team AND captain_id = _user
  ) OR EXISTS (
    SELECT 1 FROM team_members WHERE team_id = _team AND user_id = _user AND role IN ('officer','captain')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_team_captain(_user uuid, _team uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM fishing_teams WHERE id = _team AND captain_id = _user)
$$;

-- RLS: team_posts
CREATE POLICY "Page posts readable by all auth users"
  ON public.team_posts FOR SELECT TO authenticated
  USING (
    is_hidden = false
    AND (
      surface = 'page'
      OR (surface = 'group' AND public.is_team_member((SELECT auth.uid()), team_id))
      OR author_id = (SELECT auth.uid())
      OR public.has_role((SELECT auth.uid()), 'admin')
    )
  );

CREATE POLICY "Page posts insert by posters; group by members"
  ON public.team_posts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND (
      (surface = 'page' AND public.is_team_poster((SELECT auth.uid()), team_id))
      OR (surface = 'group' AND public.is_team_member((SELECT auth.uid()), team_id))
    )
  );

CREATE POLICY "Author or captain can update team posts"
  ON public.team_posts FOR UPDATE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    OR public.is_team_captain((SELECT auth.uid()), team_id)
    OR public.has_role((SELECT auth.uid()), 'admin')
  );

CREATE POLICY "Author or captain can delete team posts"
  ON public.team_posts FOR DELETE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    OR public.is_team_captain((SELECT auth.uid()), team_id)
    OR public.has_role((SELECT auth.uid()), 'admin')
  );

-- RLS: team_post_likes
CREATE POLICY "Likes readable when post visible"
  ON public.team_post_likes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM team_posts tp WHERE tp.id = post_id
    AND (tp.surface = 'page' OR public.is_team_member((SELECT auth.uid()), tp.team_id))));

CREATE POLICY "Users like visible posts"
  ON public.team_post_likes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM team_posts tp WHERE tp.id = post_id
      AND (tp.surface = 'page' OR public.is_team_member((SELECT auth.uid()), tp.team_id)))
  );

CREATE POLICY "Users remove own likes"
  ON public.team_post_likes FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- RLS: team_post_comments
CREATE POLICY "Comments readable when post visible"
  ON public.team_post_comments FOR SELECT TO authenticated
  USING (
    is_hidden = false
    AND EXISTS (SELECT 1 FROM team_posts tp WHERE tp.id = post_id
      AND (tp.surface = 'page' OR public.is_team_member((SELECT auth.uid()), tp.team_id)))
  );

CREATE POLICY "Users comment on visible posts"
  ON public.team_post_comments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM team_posts tp WHERE tp.id = post_id
      AND (tp.surface = 'page' OR public.is_team_member((SELECT auth.uid()), tp.team_id)))
  );

CREATE POLICY "Users edit own comments"
  ON public.team_post_comments FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Users delete own or captain deletes"
  ON public.team_post_comments FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.has_role((SELECT auth.uid()), 'admin')
    OR EXISTS (SELECT 1 FROM team_posts tp WHERE tp.id = post_id AND public.is_team_captain((SELECT auth.uid()), tp.team_id))
  );

-- RLS: team_post_reports
CREATE POLICY "Users create one report per post"
  ON public.team_post_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (SELECT auth.uid()));

CREATE POLICY "Reporters see own; admins see all"
  ON public.team_post_reports FOR SELECT TO authenticated
  USING (reporter_id = (SELECT auth.uid()) OR public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins update reports"
  ON public.team_post_reports FOR UPDATE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));

-- Triggers for counts
CREATE OR REPLACE FUNCTION public.update_team_post_likes_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE team_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE team_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_team_post_likes_count
AFTER INSERT OR DELETE ON public.team_post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_team_post_likes_count();

CREATE OR REPLACE FUNCTION public.update_team_post_comments_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE team_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE team_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_team_post_comments_count
AFTER INSERT OR DELETE ON public.team_post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_team_post_comments_count();

CREATE OR REPLACE FUNCTION public.bump_team_post_report_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE team_posts SET report_count = report_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_team_post_report_count
AFTER INSERT ON public.team_post_reports
FOR EACH ROW EXECUTE FUNCTION public.bump_team_post_report_count();

CREATE TRIGGER trg_team_posts_updated_at
BEFORE UPDATE ON public.team_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('team-media','team-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Team media publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'team-media');

CREATE POLICY "Team members upload to team-media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'team-media'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
    AND public.is_team_member((SELECT auth.uid()), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Team media owners delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'team-media'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );
