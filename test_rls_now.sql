-- ============================================
-- TEST IF RLS IS WORKING NOW
-- Run this to verify the policies work
-- ============================================

-- Test 1: Can you read your profile with auth.uid()?
SELECT 
    id,
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status
FROM users_profile 
WHERE id = auth.uid();

-- Test 2: What is auth.uid() returning?
SELECT 
    auth.uid() as current_user_id,
    current_setting('request.jwt.claims', true)::json->>'sub' as jwt_user_id;

-- Test 3: Does your profile exist?
SELECT 
    id,
    email,
    full_name,
    role
FROM users_profile 
WHERE email = 'bishesh.guragain@gmail.com';
