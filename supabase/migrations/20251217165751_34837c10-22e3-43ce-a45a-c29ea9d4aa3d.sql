-- Create fishing_buddies table for buddy connections
CREATE TABLE public.fishing_buddies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(requester_id, recipient_id),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- Enable RLS
ALTER TABLE public.fishing_buddies ENABLE ROW LEVEL SECURITY;

-- Users can create buddy requests
CREATE POLICY "Users can create buddy requests"
ON public.fishing_buddies
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Users can view their own buddy relationships
CREATE POLICY "Users can view own buddy relationships"
ON public.fishing_buddies
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Recipients can update request status
CREATE POLICY "Recipients can update buddy requests"
ON public.fishing_buddies
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Users can delete requests they sent
CREATE POLICY "Requesters can delete own requests"
ON public.fishing_buddies
FOR DELETE
USING (auth.uid() = requester_id);

-- Create index for faster lookups
CREATE INDEX idx_fishing_buddies_requester ON public.fishing_buddies(requester_id);
CREATE INDEX idx_fishing_buddies_recipient ON public.fishing_buddies(recipient_id);
CREATE INDEX idx_fishing_buddies_status ON public.fishing_buddies(status);