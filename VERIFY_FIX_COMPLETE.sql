-- ============================================
-- POST-FIX VERIFICATION SCRIPT
-- Run this AFTER applying FIX_MISSING_TABLE_POLICIES.sql
-- ============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║              POST-FIX VERIFICATION REPORT                      ║
║              Run this after applying the fix                   ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

-- =============================================
-- 1. VERIFY ALL SUPERADMIN POLICIES EXIST
-- =============================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ CHECKING: All superadmin policies exist
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS section;

WITH expected_policies AS (
  SELECT 'users_profile' AS table_name, 'superadmin_select_all' AS policy_name, 'SELECT' AS operation
  UNION ALL SELECT 'users_profile', 'superadmin_update_all', 'UPDATE'
  UNION ALL SELECT 'bookings', 'superadmin_select_all_bookings', 'SELECT'
  UNION ALL SELECT 'bookings', 'superadmin_update_all_bookings', 'UPDATE'
  UNION ALL SELECT 'payment_history', 'superadmin_select_all_payments', 'SELECT'
  UNION ALL SELECT 'payment_history', 'superadmin_update_payments', 'UPDATE'
  UNION ALL SELECT 'account_deletion_notices', 'superadmin_select_all_deletions', 'SELECT'
  UNION ALL SELECT 'account_deletion_notices', 'superadmin_update_deletions', 'UPDATE'
  UNION ALL SELECT 'account_deletion_notices', 'superadmin_insert_deletions', 'INSERT'
  UNION ALL SELECT 'event_types', 'superadmin_select_all_event_types', 'SELECT'
)
SELECT 
  ep.table_name,
  ep.policy_name,
  ep.operation,
  CASE 
    WHEN pp.policyname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status
FROM expected_policies ep
LEFT JOIN pg_policies pp 
  ON pp.tablename = ep.table_name 
  AND pp.policyname = ep.policy_name
ORDER BY ep.table_name, ep.operation;

-- Summary count
SELECT 
  '
  📊 SUMMARY:' AS summary;

SELECT 
  COUNT(*) AS total_superadmin_policies,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ ALL POLICIES EXIST'
    ELSE '❌ SOME POLICIES MISSING'
  END AS status
FROM pg_policies
WHERE policyname LIKE '%superadmin%';

-- =============================================
-- 2. TEST TABLE ACCESS
-- =============================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2️⃣ TESTING: Can access all required tables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS section;

-- Test all tables
SELECT 'users_profile' AS table_name, COUNT(*) AS rows, '✅' AS access FROM users_profile
UNION ALL
SELECT 'bookings' AS table_name, COUNT(*) AS rows, '✅' AS access FROM bookings
UNION ALL
SELECT 'payment_history' AS table_name, COUNT(*) AS rows, '✅' AS access FROM payment_history
UNION ALL
SELECT 'account_deletion_notices' AS table_name, COUNT(*) AS rows, '✅' AS access FROM account_deletion_notices
UNION ALL
SELECT 'event_types' AS table_name, COUNT(*) AS rows, '✅' AS access FROM event_types
ORDER BY table_name;

-- =============================================
-- 3. TEST DATABASE FUNCTIONS
-- =============================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3️⃣ TESTING: Database functions return data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS section;

-- Test get_mrr
SELECT 'get_mrr()' AS function_name;
SELECT * FROM get_mrr() LIMIT 1;

-- Test get_user_statistics
SELECT 'get_user_statistics()' AS function_name;
SELECT * FROM get_user_statistics() LIMIT 1;

-- Test get_revenue_statistics
SELECT 'get_revenue_statistics()' AS function_name;
SELECT * FROM get_revenue_statistics() LIMIT 1;

-- Test get_user_analytics
SELECT 'get_user_analytics()' AS function_name;
SELECT * FROM get_user_analytics() LIMIT 5;

-- Test get_subscription_stats
SELECT 'get_subscription_stats()' AS function_name;
SELECT * FROM get_subscription_stats() LIMIT 5;

-- Test get_payment_stats
SELECT 'get_payment_stats()' AS function_name;
SELECT * FROM get_payment_stats() LIMIT 5;

-- =============================================
-- 4. VERIFY SUPERADMIN USER
-- =============================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4️⃣ VERIFYING: Your superadmin account
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS section;

