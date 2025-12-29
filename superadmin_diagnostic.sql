-- SuperAdmin Diagnostic Query
-- Run this in your Supabase SQL Editor to verify everything is set up correctly

-- 1. Check if bishesh.guragain@gmail.com has superadmin role
SELECT 
  id,
  email,
  full_name,
  role,
  account_status,
  subscription_plan,
  subscription_status,
  last_active_at,
  created_at
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';

-- Expected result:
-- role: superadmin
-- account_status: active
-- subscription_plan: business
-- subscription_status: active

-- 2. Check all columns exist in users_profile table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users_profile'
ORDER BY ordinal_position;

-- Expected columns should include:
-- role (text or user_role enum)
-- account_status (text or account_status enum)
-- last_active_at (timestamp with time zone)
-- stripe_customer_id (text)
-- stripe_subscription_id (text)
-- subscription_current_period_end (timestamp with time zone)

-- 3. Check if superadmin tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'payment_history',
    'user_activity_log',
    'account_deletion_notices'
  )
ORDER BY table_name;

-- Expected: All 3 tables should exist

-- 4. Check if superadmin functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_mrr_stats',
    'get_user_statistics',
    'get_revenue_statistics'
  )
ORDER BY routine_name;

-- Expected: All 3 functions should exist

-- 5. List all superadmins in the system
SELECT 
  id,
  email,
  full_name,
  role,
  account_status,
  subscription_plan,
  created_at
FROM users_profile
WHERE role = 'superadmin'
ORDER BY created_at;

-- 6. Check RLS policies for superadmin access
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN (
  'payment_history',
  'user_activity_log',
  'account_deletion_notices'
)
ORDER BY tablename, policyname;

-- Expected: Policies should allow access for superadmin role
