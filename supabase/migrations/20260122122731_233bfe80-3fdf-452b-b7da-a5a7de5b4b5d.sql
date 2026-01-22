-- Create stories table for 24-hour ephemeral content
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'text')),
  text_overlay TEXT,
  background_color TEXT DEFAULT '#1877F2',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Create story views tracking table
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Stories policies: users can view stories from people they follow or their own
CREATE POLICY "Users can view stories from followed users or own"
ON public.stories FOR SELECT
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.user_follows 
    WHERE follower_id = auth.uid() AND following_id = stories.user_id
  )
);

CREATE POLICY "Users can create their own stories"
ON public.stories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
ON public.stories FOR DELETE
USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Users can view story views for their own stories"
ON public.story_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_views.story_id AND stories.user_id = auth.uid()
  )
  OR viewer_id = auth.uid()
);

CREATE POLICY "Users can mark stories as viewed"
ON public.story_views FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Create indexes for performance
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON public.story_views(viewer_id);