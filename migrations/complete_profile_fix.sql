-- Complete Fix: Name Missing + Ensure 500 Error is Gone
-- Run this entire script in Supabase SQL Editor

-- =======================
-- PART 1: Check and Fix Your Profile Data
-- =======================

-- 1. Check current data
SELECT 
  id,
  email,
  full_name,
  username,
  role,
  account_status,
  subscription_plan,
  created_at
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';

-- 2. Update your profile with complete data
UPDATE users_profile
SET 
  full_name = COALESCE(NULLIF(full_name, ''), 'Bishesh Guragain'),
  username = COALESCE(NULLIF(username, ''), 'bishesh'),
  role = 'superadmin',
  account_status = 'active',
  subscription_plan = COALESCE(subscription_plan, 'business'),
  subscription_status = COALESCE(subscription_status, 'active'),
  last_active_at = NOW(),
  updated_at = NOW()
WHERE email = 'bishesh.guragain@gmail.com';

-- 3. Verify the update
SELECT 
  id,
  email,
  full_name,
  username,
  role,
  account_status,
  subscription_plan
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';

-- =======================
-- PART 2: Ensure RLS Policies Are Working
-- =======================

-- 4. Test that you can query your own profile (should work)
SELECT id, email, full_name, role
FROM users_profile
WHERE id = 'e2afcb8f-dd48-4da2-9e43-b987272229ce';

-- 5. Test that you can query ALL profiles (as superadmin)
SELECT id, email, full_name, role
FROM users_profile
ORDER BY created_at DESC
LIMIT 10;

-- =======================
-- PART 3: Check RLS Policies Status
-- =======================

-- 6. List all current policies
SELECT 
  tablename,
  policyname,
  permissive,
  cmd,
  CASE 
    WHEN qual IS NULL THEN 'No restriction'
    ELSE 'Has restriction'
  END as has_restriction
FROM pg_policies
WHERE tablename = 'users_profile'
ORDER BY policyname;

-- =======================
-- EXPECTED RESULTS
-- =======================

/*
After running this:

1. Your profile should show:
   - full_name: Bishesh Guragain
   - role: superadmin
   - account_status: active

2. You should be able to SELECT your own profile (no error)

3. You should be able to SELECT all profiles (as superadmin)

4. You should see these policies:
   - enable_insert_own_profile
   - enable_select_own_profile
   - enable_superadmin_select_all
   - enable_superadmin_update_all
   - enable_update_own_profile
*/
