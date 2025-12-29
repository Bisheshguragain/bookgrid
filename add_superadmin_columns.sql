-- ============================================
-- ADD MISSING COLUMNS FOR SUPERADMIN
-- Some columns referenced by superadminService don't exist
-- ============================================

-- Add missing columns to users_profile
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS deletion_notice_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bookings_this_month INTEGER DEFAULT 0;

-- Verify columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users_profile'
AND column_name IN (
  'username',
  'account_status',
  'last_active_at', 
  'deletion_notice_sent_at',
  'scheduled_deletion_at',
  'bookings_this_month'
)
ORDER BY column_name;
