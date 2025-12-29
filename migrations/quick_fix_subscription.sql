-- Quick Fix: Ensure Subscription System Tables Exist
-- Run this in Supabase SQL Editor if you're seeing "Subscription data not loaded"

-- ============================================
-- PART 1: Check if tables exist
-- ============================================

-- Check subscription_plans table
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'subscription_plans'
) as subscription_plans_exists;

-- Check users_profile columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
AND column_name IN ('subscription_plan', 'event_types_count', 'monthly_bookings_count', 'bookings_reset_date')
ORDER BY column_name;

-- ============================================
-- PART 2: Create subscription_plans table if missing
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  max_event_types INTEGER NOT NULL DEFAULT 1,
  max_bookings_per_month INTEGER DEFAULT 100,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 3: Add columns to users_profile if missing
-- ============================================

-- Add subscription_plan column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users_profile' 
    AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN subscription_plan TEXT DEFAULT 'free';
  END IF;
END $$;

-- Add event_types_count column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users_profile' 
    AND column_name = 'event_types_count'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN event_types_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add monthly_bookings_count column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users_profile' 
    AND column_name = 'monthly_bookings_count'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN monthly_bookings_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add bookings_reset_date column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users_profile' 
    AND column_name = 'bookings_reset_date'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN bookings_reset_date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- ============================================
-- PART 4: Insert subscription plans
-- ============================================

-- Delete existing plans (if re-running)
DELETE FROM subscription_plans;

-- Insert Free plan
INSERT INTO subscription_plans (
  name, 
  display_name, 
  description,
  price_monthly, 
  price_yearly,
  max_event_types,
  max_bookings_per_month,
  features,
  is_active
) VALUES (
  'free',
  'Free',
  'Perfect for getting started',
  0.00,
  0.00,
  1,
  100,
  '{
    "availability": "basic",
    "reminders": true,
    "public_link": true,
    "analytics": false,
    "integrations": false,
    "custom_branding": false,
    "priority_support": false,
    "api_access": false
  }'::jsonb,
  true
);

-- Insert Pro plan
INSERT INTO subscription_plans (
  name, 
  display_name, 
  description,
  price_monthly, 
  price_yearly,
  max_event_types,
  max_bookings_per_month,
  features,
  is_active
) VALUES (
  'pro',
  'Pro',
  'For professionals and growing teams',
  12.00,
  120.00,
  10,
  1000,
  '{
    "availability": "advanced",
    "reminders": true,
    "public_link": true,
    "analytics": true,
    "integrations": false,
    "custom_branding": true,
    "priority_support": true,
    "api_access": false
  }'::jsonb,
  true
);

-- Insert Business plan
INSERT INTO subscription_plans (
  name, 
  display_name, 
  description,
  price_monthly, 
  price_yearly,
  max_event_types,
  max_bookings_per_month,
  features,
  is_active
) VALUES (
  'business',
  'Business',
  'For scaling businesses',
  24.00,
  240.00,
  -1,
  -1,
  '{
    "availability": "advanced",
    "reminders": true,
    "public_link": true,
    "analytics": true,
    "integrations": false,
    "custom_branding": true,
    "priority_support": true,
    "api_access": false
  }'::jsonb,
  true
);

-- ============================================
-- PART 5: Update existing users to have free plan
-- ============================================

UPDATE users_profile 
SET 
  subscription_plan = 'free',
  event_types_count = 0,
  monthly_bookings_count = 0,
  bookings_reset_date = CURRENT_DATE
WHERE subscription_plan IS NULL;

-- ============================================
-- PART 6: Enable RLS on subscription_plans
-- ============================================

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read active plans
DROP POLICY IF EXISTS "Allow authenticated users to read active plans" ON subscription_plans;
CREATE POLICY "Allow authenticated users to read active plans"
ON subscription_plans FOR SELECT
TO authenticated
USING (is_active = true);

-- ============================================
-- PART 7: Verification queries
-- ============================================

-- Check subscription plans
SELECT name, display_name, price_monthly, max_event_types, max_bookings_per_month 
FROM subscription_plans 
WHERE is_active = true
ORDER BY price_monthly;

-- Check users have subscription plan set
SELECT id, full_name, subscription_plan, event_types_count, monthly_bookings_count
FROM users_profile
LIMIT 5;

-- ============================================
-- SUCCESS!
-- ============================================
-- If you see 3 rows in subscription_plans and
-- your users have subscription_plan = 'free',
-- refresh your dashboard and the banner should appear!
-- ============================================
