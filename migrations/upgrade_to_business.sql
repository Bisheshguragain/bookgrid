-- Upgrade Bishesh Guragain to Business Plan
-- Run this in Supabase SQL Editor

-- Update subscription plan to Business
UPDATE users_profile 
SET subscription_plan = 'business'
WHERE email = 'bishesh.guragain@gmail.com';

-- Verify the update
SELECT 
  id,
  full_name,
  email,
  subscription_plan,
  event_types_count,
  monthly_bookings_count
FROM users_profile 
WHERE email = 'bishesh.guragain@gmail.com';

-- Expected result:
-- subscription_plan: business
-- This gives you:
-- ✅ Unlimited event types
-- ✅ Unlimited bookings
-- ✅ All premium features
