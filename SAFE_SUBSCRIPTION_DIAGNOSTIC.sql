-- =====================================================
-- SAFE SUBSCRIPTION DIAGNOSTIC
-- =====================================================
-- This version first checks what columns exist, then queries accordingly

-- 1. Show actual columns in users_profile table
SELECT 
  '1. USERS_PROFILE COLUMNS' as check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users_profile'
  AND column_name LIKE '%subscription%' OR column_name = 'bookings_this_month' OR column_name = 'role'
ORDER BY ordinal_position;

-- 2. Show actual columns in subscription_plans table
SELECT 
  '2. SUBSCRIPTION_PLANS COLUMNS' as check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- 3. Show all subscription plans (if table exists)
SELECT 
  '3. SUBSCRIPTION PLANS DATA' as check_name,
  *
FROM subscription_plans
ORDER BY 
  CASE name 
    WHEN 'free' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'business' THEN 3
    ELSE 4
  END;

-- 4. Show your user profile (all columns)
SELECT 
  '4. YOUR USER PROFILE' as check_name,
  *
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';

-- 5. Count your event types
SELECT 
  '5. EVENT TYPES COUNT' as check_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as active
FROM event_types
WHERE user_id = (SELECT id FROM users_profile WHERE email = 'bishesh.guragain@gmail.com');

-- 6. Test the exact query the frontend uses
-- This simulates: supabase.from('subscription_plans').select('*').eq('name', 'free').single()
SELECT 
  '6. FRONTEND TEST QUERY' as check_name,
  sp.*
FROM subscription_plans sp
WHERE sp.name = (
  SELECT subscription_plan 
  FROM users_profile 
  WHERE email = 'bishesh.guragain@gmail.com'
);
