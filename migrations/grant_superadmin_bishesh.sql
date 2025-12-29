-- =====================================================
-- GRANT SUPERADMIN ACCESS (WITH COLUMN CHECK)
-- =====================================================
-- This script adds the role column if missing, then grants superadmin access
-- Run this in your Supabase SQL Editor

-- Step 1: Add role column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'role'
  ) THEN
    ALTER TABLE users_profile 
    ADD COLUMN role VARCHAR(20) DEFAULT 'user';
    
    -- Add check constraint
    ALTER TABLE users_profile 
    ADD CONSTRAINT users_profile_role_check 
    CHECK (role IN ('user', 'superadmin'));
  END IF;
END $$;

-- Step 2: Add other superadmin columns if they don't exist
DO $$ 
BEGIN
  -- Add last_active_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'last_active_at'
  ) THEN
    ALTER TABLE users_profile 
    ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add account_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE users_profile 
    ADD COLUMN account_status VARCHAR(20) DEFAULT 'active';
    
    ALTER TABLE users_profile 
    ADD CONSTRAINT users_profile_account_status_check 
    CHECK (account_status IN ('active', 'inactive', 'pending_deletion', 'deleted'));
  END IF;
  
  -- Add deletion_notice_sent_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'deletion_notice_sent_at'
  ) THEN
    ALTER TABLE users_profile 
    ADD COLUMN deletion_notice_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add scheduled_deletion_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'scheduled_deletion_at'
  ) THEN
    ALTER TABLE users_profile 
    ADD COLUMN scheduled_deletion_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile(role);
CREATE INDEX IF NOT EXISTS idx_users_profile_last_active ON users_profile(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_profile_account_status ON users_profile(account_status);

-- Step 4: Grant superadmin role
UPDATE users_profile
SET role = 'superadmin'
WHERE email = 'bishesh.guragain@gmail.com';

-- Verify the update
SELECT 
  id,
  email,
  full_name,
  role,
  subscription_plan,
  account_status,
  created_at
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';

-- Expected result: role should be 'superadmin'

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- List all superadmins
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM users_profile
WHERE role = 'superadmin'
ORDER BY created_at DESC;

-- Count superadmins
SELECT COUNT(*) as superadmin_count
FROM users_profile
WHERE role = 'superadmin';

-- =====================================================
-- NOTES
-- =====================================================
-- After running this script:
-- 1. The user can access /app/superadmin dashboard
-- 2. They will have full administrative privileges
-- 3. They can view all users, payments, and analytics
-- 4. They can manage subscriptions and deletions
-- 
-- To revoke access later:
-- UPDATE users_profile SET role = 'user' WHERE email = 'bishesh.guragain@gmail.com';
-- =====================================================
