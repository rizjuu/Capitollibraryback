-- ==============================================================================
-- Migration: Add ID Verification and Admin CDO Residency Approval Fields
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor)
-- ==============================================================================

-- 1. Add ID verification and approval columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_type TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_photo TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS agreement_accepted BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID;

-- 2. Create index on approval_status for fast filtering of pending patrons
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);

-- 3. Upgrade patron_signup_verifications table to support storing registration payload if needed
ALTER TABLE patron_signup_verifications ADD COLUMN IF NOT EXISTS signup_payload JSONB DEFAULT '{}'::jsonb;
