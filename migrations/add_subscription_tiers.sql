-- Migration: Add Subscription Tiers and Rate Limiting
-- Description: Add subscription plans (free/pro/business) and usage tracking for rate limiting
-- Date: December 28, 2025

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  max_event_types INTEGER NOT NULL,
  max_bookings_per_month INTEGER,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add subscription columns to users_profile
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bookings_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_booking_reset TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users_profile(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users_profile(subscription_status);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly, max_event_types, max_bookings_per_month, features)
VALUES 
  ('free', 'Free', 0, 0, 1, 100, 
   '{"availability": "basic", "reminders": true, "public_link": true, "analytics": false, "integrations": false, "custom_branding": false, "priority_support": false, "api_access": false}'::jsonb),
  ('pro', 'Pro', 12, 120, 10, 1000, 
   '{"availability": "advanced", "reminders": true, "public_link": true, "analytics": true, "integrations": true, "custom_branding": true, "priority_support": false, "api_access": true}'::jsonb),
  ('business', 'Business', 24, 240, -1, -1, 
   '{"availability": "advanced", "reminders": true, "public_link": true, "analytics": true, "integrations": true, "custom_branding": true, "priority_support": true, "api_access": true}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_event_types = EXCLUDED.max_event_types,
  max_bookings_per_month = EXCLUDED.max_bookings_per_month,
  features = EXCLUDED.features,
  updated_at = TIMEZONE('utc', NOW());

-- Function to reset monthly booking count
CREATE OR REPLACE FUNCTION reset_monthly_bookings()
RETURNS void AS $$
BEGIN
  UPDATE users_profile
  SET 
    bookings_this_month = 0,
    last_booking_reset = TIMEZONE('utc', NOW())
  WHERE 
    last_booking_reset < DATE_TRUNC('month', TIMEZONE('utc', NOW()));
END;
$$ LANGUAGE plpgsql;

-- Function to increment booking count
CREATE OR REPLACE FUNCTION increment_booking_count(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE users_profile
  SET bookings_this_month = bookings_this_month + 1
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can create event type
CREATE OR REPLACE FUNCTION can_create_event_type(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get user's plan and current event type count
  SELECT 
    up.subscription_plan,
    COUNT(et.id)
  INTO user_plan, current_count
  FROM users_profile up
  LEFT JOIN event_types et ON et.user_id = up.id AND et.is_active = true
  WHERE up.id = user_uuid
  GROUP BY up.subscription_plan;

  -- Get max allowed for this plan
  SELECT max_event_types INTO max_allowed
  FROM subscription_plans
  WHERE name = user_plan;

  -- -1 means unlimited
  IF max_allowed = -1 THEN
    RETURN true;
  END IF;

  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can create booking
CREATE OR REPLACE FUNCTION can_create_booking(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  current_count INTEGER;
  max_allowed INTEGER;
  last_reset TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Reset monthly counter if needed
  PERFORM reset_monthly_bookings();

  -- Get user's plan and current booking count
  SELECT 
    subscription_plan,
    bookings_this_month,
    last_booking_reset
  INTO user_plan, current_count, last_reset
  FROM users_profile
  WHERE id = user_uuid;

  -- Get max allowed for this plan
  SELECT max_bookings_per_month INTO max_allowed
  FROM subscription_plans
  WHERE name = user_plan;

  -- -1 means unlimited
  IF max_allowed = -1 THEN
    RETURN true;
  END IF;

  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

-- Add comments for documentation
COMMENT ON TABLE subscription_plans IS 'Subscription plan definitions with features and limits';
COMMENT ON COLUMN users_profile.subscription_plan IS 'Current subscription plan: free, pro, or business';
COMMENT ON COLUMN users_profile.subscription_status IS 'Subscription status: active, cancelled, expired, trial';
COMMENT ON COLUMN users_profile.bookings_this_month IS 'Number of bookings created this month for rate limiting';
COMMENT ON FUNCTION can_create_event_type IS 'Check if user can create a new event type based on their plan limits';
COMMENT ON FUNCTION can_create_booking IS 'Check if user can create a new booking based on their monthly limit';

-- ============================================
-- ROLLBACK SCRIPT (Save for emergency use)
-- ============================================
-- DROP FUNCTION IF EXISTS can_create_booking(UUID);
-- DROP FUNCTION IF EXISTS can_create_event_type(UUID);
-- DROP FUNCTION IF EXISTS increment_booking_count(UUID);
-- DROP FUNCTION IF EXISTS reset_monthly_bookings();
-- DROP TRIGGER IF EXISTS subscription_plans_updated_at ON subscription_plans;
-- DROP FUNCTION IF EXISTS update_subscription_plans_updated_at();
-- DROP TABLE IF EXISTS subscription_plans;
-- ALTER TABLE users_profile DROP COLUMN IF EXISTS subscription_plan;
-- ALTER TABLE users_profile DROP COLUMN IF EXISTS subscription_status;
-- ALTER TABLE users_profile DROP COLUMN IF EXISTS subscription_start_date;
-- ALTER TABLE users_profile DROP COLUMN IF EXISTS subscription_end_date;
-- ALTER TABLE users_profile DROP COLUMN IF EXISTS bookings_this_month;
-- ALTER TABLE users_profile DROP COLUMN IF EXISTS last_booking_reset;
