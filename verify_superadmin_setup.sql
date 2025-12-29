-- ============================================
-- VERIFY SUPERADMIN SETUP SCRIPT
-- Run this to confirm all fixes are working
-- ============================================

-- 1. Check your user profile and superadmin status
SELECT 
    id,
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status,
    created_at
FROM users_profile 
WHERE email = 'bishesh.guragain@gmail.com';

-- 2. Check RLS policies on users_profile table
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

-- 3. Test if you can see all users (as superadmin)
-- This should return all users in the system
SELECT 
    id,
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status,
    created_at
FROM users_profile 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Count users by role
SELECT 
    role,
    COUNT(*) as user_count
FROM users_profile 
GROUP BY role
ORDER BY user_count DESC;

-- 5. Count users by subscription plan
SELECT 
    subscription_plan,
    COUNT(*) as user_count
FROM users_profile 
GROUP BY subscription_plan
ORDER BY user_count DESC;

-- 6. Check if superadmin_settings table exists and has data
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'superadmin_settings'
) as table_exists;

SELECT * FROM superadmin_settings LIMIT 5;

-- 7. Verify the users_profile table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users_profile'
ORDER BY ordinal_position;
