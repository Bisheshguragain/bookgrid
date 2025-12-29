-- ============================================
-- DIAGNOSE DASHBOARD ISSUE
-- Check all policies and potential conflicts
-- ============================================

-- =============================================
-- 1. CHECK ALL USERS_PROFILE POLICIES
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║           ALL users_profile POLICIES (CHECK FOR CONFLICTS)     ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'users_profile'
ORDER BY cmd, policyname;

-- =============================================
-- 2. CHECK FOR RESTRICTIVE POLICIES
-- These could override permissive policies
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║    RESTRICTIVE POLICIES (Could block superadmin access)        ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'users_profile'
AND permissive = 'RESTRICTIVE';

-- =============================================
-- 3. CHECK SUBSCRIPTION/PAYMENT TABLES
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║              CHECK SUBSCRIPTION-RELATED TABLES                 ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

-- Check if payment_history table exists
SELECT 
  'payment_history table:' AS check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_history')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status;

-- Check if account_deletion_notices table exists
SELECT 
  'account_deletion_notices table:' AS check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_deletion_notices')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status;

-- =============================================
-- 4. CHECK PAYMENT_HISTORY POLICIES
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║              PAYMENT_HISTORY POLICIES                          ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

SELECT 
  policyname,
  cmd AS operation,
  qual AS using_clause
FROM pg_policies
WHERE tablename = 'payment_history'
ORDER BY cmd, policyname;

-- =============================================
-- 5. CHECK ACCOUNT_DELETION_NOTICES POLICIES
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║          ACCOUNT_DELETION_NOTICES POLICIES                     ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

SELECT 
  policyname,
  cmd AS operation,
  qual AS using_clause
FROM pg_policies
WHERE tablename = 'account_deletion_notices'
ORDER BY cmd, policyname;

-- =============================================
-- 6. TEST ACTUAL DATA ACCESS
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                   TEST ACTUAL DATA ACCESS                      ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

-- Test 1: Can we see users_profile?
SELECT 
  'users_profile access:' AS test,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ CAN READ'
    ELSE '❌ CANNOT READ'
  END AS status
FROM users_profile;

-- Test 2: Can we see payment_history?
SELECT 
  'payment_history access:' AS test,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ CAN READ'
    ELSE '❌ CANNOT READ'
  END AS status
FROM payment_history;

-- Test 3: Can we see account_deletion_notices?
SELECT 
  'account_deletion_notices access:' AS test,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ CAN READ'
    ELSE '❌ CANNOT READ'
  END AS status
FROM account_deletion_notices;

-- =============================================
-- 7. CHECK SUBSCRIPTION DATA IN USERS_PROFILE
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║            SUBSCRIPTION DATA IN USERS_PROFILE                  ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

SELECT 
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE subscription_plan IS NOT NULL) AS users_with_plan,
  COUNT(*) FILTER (WHERE subscription_status IS NOT NULL) AS users_with_status,
  COUNT(*) FILTER (WHERE subscription_plan = 'free') AS free_users,
  COUNT(*) FILTER (WHERE subscription_plan = 'pro') AS pro_users,
  COUNT(*) FILTER (WHERE subscription_plan = 'business') AS business_users,
  COUNT(*) FILTER (WHERE subscription_status = 'active') AS active_subscriptions,
  COUNT(*) FILTER (WHERE subscription_status = 'cancelled') AS cancelled_subscriptions
FROM users_profile;

-- =============================================
-- 8. CHECK FUNCTIONS EXIST
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║              CHECK REQUIRED FUNCTIONS EXIST                    ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

SELECT 
  routine_name,
  routine_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_user_analytics',
  'get_subscription_stats',
  'get_payment_stats',
  'get_deletion_notices'
)
ORDER BY routine_name;

-- =============================================
-- 9. TEST ANALYTICS FUNCTIONS
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║              TEST ANALYTICS FUNCTIONS                          ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

-- Test get_user_analytics
SELECT 'Testing get_user_analytics()...' AS test;

SELECT * FROM get_user_analytics()
LIMIT 5;

-- Test get_subscription_stats
SELECT 'Testing get_subscription_stats()...' AS test;

SELECT * FROM get_subscription_stats()
LIMIT 5;

-- Test get_payment_stats
SELECT 'Testing get_payment_stats()...' AS test;

SELECT * FROM get_payment_stats()
LIMIT 5;

-- =============================================
-- 10. SUMMARY
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                         SUMMARY                                ║
╚════════════════════════════════════════════════════════════════╝

This diagnostic will show:
1. All policies on users_profile (check for conflicts)
2. Any restrictive policies (these override permissive ones)
3. If subscription tables exist and have policies
4. If you can actually read the data
5. If subscription data is populated
6. If required functions exist
7. If functions return data

Look for:
❌ Missing superadmin SELECT policies on payment_history
❌ Missing superadmin SELECT policies on account_deletion_notices
❌ Restrictive policies blocking access
❌ Missing functions
❌ Empty subscription data

' AS instructions;
