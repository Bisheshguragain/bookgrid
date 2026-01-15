-- ============================================================================
-- Migration: Add Auto Reminders Settings to users_profile
-- ============================================================================
-- Date: January 13, 2026
-- Purpose: Add auto reminders toggle and reminder template settings
-- ============================================================================

-- Step 1: Add auto_reminders_enabled column to users_profile table
ALTER TABLE users_profile 
  ADD COLUMN IF NOT EXISTS auto_reminders_enabled BOOLEAN DEFAULT TRUE;

-- Step 2: Set any NULL values to TRUE (for safety)
UPDATE users_profile
SET auto_reminders_enabled = TRUE
WHERE auto_reminders_enabled IS NULL;

-- Step 3: Make the column NOT NULL
ALTER TABLE users_profile
ALTER COLUMN auto_reminders_enabled SET NOT NULL;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN users_profile.auto_reminders_enabled IS 'Whether automatic appointment reminders are enabled for this user';

-- ============================================================================
-- Verification Queries
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
  RAISE NOTICE '✅ Auto reminders enabled column added successfully';
  RAISE NOTICE '✅ Default set to TRUE (auto reminders enabled by default)';
  RAISE NOTICE '✅ Column set to NOT NULL (no null values allowed)';
END $$;
