-- ==============================================================================
-- 07: ADD FORGOT PASSWORD RATE LIMIT COLUMN
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- This adds the `reset_password_last_requested` column to the `users` table to enforce
-- a 2-hour cooldown between forgot password code requests, preventing spam.
-- ==============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_last_requested TIMESTAMPTZ DEFAULT NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_reset_password_last_requested ON users(reset_password_last_requested);
