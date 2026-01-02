-- Add parent_id column to feed_comments for nested/reply comments
ALTER TABLE public.feed_comments 
ADD COLUMN parent_id uuid REFERENCES public.feed_comments(id) ON DELETE CASCADE;

-- Create index for faster nested comment lookups
CREATE INDEX idx_feed_comments_parent_id ON public.feed_comments(parent_id);

-- Create feed_comment_reactions table for emoji reactions
CREATE TABLE public.feed_comment_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, emoji)
);

-- Create indexes for reactions
CREATE INDEX idx_feed_comment_reactions_comment_id ON public.feed_comment_reactions(comment_id);
CREATE INDEX idx_feed_comment_reactions_user_id ON public.feed_comment_reactions(user_id);

-- Enable RLS on feed_comment_reactions
ALTER TABLE public.feed_comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for feed_comment_reactions
CREATE POLICY "Anyone can view comment reactions"
ON public.feed_comment_reactions
FOR SELECT
USING (true);

CREATE POLICY "Users can add their own reactions"
ON public.feed_comment_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
ON public.feed_comment_reactions
FOR DELETE
USING (auth.uid() = user_id);