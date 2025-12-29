-- EMERGENCY AUDIT: Diagnose why superadmin is not showing up
-- Run this to check the current state

-- 1. Check if the superadmin user exists and their profile
SELECT 
    id,
    email,
    role,
    is_superadmin,
    subscription_tier,
    subscription_status,
    created_at
FROM users_profile
WHERE email = 'bishshguragain@gmail.com';

-- 2. Check ALL RLS policies on users_profile
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
WHERE tablename = 'users_profile'
ORDER BY policyname;

-- 3. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'users_profile';

-- 4. Test if current user can see their own profile
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email,
    auth.role() as current_user_role;

-- 5. Check if the superadmin can SELECT their own profile
SELECT COUNT(*) as can_see_own_profile
FROM users_profile
WHERE id = auth.uid();

-- 6. Check payment_history policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'payment_history'
ORDER BY policyname;

-- 7. Check account_deletion_notices policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'account_deletion_notices'
ORDER BY policyname;

-- 8. Verify all required functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN (
        'get_user_analytics',
        'get_payment_analytics',
        'get_inactive_users',
        'get_deletion_notices',
        'soft_delete_user',
        'cancel_user_subscription',
        'update_user_role'
    )
ORDER BY routine_name;

-- 9. Check if there are any conflicting policies
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies
WHERE tablename IN ('users_profile', 'payment_history', 'account_deletion_notices')
GROUP BY tablename;

-- 10. Test superadmin access explicitly
DO $$
DECLARE
    test_result TEXT;
BEGIN
    -- Check if the current user is a superadmin
    IF EXISTS (
        SELECT 1 FROM users_profile 
        WHERE id = auth.uid() AND is_superadmin = true
    ) THEN
        test_result := 'Current user IS a superadmin';
    ELSE
        test_result := 'Current user IS NOT a superadmin';
    END IF;
    
    RAISE NOTICE '%', test_result;
END $$;
