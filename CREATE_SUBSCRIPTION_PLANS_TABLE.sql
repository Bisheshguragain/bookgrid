-- =====================================================
-- CREATE SUBSCRIPTION PLANS TABLE IF MISSING
-- =====================================================
-- This script creates the subscription_plans table if it doesn't exist
-- and populates it with the default plans (Free, Pro, Business)

-- Create the subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  billing_period text DEFAULT 'monthly',
  max_event_types integer NOT NULL DEFAULT 1,
  max_bookings_per_month integer DEFAULT NULL, -- NULL means unlimited
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default plans if they don't exist
INSERT INTO subscription_plans (name, display_name, description, price, max_event_types, max_bookings_per_month, features)
VALUES 
  (
    'free',
    'Free Plan',
    'Perfect for getting started',
    0,
    1,
    100,
    '{
      "availability": "basic",
      "reminders": false,
      "public_link": true,
      "analytics": false,
      "integrations": false,
      "custom_branding": false,
      "priority_support": false,
      "api_access": false
    }'::jsonb
  ),
  (
    'pro',
    'Pro Plan',
    'For professionals and growing teams',
    15,
    10,
    NULL,
    '{
      "availability": "advanced",
      "reminders": true,
      "public_link": true,
      "analytics": true,
      "integrations": true,
      "custom_branding": false,
      "priority_support": true,
      "api_access": false
    }'::jsonb
  ),
  (
    'business',
    'Business Plan',
    'For teams and organizations',
    49,
    -1,
    NULL,
    '{
      "availability": "advanced",
      "reminders": true,
      "public_link": true,
      "analytics": true,
      "integrations": true,
      "custom_branding": true,
      "priority_support": true,
      "api_access": true
    }'::jsonb
  )
ON CONFLICT (name) DO NOTHING;

-- Verify the plans were created
SELECT 
  name,
  display_name,
  price,
  max_event_types,
  max_bookings_per_month,
  features
FROM subscription_plans
ORDER BY price;

-- Update any existing users to have a subscription plan if they don't have one
UPDATE users_profile
SET 
  subscription_plan = 'free',
  subscription_status = 'active'
WHERE subscription_plan IS NULL;

-- Show updated user profiles
SELECT 
  email,
  full_name,
  role,
  subscription_plan,
  subscription_status
FROM users_profile;

RAISE NOTICE '✅ Subscription plans table created and populated!';
RAISE NOTICE '✅ All users updated with default "free" plan!';
