-- Fix: Set user2_liked to NULL (not false) so Juicy appears in discovery
UPDATE matches 
SET 
  is_match = false,
  matched_at = NULL,
  user2_liked = NULL,
  user2_viewed_at = NULL
WHERE id = 'a46b05e5-0aa7-4763-8a8e-5fa835bd1442';