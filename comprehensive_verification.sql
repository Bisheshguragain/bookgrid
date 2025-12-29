-- Comprehensive SuperAdmin Dashboard Verification v2
-- Run this in Supabase SQL Editor to verify everything is set up correctly

-- =====================================================
-- 1. CHECK ALL REQUIRED TABLES EXIST
-- =====================================================

SELECT 
  'Table Existence Check' as check_type,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'Enabled' 
    ELSE 'Disabled' 
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users_profile',
    'payment_history',
    'account_deletion_notices',
    'user_activity_log'
  )
ORDER BY tablename;

-- =====================================================
-- 2. CHECK ALL REQUIRED FUNCTIONS EXIST
-- =====================================================

SELECT 
  'Function Existence Check' as check_type,
  routine_name as function_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_mrr',
    'get_user_statistics',
    'get_revenue_statistics',
    'get_inactive_users',
    'get_total_bookings',
    'get_subscription_breakdown',
    'send_deletion_notice',
    'cancel_deletion_notice',
    'process_inactive_accounts',
    'update_user_last_active'
  )
ORDER BY routine_name;

-- =====================================================
-- 3. VERIFY USERS_PROFILE COLUMNS
-- =====================================================

SELECT 
  'Users Profile Columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users_profile'
  AND column_name IN (
    'id',
    'user_id',
    'email',
    'full_name',
    'username',
    'subscription_plan',
    'subscription_status',
    'role',
    'account_status',
    'last_active_at',
    'deletion_notice_sent_at',
    'scheduled_deletion_at',
    'bookings_this_month',
    'created_at'
  )
ORDER BY column_name;

-- =====================================================
-- 4. TEST DATABASE FUNCTIONS
-- =====================================================

-- Test get_mrr function
SELECT 
  'get_mrr() Test' as test_name,
  total_mrr,
  pro_mrr,
  business_mrr,
  currency
FROM get_mrr();

-- Test get_user_statistics function
SELECT 
  'get_user_statistics() Test' as test_name,
  total_users,
  active_users,
  inactive_users,
  free_users,
  pro_users,
  business_users
FROM get_user_statistics();

-- Test get_revenue_statistics function
SELECT 
  'get_revenue_statistics() Test' as test_name,
  total_revenue,
  revenue_this_month,
  revenue_last_month,
  currency
FROM get_revenue_statistics();

-- Test get_inactive_users function (90+ days)
SELECT 
  'get_inactive_users() Test' as test_name,
  COUNT(*) as inactive_user_count
FROM get_inactive_users(90);

-- Test get_total_bookings function
SELECT 
  'get_total_bookings() Test' as test_name,
  total_bookings,
  bookings_this_month,
  bookings_last_month
FROM get_total_bookings();

-- Test get_subscription_breakdown function
SELECT 
  'get_subscription_breakdown() Test' as test_name,
  *
FROM get_subscription_breakdown();

-- =====================================================
-- 5. CHECK RLS POLICIES
-- =====================================================

SELECT 
  'RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'users_profile',
    'payment_history',
    'account_deletion_notices',
    'user_activity_log'
  )
ORDER BY tablename, policyname;

-- =====================================================
-- 6. CHECK DATA COUNTS
-- =====================================================

SELECT 
  'users_profile' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN role = 'superadmin' THEN 1 END) as superadmin_count,
  COUNT(CASE WHEN subscription_plan = 'free' THEN 1 END) as free_users,
  COUNT(CASE WHEN subscription_plan = 'pro' THEN 1 END) as pro_users,
  COUNT(CASE WHEN subscription_plan = 'business' THEN 1 END) as business_users
FROM users_profile

UNION ALL

SELECT 
  'payment_history' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN payment_status = 'succeeded' THEN 1 END) as successful_payments,
  SUM(CASE WHEN payment_status = 'succeeded' THEN amount ELSE 0 END) as total_revenue,
  NULL::BIGINT,
  NULL::BIGINT
FROM payment_history

UNION ALL

SELECT 
  'account_deletion_notices' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_notices,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_notices,
  NULL::BIGINT,
  NULL::BIGINT
FROM account_deletion_notices

UNION ALL

SELECT 
  'user_activity_log' as table_name,
  COUNT(*) as total_records,
  NULL::BIGINT,
  NULL::BIGINT,
  NULL::BIGINT,
  NULL::BIGINT
FROM user_activity_log;

-- =====================================================
-- 7. CHECK CURRENT SUPERADMIN USER
-- =====================================================

SELECT 
  'Current Superadmin User' as check_type,
  up.email,
  up.full_name,
  up.role,
  up.subscription_plan,
  up.account_status,
  up.created_at
FROM users_profile up
WHERE up.role = 'superadmin'
ORDER BY up.created_at DESC;

-- =====================================================
-- 8. VERIFY INDEXES
-- =====================================================

SELECT 
  'Index Check' as check_type,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'users_profile',
    'payment_history',
    'account_deletion_notices',
    'user_activity_log'
  )
ORDER BY tablename, indexname;

-- =====================================================
-- 9. SUMMARY REPORT
-- =====================================================

SELECT 
  '=== SUPERADMIN DASHBOARD VERIFICATION SUMMARY ===' as summary;

SELECT 
  'Tables' as category,
  COUNT(*) as count,
  'Required: 4 (users_profile, payment_history, account_deletion_notices, user_activity_log)' as expected
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users_profile',
    'payment_history',
    'account_deletion_notices',
    'user_activity_log'
  )

UNION ALL

SELECT 
  'Functions' as category,
  COUNT(*) as count,
  'Required: 10 (get_mrr, get_user_statistics, etc.)' as expected
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_mrr',
    'get_user_statistics',
    'get_revenue_statistics',
    'get_inactive_users',
    'get_total_bookings',
    'get_subscription_breakdown',
    'send_deletion_notice',
    'cancel_deletion_notice',
    'process_inactive_accounts',
    'update_user_last_active'
  )

UNION ALL

SELECT 
  'Superadmin Users' as category,
  COUNT(*) as count,
  'At least 1 required' as expected
FROM users_profile
WHERE role = 'superadmin'

UNION ALL

SELECT 
  'Payment Records' as category,
  COUNT(*) as count,
  'Optional (for demo/testing)' as expected
FROM payment_history

UNION ALL

SELECT 
  'Deletion Notices' as category,
  COUNT(*) as count,
  'Optional (appears when users are inactive)' as expected
FROM account_deletion_notices;

-- =====================================================
-- 10. FINAL STATUS
-- =====================================================

SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users_profile', 'payment_history', 'account_deletion_notices', 'user_activity_log')
    ) = 4 
    AND (
      SELECT COUNT(*) FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN (
        'get_mrr', 'get_user_statistics', 'get_revenue_statistics', 
        'get_inactive_users', 'get_total_bookings', 'get_subscription_breakdown'
      )
    ) >= 6
    AND (
      SELECT COUNT(*) FROM users_profile WHERE role = 'superadmin'
    ) >= 1
    THEN '✅ SUPERADMIN DASHBOARD READY'
    ELSE '❌ SETUP INCOMPLETE - Check missing components above'
  END as final_status;
