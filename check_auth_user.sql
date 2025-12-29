-- ============================================
-- CHECK AUTH VS PROFILE MISMATCH
-- This checks if auth system knows about your user
-- ============================================

-- Test 1: Check if your user exists in auth.users
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'bishesh.guragain@gmail.com';

-- Test 2: Compare auth.users.id with users_profile.id
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    up.id as profile_user_id,
    up.email as profile_email,
    (au.id = up.id) as ids_match
FROM auth.users au
LEFT JOIN users_profile up ON au.id = up.id
WHERE au.email = 'bishesh.guragain@gmail.com';

-- Test 3: Check if there are any auth issues
SELECT 
    id,
    email,
    email_confirmed_at,
    banned_until,
    deleted_at
FROM auth.users 
WHERE email = 'bishesh.guragain@gmail.com';
