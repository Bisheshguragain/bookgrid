-- ============================================================================
-- Migration: Set Default Timezone to London
-- ============================================================================
-- Date: January 6, 2026
-- Purpose: Change default timezone from America/New_York to Europe/London
-- for all new user signups
-- ============================================================================

-- Step 1: Update the default timezone in the users_profile table schema
ALTER TABLE users_profile 
  ALTER COLUMN time_zone SET DEFAULT 'Europe/London';

-- Step 2: Update the handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name, username, time_zone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1)),
    'Europe/London'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: (Optional) Update existing users who still have America/New_York
-- Uncomment the following lines if you want to update ALL existing users
-- to London timezone (be careful - only run if you're sure):

-- UPDATE users_profile 
-- SET time_zone = 'Europe/London' 
-- WHERE time_zone = 'America/New_York';

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Check the current default timezone setting
SELECT 
  column_name, 
  column_default, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
  AND column_name = 'time_zone';

-- Show all users and their timezones
SELECT 
  email,
  full_name,
  time_zone,
  created_at
FROM users_profile
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Default timezone successfully changed to Europe/London';
  RAISE NOTICE '✅ All new user signups will use London timezone by default';
  RAISE NOTICE 'ℹ️  Existing users timezone settings remain unchanged';
  RAISE NOTICE 'ℹ️  Users can change their timezone in Settings at any time';
END $$;
