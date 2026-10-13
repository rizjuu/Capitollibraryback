-- ==============================================================================
-- CAPITOL LIBRARY MANAGEMENT SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================
-- Instructions:
-- 1. Log in to your Supabase project dashboard (https://supabase.com/dashboard)
-- 2. Navigate to "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this entire script, and click "Run"
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USERS TABLE (Admin, Staff, Patrons)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    google_id TEXT UNIQUE,
    avatar TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'patron')),
    name TEXT NOT NULL,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    patron_type TEXT DEFAULT 'resident' CHECK (patron_type IN ('student', 'resident')),
    school TEXT DEFAULT '',
    year_level TEXT DEFAULT '',
    age INTEGER,
    is_profile_completed BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    reset_password_code TEXT,
    reset_password_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Upgrade script for existing users tables:
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS patron_type TEXT DEFAULT 'resident';
ALTER TABLE users ADD COLUMN IF NOT EXISTS school TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS year_level TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ==============================================================================
-- 2. BOOKS TABLE (Catalog & Weeding)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn TEXT DEFAULT '',
    barcode TEXT UNIQUE NOT NULL,
    accession_number TEXT UNIQUE,
    title TEXT NOT NULL,
    author TEXT DEFAULT 'Unknown',
    authors JSONB DEFAULT '[]'::jsonb,
    category TEXT DEFAULT 'General',
    section TEXT DEFAULT 'Circulation Section (includes Fiction Books & Children''s Corner)',
    publisher TEXT DEFAULT 'N/A',
    publication_year INTEGER,
    shelf TEXT DEFAULT 'General Shelf',
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'maintenance', 'reserved')),
    available BOOLEAN DEFAULT true,
    date_added TIMESTAMPTZ DEFAULT now(),
    description TEXT DEFAULT '',
    cover_url TEXT DEFAULT '',
    open_library_key TEXT DEFAULT '',
    source TEXT DEFAULT 'manual',
    condition TEXT DEFAULT 'Good',
    copies INTEGER DEFAULT 1,
    borrowable BOOLEAN DEFAULT true,
    archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES users(id) ON DELETE SET NULL,
    weeding_reason TEXT DEFAULT 'Damaged / Outdated / Weeded',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_archived ON books(archived);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_section ON books(section);
CREATE INDEX IF NOT EXISTS idx_books_shelf ON books(shelf);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_available ON books(available);
CREATE INDEX IF NOT EXISTS idx_books_barcode ON books(barcode);
CREATE INDEX IF NOT EXISTS idx_books_accession ON books(accession_number);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);

-- ==============================================================================
-- 3. TRANSACTIONS TABLE (Circulation, Loans, Returns)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    borrower_id UUID REFERENCES users(id) ON DELETE SET NULL,
    borrower_name TEXT NOT NULL,
    borrower_email TEXT DEFAULT '',
    due_date TIMESTAMPTZ NOT NULL,
    returned BOOLEAN DEFAULT false,
    return_date TIMESTAMPTZ,
    type TEXT DEFAULT 'Borrow' CHECK (type IN ('Borrow', 'Return')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_returned ON transactions(returned);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_borrower_id ON transactions(borrower_id);
CREATE INDEX IF NOT EXISTS idx_transactions_borrower_email ON transactions(borrower_email);
CREATE INDEX IF NOT EXISTS idx_transactions_book_id ON transactions(book_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- ==============================================================================
-- 4. ANNOUNCEMENTS TABLE (Library Notices & Bulletins)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT DEFAULT to_char(now(), 'YYYY-MM-DD'),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    author TEXT DEFAULT 'Library Admin',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Enable RLS for database safety
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Full access policies for backend service role key and authenticated API calls
DROP POLICY IF EXISTS "Full access users" ON users;
CREATE POLICY "Full access users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access books" ON books;
CREATE POLICY "Full access books" ON books FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access transactions" ON transactions;
CREATE POLICY "Full access transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access announcements" ON announcements;
CREATE POLICY "Full access announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
