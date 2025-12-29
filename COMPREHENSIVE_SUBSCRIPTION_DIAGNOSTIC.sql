-- =====================================================
-- COMPREHENSIVE SUBSCRIPTION DIAGNOSTIC
-- =====================================================
-- Run this to see the complete state of subscription system

-- 1. Check if subscription_plans table exists and show its schema
SELECT 
  '1. SUBSCRIPTION_PLANS TABLE SCHEMA' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- 2. Show all subscription plans
SELECT 
  '2. ALL SUBSCRIPTION PLANS' as check_name,
  id,
  name,
  display_name,
  price_monthly,
  price_yearly,
  max_event_types,
  max_bookings_per_month,
  is_active
FROM subscription_plans
ORDER BY price_monthly;

-- 3. Show your user profile with subscription info
SELECT 
  '3. YOUR USER PROFILE' as check_name,
  id,
  email,
  full_name,
  role,
  subscription_plan,
  subscription_status,
  bookings_this_month,
  created_at
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';

-- 4. Count your event types
SELECT 
  '4. YOUR EVENT TYPES COUNT' as check_name,
  COUNT(*) as total_event_types,
  COUNT(*) FILTER (WHERE is_active = true) as active_event_types
FROM event_types
WHERE user_id = (SELECT id FROM users_profile WHERE email = 'bishesh.guragain@gmail.com');

-- 5. Count your bookings this month
SELECT 
  '5. YOUR BOOKINGS THIS MONTH' as check_name,
  COUNT(*) as bookings_count
FROM bookings
WHERE user_id = (SELECT id FROM users_profile WHERE email = 'bishesh.guragain@gmail.com')
  AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());

-- 6. Check if subscription functions exist
SELECT 
  '6. SUBSCRIPTION FUNCTIONS' as check_name,
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('can_create_event_type', 'can_create_booking', 'increment_booking_count')
ORDER BY proname;

-- 7. Check RLS policies on subscription_plans
SELECT 
  '7. SUBSCRIPTION_PLANS RLS POLICIES' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'subscription_plans';

-- 8. Test the subscription query that the frontend uses
SELECT 
  '8. TEST FRONTEND QUERY' as check_name,
  sp.*,
  up.subscription_plan as user_current_plan,
  up.subscription_status as user_status,
  up.bookings_this_month
FROM subscription_plans sp
LEFT JOIN users_profile up ON up.subscription_plan = sp.name
WHERE up.email = 'bishesh.guragain@gmail.com';
