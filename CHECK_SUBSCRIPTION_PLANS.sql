-- =====================================================
-- CHECK SUBSCRIPTION PLANS TABLE
-- =====================================================
-- This script checks if the subscription_plans table exists
-- and shows its current data

-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'subscription_plans'
) AS subscription_plans_exists;

-- If it exists, show all plans
SELECT 
  id,
  name,
  display_name,
  price_monthly,
  price_yearly,
  max_event_types,
  max_bookings_per_month,
  features,
  is_active,
  created_at
FROM subscription_plans
ORDER BY 
  CASE name 
    WHEN 'free' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'business' THEN 3
    ELSE 4
  END;

-- Check your profile subscription data
SELECT 
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
