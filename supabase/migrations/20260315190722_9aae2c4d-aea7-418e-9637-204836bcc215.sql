
-- Rate limits table for edge function rate limiting
CREATE TABLE public.rate_limits (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

-- No RLS needed - only accessed via SECURITY DEFINER function
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Index for cleanup queries
CREATE INDEX idx_rate_limits_window_start ON public.rate_limits (window_start);

-- Atomic rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT, 
  p_max_requests INTEGER, 
  p_window_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMPTZ;
BEGIN
  -- Calculate the start of the current window
  window_start_time := to_timestamp(
    floor(EXTRACT(EPOCH FROM now()) / p_window_seconds) * p_window_seconds
  );
  
  -- Atomically insert or increment
  INSERT INTO rate_limits (key, window_start, request_count)
  VALUES (p_key, window_start_time, 1)
  ON CONFLICT (key, window_start) DO UPDATE
  SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO current_count;
  
  -- Cleanup old windows (probabilistic - 1 in 10 calls)
  IF random() < 0.1 THEN
    DELETE FROM rate_limits WHERE window_start < now() - INTERVAL '2 hours';
  END IF;
  
  RETURN current_count <= p_max_requests;
END;
$$;
