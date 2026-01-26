-- Add expires_at column to matches table for match expiration system
ALTER TABLE matches ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Create index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_matches_expires_at ON matches(expires_at) WHERE expires_at IS NOT NULL AND is_match = true;

-- Create a function to set expiration when a match is created
CREATE OR REPLACE FUNCTION set_match_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set expiration when is_match becomes true
  IF NEW.is_match = true AND (OLD IS NULL OR OLD.is_match = false) THEN
    -- Set expiration to 24 hours from now
    NEW.expires_at = NOW() + INTERVAL '24 hours';
    NEW.matched_at = COALESCE(NEW.matched_at, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-set expiration on match
DROP TRIGGER IF EXISTS trigger_set_match_expiration ON matches;
CREATE TRIGGER trigger_set_match_expiration
  BEFORE INSERT OR UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION set_match_expiration();

-- Create a function to clear expiration when first message is sent
CREATE OR REPLACE FUNCTION clear_match_expiration_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- When a message is inserted, clear the expiration for that match
  UPDATE matches 
  SET expires_at = NULL 
  WHERE id = NEW.match_id AND expires_at IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for clearing expiration on first message
DROP TRIGGER IF EXISTS trigger_clear_match_expiration ON messages;
CREATE TRIGGER trigger_clear_match_expiration
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION clear_match_expiration_on_message();