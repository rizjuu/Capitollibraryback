-- ==============================================================================
-- 06: ADD SINGLE SESSION ENFORCEMENT COLUMN
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- This adds the `current_session_id` column to the `users` table to enforce
-- single-device / single-session active logins for patron and staff accounts,
-- preventing concurrent account sharing while keeping admin accounts flexible.
-- ==============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS current_session_id TEXT DEFAULT NULL;

-- Index for fast session ID lookup during protected route verification
CREATE INDEX IF NOT EXISTS idx_users_current_session_id ON users(current_session_id);
