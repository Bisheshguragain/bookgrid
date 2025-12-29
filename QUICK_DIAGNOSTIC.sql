-- ═══════════════════════════════════════════════════════════════
-- SIMPLE DIAGNOSTIC - RUN THIS
-- ═══════════════════════════════════════════════════════════════

-- STEP 1: Check if get_mrr function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'get_mrr'
    ) THEN '✅ get_mrr EXISTS'
    ELSE '❌ get_mrr MISSING'
  END AS get_mrr_status;

-- STEP 2: Check if get_user_statistics function exists  
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'get_user_statistics'
    ) THEN '✅ get_user_statistics EXISTS'
    ELSE '❌ get_user_statistics MISSING'
  END AS get_user_statistics_status;

-- STEP 3: Check if get_revenue_statistics function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'get_revenue_statistics'
    ) THEN '✅ get_revenue_statistics EXISTS'
    ELSE '❌ get_revenue_statistics MISSING'
  END AS get_revenue_statistics_status;

-- STEP 4: Check if payment_history table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'payment_history'
    ) THEN '✅ payment_history table EXISTS'
    ELSE '❌ payment_history table MISSING'
  END AS payment_history_status;

-- STEP 5: Check if account_deletion_notices table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'account_deletion_notices'
    ) THEN '✅ account_deletion_notices table EXISTS'
    ELSE '❌ account_deletion_notices table MISSING'
  END AS account_deletion_notices_status;

-- STEP 6: Check users_profile columns
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users_profile' AND column_name = 'subscription_plan'
    ) THEN '✅ subscription_plan column EXISTS'
    ELSE '❌ subscription_plan column MISSING'
  END AS subscription_plan_status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users_profile' AND column_name = 'subscription_status'
    ) THEN '✅ subscription_status column EXISTS'
    ELSE '❌ subscription_status column MISSING'
  END AS subscription_status_status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users_profile' AND column_name = 'role'
    ) THEN '✅ role column EXISTS'
    ELSE '❌ role column MISSING'
  END AS role_status;

-- STEP 7: Count total functions
SELECT 
  COUNT(*) AS total_functions_in_database
FROM information_schema.routines
WHERE routine_schema = 'public';

-- STEP 8: List ALL function names
SELECT 
  routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
