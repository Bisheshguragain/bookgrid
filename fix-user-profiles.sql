-- Fix for Missing User Profile
-- This script creates missing profiles and sets up automatic profile creation

-- ============================================================================
-- PART 1: Create Trigger Function to Auto-Create Profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name, username, time_zone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1)),
    'America/New_York'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 2: Create Trigger on auth.users
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 3: Backfill Missing Profiles for Existing Users
-- ============================================================================

-- This creates profiles for any users that don't have one yet
INSERT INTO public.users_profile (id, email, full_name, username, time_zone)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  LOWER(SPLIT_PART(au.email, '@', 1)),
  'America/New_York'
FROM auth.users au
LEFT JOIN public.users_profile up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 4: Verify Profiles Were Created
-- ============================================================================

-- Show all users and their profiles
SELECT 
  au.id,
  au.email,
  CASE 
    WHEN up.id IS NOT NULL THEN '✓ Has Profile'
    ELSE '✗ Missing Profile'
  END as profile_status,
  up.full_name,
  up.username
FROM auth.users au
LEFT JOIN public.users_profile up ON au.id = up.id
ORDER BY au.created_at DESC;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ User profile fix completed!';
  RAISE NOTICE '';
  RAISE NOTICE 'What was done:';
  RAISE NOTICE '1. Created trigger to auto-create profiles for new users';
  RAISE NOTICE '2. Backfilled missing profiles for existing users';
  RAISE NOTICE '3. All users should now have profiles';
  RAISE NOTICE '';
  RAISE NOTICE 'Check the output above to verify all users have profiles';
  RAISE NOTICE '';
  RAISE NOTICE 'Now try creating an event type again!';
END $$;