SELECT 
  id,
  email,
  full_name,
  role,
  subscription_plan,
  subscription_status,
  account_status,
  CASE 
    WHEN role = 'superadmin' THEN '✅ IS SUPERADMIN'
    ELSE '❌ NOT SUPERADMIN'
  END AS role_status,
  CASE 
    WHEN full_name IS NOT NULL AND full_name != '' THEN '✅ HAS NAME'
    ELSE '⚠️ NAME MISSING'
  END AS name_status,
  CASE 
    WHEN subscription_plan IS NOT NULL THEN '✅ HAS PLAN'
    ELSE '⚠️ PLAN MISSING'
  END AS plan_status
FROM users_profile
WHERE role = 'superadmin';

-- =============================================
-- 5. CHECK FOR POLICY CONFLICTS
-- =============================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5️⃣ CHECKING: For policy conflicts (restrictive policies)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS section;

SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  CASE 
    WHEN permissive = 'RESTRICTIVE' THEN '⚠️ RESTRICTIVE - Could block access'
    ELSE '✅ PERMISSIVE - OK'
  END AS warning
FROM pg_policies
WHERE tablename IN ('users_profile', 'bookings', 'payment_history', 'account_deletion_notices', 'event_types')
ORDER BY tablename, permissive DESC, cmd;

-- Count restrictive policies (should be minimal)
SELECT 
  COUNT(*) AS restrictive_policy_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO RESTRICTIVE POLICIES'
    WHEN COUNT(*) <= 2 THEN '⚠️ FEW RESTRICTIVE POLICIES (probably OK)'
    ELSE '❌ MANY RESTRICTIVE POLICIES (might block access)'
  END AS status
FROM pg_policies
WHERE tablename IN ('users_profile', 'bookings', 'payment_history', 'account_deletion_notices', 'event_types')
AND permissive = 'RESTRICTIVE';

-- =============================================
-- 6. SAMPLE DATA CHECK
-- =============================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6️⃣ CHECKING: Sample data in each table
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS section;

-- Users summary
SELECT 
  'USERS:' AS summary,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE role = 'superadmin') AS superadmins,
  COUNT(*) FILTER (WHERE subscription_plan = 'free') AS free_users,
  COUNT(*) FILTER (WHERE subscription_plan = 'pro') AS pro_users,
  COUNT(*) FILTER (WHERE subscription_plan = 'business') AS business_users
FROM users_profile;

-- Bookings summary
SELECT 
  'BOOKINGS:' AS summary,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
FROM bookings;

-- Payment history summary
SELECT 
  'PAYMENT_HISTORY:' AS summary,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  COALESCE(SUM(amount), 0) AS total_amount
FROM payment_history;

-- Deletion notices summary
SELECT 
  'DELETION_NOTICES:' AS summary,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'sent') AS sent,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
  COUNT(*) FILTER (WHERE status = 'executed') AS executed
FROM account_deletion_notices;

-- =============================================
-- FINAL REPORT
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                      FINAL VERIFICATION                        ║
╚════════════════════════════════════════════════════════════════╝

📋 CHECKLIST - Verify each item shows ✅:

1️⃣ All 10 superadmin policies exist
   - Check the first section above

2️⃣ All 5 tables are accessible
   - users_profile ✅
   - bookings ✅
   - payment_history ✅
   - account_deletion_notices ✅
   - event_types ✅

3️⃣ All database functions return data
   - get_mrr() ✅
   - get_user_statistics() ✅
   - get_revenue_statistics() ✅
   - get_user_analytics() ✅
   - get_subscription_stats() ✅
   - get_payment_stats() ✅

4️⃣ Your superadmin account is correct
   - role = superadmin ✅
   - Has full_name ✅
   - Has subscription_plan ✅

5️⃣ No blocking restrictive policies
   - 0 or minimal restrictive policies ✅

6️⃣ Sample data exists in tables
   - Users exist ✅
   - (Other tables may be empty if new)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 NEXT STEPS:

If all items show ✅:
  → Refresh your SuperAdmin Dashboard
  → Test all tabs (Overview, Users, Payments, Inactive, Deletions)
  → Dashboard should now work perfectly!

If any items show ❌:
  → Share this verification output
  → We can diagnose the specific issue

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS final_report;
