-- =====================================================
-- CHECK ACTUAL SUBSCRIPTION_PLANS SCHEMA
-- =====================================================
-- This will show us the actual columns in the table

-- Get the actual column names and types
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- Show all data in the table (whatever columns exist)
SELECT * FROM subscription_plans;

-- Also check the users_profile table to see subscription-related columns
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users_profile'
  AND column_name LIKE '%subscription%'
ORDER BY ordinal_position;
