-- Index for fetching dismissed/hidden profiles efficiently
CREATE INDEX IF NOT EXISTS idx_fishing_buddies_requester_status 
ON public.fishing_buddies (requester_id, status);

-- Index for recipient lookups (buddy requests received)
CREATE INDEX IF NOT EXISTS idx_fishing_buddies_recipient_status 
ON public.fishing_buddies (recipient_id, status);

-- Index for accepted buddies lookup (common query pattern)
CREATE INDEX IF NOT EXISTS idx_fishing_buddies_accepted 
ON public.fishing_buddies (requester_id, recipient_id) 
WHERE status = 'accepted';