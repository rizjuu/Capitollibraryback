-- ==============================================================================
-- 05: CREATE RESERVATIONS & WAITING LIST TABLE
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- This creates the reservations table with queue tracking, pickup deadlines,
-- and row level security for the Capitol Library System.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    patron_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    patron_name TEXT NOT NULL,
    patron_email TEXT DEFAULT '',
    patron_phone TEXT DEFAULT '',
    pickup_date DATE NOT NULL,
    pickup_time TEXT DEFAULT 'During Library Hours (8AM - 5PM)',
    pickup_deadline TIMESTAMPTZ NOT NULL,
    queue_position INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'waiting', 'fulfilled', 'cancelled', 'expired')),
    notes TEXT DEFAULT '',
    notified_at TIMESTAMPTZ,
    fulfilled_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_book_id ON reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_reservations_patron_id ON reservations(patron_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_queue_position ON reservations(queue_position);
CREATE INDEX IF NOT EXISTS idx_reservations_pickup_deadline ON reservations(pickup_deadline);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Allow full access for backend service role key and application queries
DROP POLICY IF EXISTS "Full access reservations" ON reservations;
CREATE POLICY "Full access reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);
