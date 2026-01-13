-- ============================================================================
-- Migration: Add Auto Reminders Toggle to users_profile
-- ============================================================================
-- Date: January 13, 2026
-- Purpose: Add toggle for automatic reminder notifications
-- ============================================================================

-- Step 1: Add auto_reminders_enabled column
ALTER TABLE users_profile 
  ADD COLUMN IF NOT EXISTS auto_reminders_enabled BOOLEAN DEFAULT TRUE NOT NULL;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN users_profile.auto_reminders_enabled IS 'Whether automatic appointment reminders are enabled for this user';

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Check new column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
  AND column_name = 'auto_reminders_enabled';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Auto reminders toggle column added successfully';
  RAISE NOTICE '✅ Default set to TRUE (reminders enabled by default)';
END $$;
