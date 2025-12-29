-- ============================================
-- VERIFY YOUR PROFILE CAN BE READ
-- Run this to confirm RLS is working
-- ============================================

-- Test 1: Check if you can read your own profile
SELECT 
    id,
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status
FROM users_profile 
WHERE id = auth.uid();

-- Test 2: Verify auth.uid() is working
SELECT auth.uid() as my_user_id;

-- Test 3: Count how many users you can see
SELECT COUNT(*) as visible_users FROM users_profile;

-- Test 4: If you're superadmin, you should see all users
SELECT 
    email,
    full_name,
    role,
    subscription_plan
FROM users_profile
ORDER BY created_at DESC
LIMIT 5;
