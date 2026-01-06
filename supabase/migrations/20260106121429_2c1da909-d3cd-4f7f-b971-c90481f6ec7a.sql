-- Add two-tier verification fields to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS id_verified_by UUID,
  ADD COLUMN IF NOT EXISTS live_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS live_verified_by UUID,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Create verification_requests table for user submissions
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('id', 'live')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  rejection_reason TEXT,
  id_document_url TEXT,
  id_document_type TEXT,
  selfie_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verification_requests
CREATE POLICY "Users can submit verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own verification requests"
  ON verification_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification requests"
  ON verification_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update verification requests"
  ON verification_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for verification system
CREATE INDEX IF NOT EXISTS idx_profiles_id_verified ON profiles(id_verified) WHERE id_verified = true;
CREATE INDEX IF NOT EXISTS idx_profiles_live_verified ON profiles(live_verified) WHERE live_verified = true;
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_pending ON verification_requests(status, type) WHERE status = 'pending';