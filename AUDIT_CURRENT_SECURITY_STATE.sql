-- ============================================
-- COMPREHENSIVE SECURITY AUDIT - CHECK EXISTING STATE
-- Run this BEFORE applying any new fixes
-- This will show what's already in place
-- ============================================

-- =============================================
-- SECTION 1: CHECK ALL COLUMNS
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║               SECTION 1: DATABASE COLUMNS                      ║
╚════════════════════════════════════════════════════════════════╝
' AS section_header;

-- Check users_profile columns
SELECT 
  'users_profile' AS table_name,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name = 'token_expires_at' THEN '🆕 NEW SECURITY FEATURE'
    WHEN column_name = 'role' THEN '🔒 SECURITY: Role column'
    WHEN column_name IN ('subscription_plan', 'subscription_status') THEN '💳 PAYMENT: Subscription'
    ELSE '✅ Standard'
  END AS notes
FROM information_schema.columns 
WHERE table_name = 'users_profile'
ORDER BY ordinal_position;

-- Check bookings columns (especially token_expires_at)
SELECT 
  'bookings' AS table_name,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name = 'token_expires_at' THEN '🆕 NEW: Token expiration'
    WHEN column_name IN ('reschedule_token', 'cancel_token') THEN '🔒 SECURITY: Tokens'
    ELSE '✅ Standard'
  END AS notes
FROM information_schema.columns 
WHERE table_name = 'bookings'
  AND column_name IN ('id', 'reschedule_token', 'cancel_token', 'token_expires_at', 'created_at')
ORDER BY ordinal_position;

-- Check if superadmin_audit_log table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'superadmin_audit_log')
    THEN '✅ superadmin_audit_log table EXISTS'
    ELSE '❌ superadmin_audit_log table MISSING - needs to be created'
  END AS audit_table_status;

-- If audit table exists, show its structure
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'superadmin_audit_log') THEN
    RAISE NOTICE 'Audit log table structure:';
  END IF;
END $$;

SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'superadmin_audit_log'
ORDER BY ordinal_position;

-- =============================================
-- SECTION 2: CHECK ALL FUNCTIONS
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║               SECTION 2: DATABASE FUNCTIONS                    ║
╚════════════════════════════════════════════════════════════════╝
' AS section_header;

-- Check for security-related functions
SELECT 
  proname AS function_name,
  CASE 
    WHEN proname = 'check_booking_rate_limit' THEN '🆕 NEW: Rate limiting'
    WHEN proname = 'set_token_expiration' THEN '🆕 NEW: Token expiration'
    WHEN proname = 'log_superadmin_action' THEN '🆕 NEW: Audit logging'
    WHEN proname LIKE 'get_%' THEN '📊 ANALYTICS'
    ELSE '✅ Standard'
  END AS notes,
  pg_get_functiondef(pg_proc.oid) AS has_definition
FROM pg_proc
WHERE proname IN (
  'check_booking_rate_limit',
  'set_token_expiration', 
  'log_superadmin_action',
  'get_mrr',
  'get_user_statistics',
  'get_revenue_statistics'
)
ORDER BY proname;

-- Show all custom functions (not built-in)
SELECT 
  '📋 All Custom Functions:' AS info;

SELECT 
  proname AS function_name,
  'EXISTS' AS status
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND prokind = 'f'
ORDER BY proname;

-- =============================================
-- SECTION 3: CHECK ALL TRIGGERS
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║               SECTION 3: DATABASE TRIGGERS                     ║
╚════════════════════════════════════════════════════════════════╝
' AS section_header;

SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  CASE 
    WHEN tgname = 'booking_rate_limit' THEN '🆕 NEW: Rate limit enforcement'
    WHEN tgname = 'set_booking_token_expiration' THEN '🆕 NEW: Auto-set token expiry'
    WHEN tgname = 'audit_users_profile_changes' THEN '🆕 NEW: Audit logging'
    WHEN tgname LIKE '%updated_at%' THEN '⏰ Auto-update timestamp'
    ELSE '✅ Standard'
  END AS notes,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END AS status
