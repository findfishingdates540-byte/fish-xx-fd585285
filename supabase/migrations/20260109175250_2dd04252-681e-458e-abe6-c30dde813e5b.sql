-- Add indexes for faster support ticket queries
-- Index on status for filtering by ticket status
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- Index on priority for filtering by priority
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);

-- Index on category for filtering by category
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON public.support_tickets(category);

-- Index on created_at for ordering (most common sort)
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- Composite index for common admin query pattern (status + created_at)
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created ON public.support_tickets(status, created_at DESC);

-- Refresh statistics for query planner
ANALYZE public.support_tickets;