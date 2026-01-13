-- ============================================================================
-- Migration: Add Currency Settings
-- ============================================================================
-- Date: January 7, 2026
-- Purpose: Add currency preferences for users
-- ============================================================================

-- Step 1: Add currency column to users_profile table
ALTER TABLE users_profile 
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GBP';

-- Step 2: Add comment for documentation
COMMENT ON COLUMN users_profile.currency IS 'User preferred currency for pricing (USD, GBP, EUR, INR, CAD, etc.)';

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Check new column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
  AND column_name = 'currency';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Currency column added successfully';
  RAISE NOTICE '✅ Default currency set to GBP (British Pound)';
END $$;
