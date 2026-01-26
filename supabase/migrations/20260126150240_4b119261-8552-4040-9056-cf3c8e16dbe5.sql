-- Create a table for tracking post reposts
CREATE TABLE public.post_reposts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable Row Level Security
ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view all reposts" 
ON public.post_reposts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own reposts" 
ON public.post_reposts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reposts" 
ON public.post_reposts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_post_reposts_user_id ON public.post_reposts(user_id);
CREATE INDEX idx_post_reposts_post_id ON public.post_reposts(post_id);