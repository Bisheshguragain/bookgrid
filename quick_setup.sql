-- ⚡ SuperAdmin Dashboard - Quick Setup Script
-- Run this ONE script in Supabase SQL Editor to set up everything
-- This combines all the essential setup steps into one convenient file

-- =====================================================
-- ENABLE EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Payment History Table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  payment_status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  plan_type VARCHAR(20) NOT NULL,
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account Deletion Notices Table
CREATE TABLE IF NOT EXISTS account_deletion_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notice_type VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  days_inactive INTEGER,
  scheduled_deletion_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notice_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_status ON payment_history(payment_status);
CREATE INDEX IF NOT EXISTS idx_deletion_notices_user_id ON account_deletion_notices(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_notices_status ON account_deletion_notices(status);

-- =====================================================
-- 3. ENABLE RLS
-- =====================================================

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_notices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. DROP OLD POLICIES (if they exist)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own payment history" ON payment_history;
DROP POLICY IF EXISTS "Superadmins can view all payment history" ON payment_history;
DROP POLICY IF EXISTS "System can insert payment records" ON payment_history;
DROP POLICY IF EXISTS "Users can view their own deletion notices" ON account_deletion_notices;
DROP POLICY IF EXISTS "Superadmins can view all deletion notices" ON account_deletion_notices;
DROP POLICY IF EXISTS "System can insert deletion notices" ON account_deletion_notices;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Payment History Policies
CREATE POLICY "Users can view their own payment history"
  ON payment_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all payment history"
  ON payment_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "System can insert payment records"
  ON payment_history FOR INSERT
  WITH CHECK (true);

-- Deletion Notices Policies
CREATE POLICY "Users can view their own deletion notices"
  ON account_deletion_notices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all deletion notices"
  ON account_deletion_notices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "System can insert deletion notices"
  ON account_deletion_notices FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 6. ADD REQUIRED COLUMNS TO users_profile
-- =====================================================

-- Add username column
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS username VARCHAR(255);

-- Add account status column
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';

-- Add last active timestamp
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add deletion notice timestamp
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS deletion_notice_sent_at TIMESTAMP WITH TIME ZONE;

-- Add scheduled deletion timestamp
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP WITH TIME ZONE;

-- Add bookings this month counter
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS bookings_this_month INTEGER DEFAULT 0;

-- Create index on username
CREATE INDEX IF NOT EXISTS idx_users_profile_username ON users_profile(username);

-- =====================================================
-- 7. CREATE DATABASE FUNCTIONS
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_mrr();
DROP FUNCTION IF EXISTS get_user_statistics();
DROP FUNCTION IF EXISTS get_revenue_statistics();
DROP FUNCTION IF EXISTS get_inactive_users(INTEGER);
DROP FUNCTION IF EXISTS get_total_bookings();
DROP FUNCTION IF EXISTS get_subscription_breakdown();

-- Get MRR (Monthly Recurring Revenue)
CREATE OR REPLACE FUNCTION get_mrr()
RETURNS TABLE (
  total_mrr DECIMAL,
  pro_mrr DECIMAL,
  business_mrr DECIMAL,
  currency VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN up.subscription_plan IN ('pro', 'business') THEN 9.99 ELSE 0 END), 0) as total_mrr,
    COALESCE(SUM(CASE WHEN up.subscription_plan = 'pro' THEN 9.99 ELSE 0 END), 0) as pro_mrr,
    COALESCE(SUM(CASE WHEN up.subscription_plan = 'business' THEN 9.99 ELSE 0 END), 0) as business_mrr,
    'GBP'::VARCHAR as currency
  FROM users_profile up
  WHERE up.subscription_status = 'active'
    AND up.subscription_plan IN ('pro', 'business');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get User Statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  inactive_users BIGINT,
  free_users BIGINT,
  pro_users BIGINT,
  business_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_users,
    COUNT(CASE WHEN account_status = 'active' THEN 1 END)::BIGINT as active_users,
    COUNT(CASE WHEN account_status = 'inactive' THEN 1 END)::BIGINT as inactive_users,
    COUNT(CASE WHEN subscription_plan = 'free' THEN 1 END)::BIGINT as free_users,
    COUNT(CASE WHEN subscription_plan = 'pro' THEN 1 END)::BIGINT as pro_users,
    COUNT(CASE WHEN subscription_plan = 'business' THEN 1 END)::BIGINT as business_users
  FROM users_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Revenue Statistics
CREATE OR REPLACE FUNCTION get_revenue_statistics()
RETURNS TABLE (
  total_revenue DECIMAL,
  revenue_this_month DECIMAL,
  revenue_last_month DECIMAL,
  currency VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as revenue_this_month,
    COALESCE(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') THEN amount ELSE 0 END), 0) as revenue_last_month,
    'GBP'::VARCHAR as currency
  FROM payment_history
  WHERE payment_status = 'succeeded';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Inactive Users
CREATE OR REPLACE FUNCTION get_inactive_users(days_threshold INTEGER DEFAULT 90)
RETURNS TABLE (
  user_id UUID,
  email VARCHAR,
  full_name VARCHAR,
  subscription_plan VARCHAR,
  last_active_at TIMESTAMP WITH TIME ZONE,
  days_inactive INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    up.email,
    up.full_name,
    up.subscription_plan,
    up.last_active_at,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - up.last_active_at))::INTEGER as days_inactive
  FROM users_profile up
  WHERE up.last_active_at < (CURRENT_TIMESTAMP - (days_threshold || ' days')::INTERVAL)
    AND up.account_status != 'deleted'
  ORDER BY up.last_active_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Total Bookings
CREATE OR REPLACE FUNCTION get_total_bookings()
RETURNS TABLE (
  total_bookings BIGINT,
  bookings_this_month BIGINT,
  bookings_last_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_bookings,
    COUNT(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)::BIGINT as bookings_this_month,
    COUNT(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') THEN 1 END)::BIGINT as bookings_last_month
  FROM bookings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Subscription Breakdown
CREATE OR REPLACE FUNCTION get_subscription_breakdown()
RETURNS TABLE (
  plan_type VARCHAR,
  user_count BIGINT,
  percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH totals AS (
    SELECT COUNT(*)::BIGINT as total FROM users_profile
  )
  SELECT 
    up.subscription_plan as plan_type,
    COUNT(*)::BIGINT as user_count,
    ROUND((COUNT(*)::DECIMAL / NULLIF(t.total, 0) * 100), 2) as percentage
  FROM users_profile up
  CROSS JOIN totals t
  GROUP BY up.subscription_plan, t.total
  ORDER BY user_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

-- Check that everything was created successfully
SELECT '✅ Tables Created' as status, COUNT(*) as count
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('payment_history', 'account_deletion_notices');

SELECT '✅ Functions Created' as status, COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_mrr', 'get_user_statistics', 'get_revenue_statistics',
    'get_inactive_users', 'get_total_bookings', 'get_subscription_breakdown'
  );

SELECT '✅ Columns Added' as status, COUNT(*) as count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users_profile'
  AND column_name IN (
    'username', 'account_status', 'last_active_at',
    'deletion_notice_sent_at', 'scheduled_deletion_at', 'bookings_this_month'
  );

-- Test the functions
SELECT '✅ Testing Functions...' as status;

SELECT * FROM get_mrr();
SELECT * FROM get_user_statistics();
SELECT * FROM get_revenue_statistics();
SELECT * FROM get_total_bookings();
SELECT * FROM get_subscription_breakdown();

SELECT '✅ SuperAdmin Dashboard Setup Complete!' as final_status;
