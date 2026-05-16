
-- 1) Tighten team_posts SELECT to respect visibility (hide pending_review from regular viewers)
DROP POLICY IF EXISTS "Page posts readable by all auth users" ON public.team_posts;
DROP POLICY IF EXISTS "Anyone can view public team page posts" ON public.team_posts;

CREATE POLICY "Team posts readable respecting visibility"
ON public.team_posts FOR SELECT TO authenticated
USING (
  is_hidden = false
  AND (
    -- Author, captain, admin can always see their/team's pending posts
    author_id = (SELECT auth.uid())
    OR is_team_captain((SELECT auth.uid()), team_id)
    OR has_role((SELECT auth.uid()), 'admin'::app_role)
    OR (
      visibility = 'public'::team_post_visibility
      AND (
        surface = 'page'::team_post_surface
        OR (surface = 'group'::team_post_surface AND is_team_member((SELECT auth.uid()), team_id))
      )
    )
  )
);

-- 2) Group post notifications for all team members
CREATE OR REPLACE FUNCTION public.notify_group_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  author_name text;
  team_name text;
  captain uuid;
  body_preview text;
BEGIN
  -- Only notify for visible group posts
  IF NEW.surface <> 'group'::team_post_surface OR NEW.visibility <> 'public'::team_post_visibility THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO author_name FROM profiles WHERE id = NEW.author_id;
  SELECT name, captain_id INTO team_name, captain FROM fishing_teams WHERE id = NEW.team_id;

  body_preview := COALESCE(author_name, 'A teammate') || ' posted in ' || COALESCE(team_name, 'your team');
  IF NEW.content IS NOT NULL AND length(NEW.content) > 0 THEN
    body_preview := body_preview || ': ' || LEFT(NEW.content, 80);
  END IF;

  -- Notify captain (if not author)
  IF captain IS NOT NULL AND captain <> NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      captain,
      'team_group_post',
      'New team post',
      body_preview,
      jsonb_build_object('post_id', NEW.id, 'team_id', NEW.team_id, 'surface', 'group', 'author_id', NEW.author_id)
    );
  END IF;

  -- Notify all members except author
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT
    tm.user_id,
    'team_group_post',
    'New team post',
    body_preview,
    jsonb_build_object('post_id', NEW.id, 'team_id', NEW.team_id, 'surface', 'group', 'author_id', NEW.author_id)
  FROM team_members tm
  WHERE tm.team_id = NEW.team_id
    AND tm.user_id <> NEW.author_id
    AND tm.user_id <> COALESCE(captain, '00000000-0000-0000-0000-000000000000'::uuid);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create group post notifications: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_group_post_insert ON public.team_posts;
CREATE TRIGGER trg_notify_group_post_insert
AFTER INSERT ON public.team_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_group_post();

-- Also fire when a pending_review post is later approved -> public
DROP TRIGGER IF EXISTS trg_notify_group_post_approved ON public.team_posts;
CREATE TRIGGER trg_notify_group_post_approved
AFTER UPDATE OF visibility ON public.team_posts
FOR EACH ROW
WHEN (OLD.visibility IS DISTINCT FROM NEW.visibility AND NEW.visibility = 'public'::team_post_visibility)
EXECUTE FUNCTION public.notify_group_post();
