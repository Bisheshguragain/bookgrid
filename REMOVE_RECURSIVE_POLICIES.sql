-- =====================================================
-- FIX: Remove Infinite Recursion Policies
-- =====================================================

-- Drop the broken recursive policies
DROP POLICY IF EXISTS "superadmin_select_all" ON users_profile;
DROP POLICY IF EXISTS "superadmin_update_all" ON users_profile;

-- Also clean up duplicate policies
DROP POLICY IF EXISTS "users_insert_own" ON users_profile;
DROP POLICY IF EXISTS "users_select_own" ON users_profile;
DROP POLICY IF EXISTS "users_update_own" ON users_profile;

-- Keep only these simple, non-recursive policies:
-- ✅ Users can view own profile
-- ✅ Users can update own profile  
-- ✅ Users can insert own profile
-- ✅ prevent_role_self_elevation

-- Test if it works now
SELECT 
  'Testing query...' as status,
  id,
  email,
  full_name,
  role,
  subscription_plan
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';

-- Verify remaining policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%users_profile%' THEN '❌ RECURSIVE - WILL CAUSE ISSUES'
    ELSE '✅ OK'
  END as status
FROM pg_policies
WHERE tablename = 'users_profile'
ORDER BY policyname;
