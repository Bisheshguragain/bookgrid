-- ====================================================================
-- SUPERADMIN DASHBOARD DEBUG QUERIES
-- Run these in Supabase SQL Editor to diagnose the issue
-- ====================================================================

-- First, check if you're logged in as superadmin
SELECT 
    id,
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status
FROM users_profile
WHERE id = auth.uid();

-- Check if the superadmin RLS policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE policyname ILIKE '%superadmin%'
ORDER BY tablename, policyname;

-- Test the MRR function
SELECT * FROM get_mrr();

-- Test the user statistics function
SELECT * FROM get_user_statistics();

-- Test the revenue statistics function
SELECT * FROM get_revenue_statistics();

-- Test direct query to users_profile (should work if superadmin policies are in place)
SELECT 
    id,
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status,
    account_status,
    created_at
FROM users_profile
LIMIT 10;

-- Test payment_history table
SELECT COUNT(*) as payment_count FROM payment_history;
SELECT * FROM payment_history LIMIT 5;

-- Test inactive users function
SELECT * FROM get_inactive_users(90);

-- Test account_deletion_notices table
SELECT COUNT(*) as deletion_notices_count FROM account_deletion_notices;
SELECT * FROM account_deletion_notices LIMIT 5;

-- Check if all required functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_mrr',
    'get_user_statistics',
    'get_revenue_statistics',
    'get_inactive_users'
)
ORDER BY routine_name;

-- Check if all required tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'users_profile',
    'payment_history',
    'account_deletion_notices'
)
ORDER BY table_name;
