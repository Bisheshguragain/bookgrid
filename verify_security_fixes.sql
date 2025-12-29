-- ============================================
-- VERIFY ALL SECURITY FIXES WERE APPLIED
-- Run this to check the status of all fixes
-- ============================================

-- Check 1: Token expiration column
SELECT 
  'Token Expiration Column' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name = 'token_expires_at'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status;

-- Check 2: Rate limiting function
SELECT 
  'Booking Rate Limit Function' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'check_booking_rate_limit'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status;

-- Check 3: Rate limiting trigger
SELECT 
  'Booking Rate Limit Trigger' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'booking_rate_limit'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status;

-- Check 4: Audit log table
SELECT 
  'Superadmin Audit Log Table' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'superadmin_audit_log'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status;

-- Check 5: Audit trigger
SELECT 
  'Audit Log Trigger' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'audit_users_profile_changes'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status;

-- Check 6: Token expiration trigger
SELECT 
  'Token Expiration Trigger' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'set_booking_token_expiration'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status;

-- Check 7: Role elevation prevention policy
SELECT 
  'Role Elevation Prevention Policy' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'users_profile' 
      AND policyname = 'prevent_role_self_elevation'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status;

-- ============================================
-- SUMMARY OF ALL POLICIES
-- ============================================

SELECT 
  '📋 SUMMARY: All RLS Policies' AS info;

SELECT 
  tablename,
  policyname,
  cmd AS operation,
  CASE 
    WHEN qual IS NOT NULL AND with_check IS NOT NULL THEN 'USING + CHECK'
    WHEN qual IS NOT NULL THEN 'USING only'
    WHEN with_check IS NOT NULL THEN 'CHECK only'
    ELSE 'No restrictions'
  END AS policy_type
FROM pg_policies 
WHERE tablename IN (
  'users_profile', 
  'bookings', 
  'superadmin_audit_log',
  'event_types',
  'availability_rules'
)
ORDER BY tablename, cmd, policyname;

-- ============================================
-- CHECK FOR SUPERADMIN POLICIES
-- ============================================

SELECT 
  '🔍 Checking for SuperAdmin policies...' AS info;

-- This should show the superadmin select all policy if it exists
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%superadmin%' THEN '✅ SuperAdmin policy exists'
    ELSE 'Regular policy'
  END AS policy_category
FROM pg_policies 
WHERE tablename = 'users_profile'
ORDER BY policyname;

-- ============================================
-- TEST RATE LIMITING (Optional - will fail after 5 attempts)
-- ============================================

-- Uncomment to test rate limiting:
/*
DO $$ 
DECLARE
  test_email TEXT := 'test@ratelimit.com';
  i INTEGER;
BEGIN
  RAISE NOTICE 'Testing rate limit with 6 booking attempts...';
  
  FOR i IN 1..6 LOOP
    BEGIN
      INSERT INTO bookings (
        user_id, 
        event_type_id, 
        guest_name, 
        guest_email,
        start_time,
        end_time,
        status
      ) VALUES (
        auth.uid(),
        (SELECT id FROM event_types LIMIT 1),
        'Test User',
        test_email,
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '1 day' + INTERVAL '30 minutes',
        'confirmed'
      );
      
      RAISE NOTICE 'Attempt %: ✅ Success', i;
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE 'Attempt %: ❌ Blocked - %', i, SQLERRM;
    END;
  END LOOP;
  
  -- Cleanup
  DELETE FROM bookings WHERE guest_email = test_email;
END $$;
*/

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

SELECT 
  '
  ╔════════════════════════════════════════════╗
  ║  ✅ VERIFICATION COMPLETE                  ║
  ║                                            ║
  ║  Review the checks above to ensure all    ║
  ║  security fixes are properly in place.    ║
  ║                                            ║
  ║  All checks should show ✅ EXISTS          ║
  ╚════════════════════════════════════════════╝
  ' AS completion_message;
