
-- Update the match so Juicy (user1) has liked Lucas (user2), but Lucas hasn't liked back yet
UPDATE matches 
SET 
  is_match = false,
  matched_at = NULL,
  user2_liked = false,
  user2_viewed_at = NULL
WHERE id = 'a46b05e5-0aa7-4763-8a8e-5fa835bd1442';
