-- ═══════════════════════════════════════════════════════════════
-- VERIFY YOUR SUPERADMIN ROLE AND TEST FUNCTIONS
-- Run these checks to find the real issue
-- ═══════════════════════════════════════════════════════════════

-- CHECK 1: Verify YOUR user is superadmin
SELECT 
  id,
  email,
  full_name,
  role,
  subscription_plan,
  subscription_status,
  account_status,
  CASE 
    WHEN role = 'superadmin' THEN '✅ IS SUPERADMIN'
    WHEN role = 'user' THEN '❌ IS REGULAR USER'
    ELSE '⚠️ ROLE IS: ' || COALESCE(role, 'NULL')
  END AS role_status
FROM users_profile
ORDER BY 
  CASE WHEN role = 'superadmin' THEN 1 ELSE 2 END,
  created_at DESC
LIMIT 5;

-- CHECK 2: Test get_mrr function
SELECT 
  'Testing get_mrr()...' AS test;

SELECT * FROM get_mrr();

-- CHECK 3: Test get_user_statistics function
SELECT 
  'Testing get_user_statistics()...' AS test;

SELECT * FROM get_user_statistics();

-- CHECK 4: Test get_revenue_statistics function
SELECT 
  'Testing get_revenue_statistics()...' AS test;

SELECT * FROM get_revenue_statistics();

-- CHECK 5: Count users by plan
SELECT 
  'User counts by plan:' AS info;

SELECT 
  subscription_plan,
  COUNT(*) AS user_count
FROM users_profile
GROUP BY subscription_plan
ORDER BY user_count DESC;

-- CHECK 6: Check superadmin policies exist
SELECT 
  'Superadmin policies on users_profile:' AS info;

SELECT 
  policyname,
  cmd AS operation
FROM pg_policies
WHERE tablename = 'users_profile'
AND policyname LIKE '%superadmin%'
ORDER BY cmd, policyname;

-- CHECK 7: Test if you can see all users (superadmin test)
SELECT 
  'Total users visible to you:' AS info;

SELECT COUNT(*) AS total_users_you_can_see
FROM users_profile;
