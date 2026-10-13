-- ==============================================================================
-- Migration: Add Patron Personal Data Fields
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor)
-- ==============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS patron_type TEXT DEFAULT 'resident';
ALTER TABLE users ADD COLUMN IF NOT EXISTS school TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS year_level TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT false;
