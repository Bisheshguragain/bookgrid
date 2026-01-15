-- ============================================================================
-- Fix: Make auto_reminders_enabled NOT NULL
-- ============================================================================
-- Date: January 15, 2026
-- Purpose: Ensure auto_reminders_enabled column is NOT NULL
-- ============================================================================

-- Step 1: Update any NULL values to TRUE (safety check)
UPDATE users_profile
SET auto_reminders_enabled = TRUE
WHERE auto_reminders_enabled IS NULL;

-- Step 2: Make the column NOT NULL
ALTER TABLE users_profile
ALTER COLUMN auto_reminders_enabled SET NOT NULL;

-- Step 3: Verify the change
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
  AND column_name = 'auto_reminders_enabled';

-- Expected result:
-- column_name: auto_reminders_enabled
-- data_type: boolean
-- column_default: true
-- is_nullable: NO  <-- Should be NO now

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ auto_reminders_enabled column is now NOT NULL';
  RAISE NOTICE '✅ All NULL values have been set to TRUE';
  RAISE NOTICE '✅ Database integrity improved';
END $$;