FROM pg_trigger
WHERE tgname NOT LIKE 'RI_%'  -- Exclude foreign key triggers
  AND tgname NOT LIKE 'pg_%'   -- Exclude system triggers
ORDER BY tgrelid::regclass::text, tgname;

-- =============================================
-- SECTION 4: CHECK ALL RLS POLICIES
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║               SECTION 4: ROW LEVEL SECURITY POLICIES           ║
╚════════════════════════════════════════════════════════════════╝
' AS section_header;

-- Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED - SECURITY RISK!'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users_profile', 'bookings', 'event_types', 'superadmin_audit_log', 'payment_history', 'account_deletion_notices')
ORDER BY tablename;

-- Show ALL policies grouped by table
SELECT 
  tablename,
  policyname,
  cmd AS operation,
  CASE 
    WHEN policyname LIKE '%superadmin%' THEN '🔒 SUPERADMIN ACCESS'
    WHEN policyname LIKE '%prevent%elevation%' THEN '🆕 NEW: Role protection'
    WHEN policyname LIKE '%own%' THEN '👤 User owns data'
    ELSE '✅ Standard'
  END AS policy_type,
  permissive AS permissive_mode
FROM pg_policies
WHERE tablename IN ('users_profile', 'bookings', 'event_types', 'superadmin_audit_log', 'payment_history', 'account_deletion_notices')
ORDER BY tablename, cmd, policyname;

-- =============================================
-- SECTION 5: CHECK USERS_PROFILE POLICIES IN DETAIL
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║          SECTION 5: USERS_PROFILE POLICIES (DETAILED)          ║
╚════════════════════════════════════════════════════════════════╝
' AS section_header;

SELECT 
  policyname,
  cmd AS operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'YES (USING clause)'
    ELSE 'NO'
  END AS has_using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'YES (WITH CHECK clause)'
    ELSE 'NO'
  END AS has_with_check,
  CASE 
    WHEN policyname = 'prevent_role_self_elevation' THEN '🔒 CRITICAL: Prevents role changes'
    WHEN policyname LIKE '%superadmin%select%' THEN '👁️ Allows superadmin to view all'
    WHEN policyname LIKE '%superadmin%update%' THEN '✏️ Allows superadmin to update all'
    WHEN policyname LIKE '%own%' THEN '👤 User can access own data'
    ELSE 'Other policy'
  END AS description
FROM pg_policies
WHERE tablename = 'users_profile'
ORDER BY cmd, policyname;

-- Check for conflicting policies
SELECT 
  '⚠️ CHECKING FOR POTENTIAL POLICY CONFLICTS:' AS warning;

SELECT 
  tablename,
  cmd,
  COUNT(*) AS policy_count,
  string_agg(policyname, ', ') AS policy_names,
  CASE 
    WHEN COUNT(*) > 3 THEN '⚠️ Many policies - check for conflicts'
    WHEN COUNT(*) = 1 THEN '✅ Single policy'
    ELSE '✅ Multiple policies (normal for granular control)'
  END AS status
FROM pg_policies
WHERE tablename IN ('users_profile', 'bookings')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- =============================================
-- SECTION 6: CHECK SUPERADMIN SPECIFIC FEATURES
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║           SECTION 6: SUPERADMIN FEATURES CHECK                 ║
╚════════════════════════════════════════════════════════════════╝
' AS section_header;

-- Check if superadmin user exists and has correct data
SELECT 
  id,
  email,
  full_name,
  role,
  subscription_plan,
  subscription_status,
  CASE 
    WHEN role = 'superadmin' THEN '✅ IS SUPERADMIN'
    ELSE '❌ NOT SUPERADMIN'
  END AS admin_status,
  CASE 
    WHEN full_name IS NOT NULL AND full_name != '' THEN '✅ Has name'
    ELSE '❌ MISSING NAME - NEEDS FIX'
  END AS name_status,
  CASE 
    WHEN subscription_plan IS NOT NULL THEN '✅ Has plan'
    ELSE '⚠️ No plan set'
  END AS plan_status
