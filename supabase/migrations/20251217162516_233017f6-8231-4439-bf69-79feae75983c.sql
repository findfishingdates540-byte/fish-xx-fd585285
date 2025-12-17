-- Create table for user saved/favorited fishing spots
CREATE TABLE public.user_saved_spots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.fishing_spots(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, spot_id)
);

-- Enable RLS
ALTER TABLE public.user_saved_spots ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved spots
CREATE POLICY "Users can view own saved spots"
ON public.user_saved_spots
FOR SELECT
USING (auth.uid() = user_id);

-- Users can save spots
CREATE POLICY "Users can save spots"
ON public.user_saved_spots
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unsave spots
CREATE POLICY "Users can unsave spots"
ON public.user_saved_spots
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_user_saved_spots_user_id ON public.user_saved_spots(user_id);
CREATE INDEX idx_user_saved_spots_spot_id ON public.user_saved_spots(spot_id);