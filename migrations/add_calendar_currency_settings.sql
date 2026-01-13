-- ============================================================================
-- Migration: Add Currency Setting to users_profile
-- ============================================================================
-- Date: January 7, 2026
-- Purpose: Add user preferred currency column
-- ============================================================================

-- Step 1: Add new currency column to users_profile table
ALTER TABLE users_profile 
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GBP' NOT NULL;

-- Step 2: Add constraint for allowed currencies
ALTER TABLE users_profile
  ADD CONSTRAINT IF NOT EXISTS valid_currency 
  CHECK (currency IN ('USD', 'GBP', 'EUR', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'CHF', 'NZD'));

-- Step 3: Add comment for documentation
COMMENT ON COLUMN users_profile.currency IS 'User preferred currency for pricing (USD, GBP, EUR, INR, CAD, AUD, JPY, CNY, CHF, NZD)';
COMMENT ON CONSTRAINT valid_currency ON users_profile IS 'Ensures only supported currencies are stored';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check new column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
  AND column_name = 'currency';

-- Check constraint was added
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'valid_currency';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Currency column added successfully';
  RAISE NOTICE '✅ Default currency set to GBP (British Pound)';
  RAISE NOTICE '✅ NOT NULL constraint applied';
  RAISE NOTICE '✅ Currency validation constraint added (USD, GBP, EUR, INR, CAD, AUD, JPY, CNY, CHF, NZD)';
END $$;
