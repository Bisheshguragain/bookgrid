-- =====================================================
-- GET ACTUAL ERROR FROM RLS POLICIES
-- =====================================================
-- This will test if RLS policies are blocking the query

-- First, check what RLS policies exist on users_profile
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users_profile'
ORDER BY policyname;

-- Test: Try to select as if you're an authenticated user
-- This simulates what the frontend API call does
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'e2afcb8f-dd48-4da2-9e43-b987272229ce';

SELECT 
  id,
  email,
  full_name,
  role,
  subscription_plan,
  subscription_status
FROM users_profile
WHERE id = 'e2afcb8f-dd48-4da2-9e43-b987272229ce';

-- Reset role
RESET ROLE;

-- Check if there's a broken function referenced in RLS policies
SELECT 
  policyname,
  qual
FROM pg_policies
WHERE tablename = 'users_profile'
  AND qual LIKE '%(%';  -- Looks for function calls in policies
