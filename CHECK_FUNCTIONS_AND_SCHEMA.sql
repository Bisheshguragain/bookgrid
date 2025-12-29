-- ╔════════════════════════════════════════════════════════════════╗
-- ║         CHECK WHAT FUNCTIONS ACTUALLY EXIST                    ║
-- ║                                                                ║
-- ║  Run this to see what database functions you have              ║
-- ║  This will help us understand your ACTUAL working setup        ║
-- ╚════════════════════════════════════════════════════════════════╝

-- Check for ALL functions starting with 'get_'
SELECT '
╔════════════════════════════════════════════════════════════════╗
║              ALL FUNCTIONS IN YOUR DATABASE                    ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

SELECT 
  routine_name AS function_name,
  routine_type AS type,
  data_type AS returns,
  CASE 
    WHEN routine_name LIKE 'get_%' THEN '✅ Analytics function'
    ELSE 'Other function'
  END AS category
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check specifically for SuperAdmin functions
SELECT '
╔════════════════════════════════════════════════════════════════╗
║           SUPERADMIN ANALYTICS FUNCTIONS (Expected)            ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

WITH expected_functions AS (
  SELECT 'get_mrr' AS function_name
  UNION ALL SELECT 'get_user_statistics'
  UNION ALL SELECT 'get_revenue_statistics'
  UNION ALL SELECT 'get_user_analytics'
  UNION ALL SELECT 'get_subscription_stats'
  UNION ALL SELECT 'get_payment_stats'
  UNION ALL SELECT 'get_inactive_users'
  UNION ALL SELECT 'get_deletion_notices'
  UNION ALL SELECT 'get_total_bookings'
  UNION ALL SELECT 'get_subscription_breakdown'
)
SELECT 
  ef.function_name,
  CASE 
    WHEN r.routine_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status,
  r.data_type AS returns
FROM expected_functions ef
LEFT JOIN information_schema.routines r 
  ON r.routine_name = ef.function_name 
  AND r.routine_schema = 'public'
ORDER BY ef.function_name;

-- Check function definitions (to see what they query)
SELECT '
╔════════════════════════════════════════════════════════════════╗
║           FUNCTION DEFINITIONS (What tables they use)          ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_mrr',
  'get_user_statistics',
  'get_revenue_statistics'
)
ORDER BY routine_name;

-- Check what columns exist in users_profile
SELECT '
╔════════════════════════════════════════════════════════════════╗
║            USERS_PROFILE COLUMNS (Your actual schema)          ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('subscription_plan', 'subscription_status') THEN '💳 SUBSCRIPTION'
    WHEN column_name IN ('role', 'account_status') THEN '👤 USER STATUS'
    WHEN column_name IN ('last_active_at', 'created_at') THEN '📅 TIMESTAMPS'
    ELSE '📋 OTHER'
  END AS category
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users_profile'
ORDER BY 
  CASE 
    WHEN column_name = 'id' THEN 1
    WHEN column_name = 'email' THEN 2
    WHEN column_name = 'full_name' THEN 3
    WHEN column_name = 'role' THEN 4
    WHEN column_name IN ('subscription_plan', 'subscription_status') THEN 5
    ELSE 99
  END,
  column_name;

-- Test if functions work (if they exist)
DO $$
BEGIN
  -- Try to call get_mrr
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_mrr') THEN
    RAISE NOTICE '✅ get_mrr() exists - trying to call it...';
    PERFORM * FROM get_mrr();
    RAISE NOTICE '✅ get_mrr() works!';
  ELSE
    RAISE NOTICE '❌ get_mrr() does not exist';
  END IF;

  -- Try to call get_user_statistics
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_statistics') THEN
    RAISE NOTICE '✅ get_user_statistics() exists - trying to call it...';
    PERFORM * FROM get_user_statistics();
    RAISE NOTICE '✅ get_user_statistics() works!';
  ELSE
    RAISE NOTICE '❌ get_user_statistics() does not exist';
  END IF;

  -- Try to call get_revenue_statistics  
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_revenue_statistics') THEN
    RAISE NOTICE '✅ get_revenue_statistics() exists - trying to call it...';
    PERFORM * FROM get_revenue_statistics();
    RAISE NOTICE '✅ get_revenue_statistics() works!';
  ELSE
    RAISE NOTICE '❌ get_revenue_statistics() does not exist';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Function exists but FAILED to execute: %', SQLERRM;
END $$;

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                      SUMMARY                                   ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Review the results above to understand:                       ║
║                                                                ║
║  1. Which functions exist in your database                     ║
║  2. Whether they work or throw errors                          ║
║  3. What columns exist in users_profile                        ║
║  4. What tables those functions are querying                   ║
║                                                                ║
║  Share these results so we can restore EXACTLY what you had!   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
' AS summary;
