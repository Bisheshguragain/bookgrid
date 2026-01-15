-- ============================================================================
-- Migration: Fix Nullable Boolean Fields
-- ============================================================================
-- Date: January 15, 2026
-- Purpose: Make all critical boolean fields NOT NULL
-- ============================================================================

-- Fix event_types.is_active
UPDATE event_types 
SET is_active = TRUE 
WHERE is_active IS NULL;

ALTER TABLE event_types 
ALTER COLUMN is_active SET NOT NULL;

COMMENT ON COLUMN event_types.is_active 
  IS 'Whether this event type is active and bookable (NOT NULL)';

-- Fix subscription_plans.is_active (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'subscription_plans'
  ) THEN
    UPDATE subscription_plans 
    SET is_active = TRUE 
    WHERE is_active IS NULL;

    ALTER TABLE subscription_plans 
    ALTER COLUMN is_active SET NOT NULL;

    COMMENT ON COLUMN subscription_plans.is_active 
      IS 'Whether this subscription plan is active and available (NOT NULL)';
  END IF;
END $$;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check event_types.is_active
SELECT 
  'event_types.is_active' as field,
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'event_types' 
  AND column_name = 'is_active';

-- Check subscription_plans.is_active (if exists)
SELECT 
  'subscription_plans.is_active' as field,
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscription_plans' 
  AND column_name = 'is_active';

-- Check users_profile.auto_reminders_enabled
SELECT 
  'users_profile.auto_reminders_enabled' as field,
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
  AND column_name = 'auto_reminders_enabled';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ event_types.is_active set to NOT NULL';
  RAISE NOTICE '✅ subscription_plans.is_active set to NOT NULL (if table exists)';
  RAISE NOTICE '✅ All critical boolean fields are now NOT NULL';
  RAISE NOTICE '⚠️  Remember to update TypeScript types in src/lib/database.types.ts';
END $$;
