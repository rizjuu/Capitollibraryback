-- ==============================================================================
-- Migration: Add SMS Reminder Tracking & Logs
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor)
-- ==============================================================================

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS borrower_phone TEXT DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reminder_2days_sent BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS last_overdue_sent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    borrower_id UUID REFERENCES users(id) ON DELETE SET NULL,
    borrower_name TEXT,
    phone TEXT NOT NULL,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('2days_before', 'due_today', 'overdue', 'manual', 'test', 'otp')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    error TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_tx ON sms_logs(transaction_id, reminder_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON sms_logs(created_at DESC);
