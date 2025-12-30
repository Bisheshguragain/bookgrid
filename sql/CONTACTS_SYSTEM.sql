-- ============================================
-- CONTACTS MANAGEMENT SYSTEM
-- BookGrid - Secure Contact Storage
-- ============================================

-- ============================================
-- 1. CREATE CONTACTS TABLE
-- Stores user contacts with RLS protection
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
    
    -- Contact fields (ONLY these 3 as specified)
    full_name TEXT NOT NULL CHECK (
        length(trim(full_name)) >= 2 AND 
        length(trim(full_name)) <= 100
    ),
    email TEXT NOT NULL CHECK (
        email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ),
    phone_number TEXT NOT NULL CHECK (
        -- Allow various phone formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
        phone_number ~ '^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$'
    ),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique email per user (user can't have duplicate contacts)
    CONSTRAINT unique_contact_per_user UNIQUE (user_id, email)
);

-- ============================================
-- 2. ROW LEVEL SECURITY (RLS)
-- Critical security layer - users can only access their own contacts
-- ============================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their own contacts
CREATE POLICY "contacts_select_own" ON contacts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only INSERT their own contacts
CREATE POLICY "contacts_insert_own" ON contacts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only UPDATE their own contacts
CREATE POLICY "contacts_update_own" ON contacts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only DELETE their own contacts
CREATE POLICY "contacts_delete_own" ON contacts
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(user_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_full_name ON contacts(user_id, full_name);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(user_id, created_at DESC);

-- ============================================
-- 4. TRIGGER: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contacts_updated_at ON contacts;
CREATE TRIGGER contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- ============================================
-- 5. FUNCTION: Sanitize contact input
-- Prevents XSS and injection attacks
-- ============================================
CREATE OR REPLACE FUNCTION sanitize_contact_input()
RETURNS TRIGGER AS $$
BEGIN
    -- Trim whitespace from all text fields
    NEW.full_name = trim(NEW.full_name);
    NEW.email = lower(trim(NEW.email));
    NEW.phone_number = trim(NEW.phone_number);
    
    -- Remove any HTML tags (basic XSS prevention)
    NEW.full_name = regexp_replace(NEW.full_name, '<[^>]*>', '', 'g');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contacts_sanitize ON contacts;
CREATE TRIGGER contacts_sanitize
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION sanitize_contact_input();

-- ============================================
-- 6. RATE LIMITING: Prevent spam contact creation
-- Max 100 contacts per user
-- ============================================
CREATE OR REPLACE FUNCTION check_contact_limit()
RETURNS TRIGGER AS $$
DECLARE
    contact_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO contact_count
    FROM contacts
    WHERE user_id = NEW.user_id;
    
    IF contact_count >= 500 THEN
        RAISE EXCEPTION 'Contact limit reached (maximum 500 contacts per user)';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contacts_limit_check ON contacts;
CREATE TRIGGER contacts_limit_check
    BEFORE INSERT ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION check_contact_limit();

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table exists
-- SELECT * FROM information_schema.tables WHERE table_name = 'contacts';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'contacts';

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'contacts';

COMMENT ON TABLE contacts IS 'Stores user contacts for quick booking. Protected by RLS.';
COMMENT ON COLUMN contacts.full_name IS 'Contact full name (2-100 chars, sanitized)';
COMMENT ON COLUMN contacts.email IS 'Contact email address (validated format, lowercase)';
COMMENT ON COLUMN contacts.phone_number IS 'Contact phone number (flexible format validation)';
