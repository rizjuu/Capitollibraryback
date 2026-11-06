-- ==============================================================================
-- CAPITOL LIBRARY MANAGEMENT SYSTEM - MIGRATION 03
-- Purpose: Add call_number, sublocation, and Dewey Decimal Classification support
-- Based on: LMS PROVINCIAL LIBRARY DETAILS (Republic Act No. 7743)
-- Example Call Number: CIR 550 A123b 2020 (Spine code)
-- Sublocation Example: Circulation Section, 2nd Floor
-- ==============================================================================

-- 1. Add call_number column (Dewey Decimal Classification + Cutter Number + Year)
ALTER TABLE books ADD COLUMN IF NOT EXISTS call_number TEXT DEFAULT '';

-- 2. Add sublocation column (Floor / Area / Section specification)
ALTER TABLE books ADD COLUMN IF NOT EXISTS sublocation TEXT DEFAULT '';

-- 3. Create indexes for fast catalog searches by call number and sublocation
CREATE INDEX IF NOT EXISTS idx_books_call_number ON books(call_number);
CREATE INDEX IF NOT EXISTS idx_books_sublocation ON books(sublocation);

-- Optional: Comments for table columns
COMMENT ON COLUMN books.call_number IS 'Library Call Number following Dewey Decimal Classification format e.g. CIR 550 A123b 2020';
COMMENT ON COLUMN books.sublocation IS 'Physical sublocation in library e.g. Circulation Section, 2nd Floor';