FROM users_profile
WHERE role = 'superadmin' OR email LIKE '%bishesh%' OR email LIKE '%guragain%'
ORDER BY created_at;

-- Check for SELECT policies that allow superadmin to view all users
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'users_profile' 
      AND policyname LIKE '%superadmin%select%'
      AND cmd = 'SELECT'
    )
    THEN '✅ Superadmin SELECT policy EXISTS - can view all users'
    ELSE '❌ Superadmin SELECT policy MISSING - dashboard will be empty!'
  END AS superadmin_select_status;

-- Check for UPDATE policies that allow superadmin to update all users
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'users_profile' 
      AND policyname LIKE '%superadmin%update%'
      AND cmd = 'UPDATE'
    )
    THEN '✅ Superadmin UPDATE policy EXISTS - can manage users'
    ELSE '❌ Superadmin UPDATE policy MISSING - cannot update other users!'
  END AS superadmin_update_status;

-- =============================================
-- SECTION 7: SECURITY RECOMMENDATIONS
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║           SECTION 7: SECURITY RECOMMENDATIONS                  ║
╚════════════════════════════════════════════════════════════════╝
' AS section_header;

-- Build recommendations based on what's missing
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'token_expires_at')
    THEN '🔴 CRITICAL: Add token_expires_at column to bookings table'
    
    WHEN NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'booking_rate_limit')
    THEN '🔴 CRITICAL: Add booking rate limiting trigger'
    
    WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users_profile' AND policyname = 'prevent_role_self_elevation')
    THEN '🔴 CRITICAL: Add role self-elevation prevention policy'
    
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'superadmin_audit_log')
    THEN '🟡 HIGH: Create superadmin audit log table'
    
    WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users_profile' AND policyname LIKE '%superadmin%select%')
    THEN '🟡 HIGH: Add superadmin SELECT policy (dashboard won''t work without it)'
    
    WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users_profile' AND policyname LIKE '%superadmin%update%')
    THEN '🟡 HIGH: Add superadmin UPDATE policy (can''t manage users without it)'
    
    ELSE '✅ All critical features appear to be in place'
  END AS recommendation
FROM (SELECT 1) AS dummy
LIMIT 10;

-- =============================================
-- SECTION 8: SUMMARY
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                    AUDIT COMPLETE                              ║
╠════════════════════════════════════════════════════════════════╣
║  Review all sections above to determine what needs to be       ║
║  applied. Based on the findings, you will receive a custom     ║
║  SQL script with ONLY the missing fixes.                       ║
╚════════════════════════════════════════════════════════════════╝
' AS summary;

-- Final checklist
SELECT 
  'SECURITY AUDIT CHECKLIST' AS checklist_title;

SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'token_expires_at')
    THEN '✅' ELSE '❌' END AS status,
  'Token expiration column in bookings' AS feature
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'booking_rate_limit')
    THEN '✅' ELSE '❌' END,
  'Booking rate limiting trigger'
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_booking_token_expiration')
    THEN '✅' ELSE '❌' END,
  'Token expiration auto-set trigger'
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users_profile' AND policyname = 'prevent_role_self_elevation')
    THEN '✅' ELSE '❌' END,
  'Role self-elevation prevention policy'
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'superadmin_audit_log')
    THEN '✅' ELSE '❌' END,
  'Superadmin audit log table'
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_users_profile_changes')
    THEN '✅' ELSE '❌' END,
  'Audit log trigger for users_profile'
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users_profile' AND policyname LIKE '%superadmin%select%')
    THEN '✅' ELSE '❌' END,
  'Superadmin SELECT ALL policy (critical for dashboard)'
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users_profile' AND policyname LIKE '%superadmin%update%')
    THEN '✅' ELSE '❌' END,
  'Superadmin UPDATE ALL policy (critical for user management)'
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM users_profile WHERE role = 'superadmin' AND full_name IS NOT NULL AND full_name != '')
    THEN '✅' ELSE '❌' END,
  'Superadmin user has name and profile data';
