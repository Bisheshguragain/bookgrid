-- ============================================
-- CREATE SUPERADMIN DATABASE FUNCTIONS
-- These functions will provide REAL data for the dashboard
-- ============================================

-- =====================================================
-- 1. GET MRR (Monthly Recurring Revenue)
-- =====================================================
CREATE OR REPLACE FUNCTION get_mrr()
RETURNS TABLE (
  total_mrr DECIMAL,
  pro_mrr DECIMAL,
  business_mrr DECIMAL,
  currency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total MRR from all active subscriptions
    COALESCE(SUM(
      CASE 
        WHEN subscription_plan = 'pro' THEN 29.00
        WHEN subscription_plan = 'business' THEN 99.00
        ELSE 0
      END
    ), 0) as total_mrr,
    
    -- Pro plan MRR
    COALESCE(SUM(
      CASE WHEN subscription_plan = 'pro' THEN 29.00 ELSE 0 END
    ), 0) as pro_mrr,
    
    -- Business plan MRR
    COALESCE(SUM(
      CASE WHEN subscription_plan = 'business' THEN 99.00 ELSE 0 END
    ), 0) as business_mrr,
    
    'GBP'::TEXT as currency
  FROM users_profile
  WHERE subscription_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. GET USER STATISTICS
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  inactive_users BIGINT,
  free_users BIGINT,
  pro_users BIGINT,
  business_users BIGINT,
  users_today BIGINT,
  users_this_week BIGINT,
  users_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total users
    COUNT(*)::BIGINT as total_users,
    
    -- Active users (active subscription status)
    COUNT(*) FILTER (WHERE subscription_status = 'active')::BIGINT as active_users,
    
    -- Inactive users
    COUNT(*) FILTER (WHERE subscription_status != 'active' OR subscription_status IS NULL)::BIGINT as inactive_users,
    
    -- Free plan users
    COUNT(*) FILTER (WHERE subscription_plan = 'free' OR subscription_plan IS NULL)::BIGINT as free_users,
    
    -- Pro plan users
    COUNT(*) FILTER (WHERE subscription_plan = 'pro')::BIGINT as pro_users,
    
    -- Business plan users
    COUNT(*) FILTER (WHERE subscription_plan = 'business')::BIGINT as business_users,
    
    -- Users created today
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as users_today,
    
    -- Users created this week
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE))::BIGINT as users_this_week,
    
    -- Users created this month
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::BIGINT as users_this_month
  FROM users_profile;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. GET REVENUE STATISTICS
-- =====================================================
CREATE OR REPLACE FUNCTION get_revenue_statistics()
RETURNS TABLE (
  total_revenue DECIMAL,
  revenue_today DECIMAL,
  revenue_this_week DECIMAL,
  revenue_this_month DECIMAL,
  revenue_this_year DECIMAL,
  total_payments BIGINT,
  successful_payments BIGINT,
  failed_payments BIGINT
) AS $$
BEGIN
  -- Check if payment_history table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'payment_history'
  ) THEN
    RETURN QUERY
    SELECT 
      -- Total revenue from all successful payments
      COALESCE(SUM(amount) FILTER (WHERE payment_status = 'successful'), 0) as total_revenue,
      
      -- Revenue today
      COALESCE(SUM(amount) FILTER (
        WHERE payment_status = 'successful' 
        AND created_at >= CURRENT_DATE
      ), 0) as revenue_today,
      
      -- Revenue this week
      COALESCE(SUM(amount) FILTER (
        WHERE payment_status = 'successful' 
        AND created_at >= DATE_TRUNC('week', CURRENT_DATE)
      ), 0) as revenue_this_week,
      
      -- Revenue this month
      COALESCE(SUM(amount) FILTER (
        WHERE payment_status = 'successful' 
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
      ), 0) as revenue_this_month,
      
      -- Revenue this year
      COALESCE(SUM(amount) FILTER (
        WHERE payment_status = 'successful' 
        AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
      ), 0) as revenue_this_year,
      
      -- Total payments
      COUNT(*)::BIGINT as total_payments,
      
      -- Successful payments
      COUNT(*) FILTER (WHERE payment_status = 'successful')::BIGINT as successful_payments,
      
      -- Failed payments
      COUNT(*) FILTER (WHERE payment_status IN ('failed', 'cancelled'))::BIGINT as failed_payments
    FROM payment_history;
  ELSE
    -- Return zeros if payment_history table doesn't exist
    RETURN QUERY
    SELECT 
      0::DECIMAL as total_revenue,
      0::DECIMAL as revenue_today,
      0::DECIMAL as revenue_this_week,
      0::DECIMAL as revenue_this_month,
      0::DECIMAL as revenue_this_year,
      0::BIGINT as total_payments,
      0::BIGINT as successful_payments,
      0::BIGINT as failed_payments;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. GET INACTIVE USERS
-- =====================================================
CREATE OR REPLACE FUNCTION get_inactive_users(days_threshold INTEGER DEFAULT 90)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE,
  subscription_plan TEXT,
  days_inactive INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id as user_id,
    up.email,
    up.full_name,
    up.last_active_at,
    up.subscription_plan,
    EXTRACT(DAY FROM (NOW() - up.last_active_at))::INTEGER as days_inactive
  FROM users_profile up
  WHERE 
    up.last_active_at < (NOW() - INTERVAL '1 day' * days_threshold)
    AND (up.account_status = 'active' OR up.account_status IS NULL)
  ORDER BY up.last_active_at ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. GET TOTAL BOOKINGS COUNT
-- =====================================================
CREATE OR REPLACE FUNCTION get_total_bookings()
RETURNS BIGINT AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM bookings);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. GET SUBSCRIPTION BREAKDOWN
-- =====================================================
CREATE OR REPLACE FUNCTION get_subscription_breakdown()
RETURNS TABLE (
  plan TEXT,
  user_count BIGINT,
  mrr DECIMAL,
  percentage DECIMAL
) AS $$
DECLARE
  total_users BIGINT;
BEGIN
  -- Get total users count
  SELECT COUNT(*) INTO total_users FROM users_profile;
  
  RETURN QUERY
  SELECT 
    COALESCE(subscription_plan, 'free') as plan,
    COUNT(*)::BIGINT as user_count,
    CASE 
      WHEN subscription_plan = 'pro' THEN COUNT(*) * 29.00
      WHEN subscription_plan = 'business' THEN COUNT(*) * 99.00
      ELSE 0
    END as mrr,
    CASE 
      WHEN total_users > 0 THEN (COUNT(*)::DECIMAL / total_users * 100)
      ELSE 0
    END as percentage
  FROM users_profile
  WHERE subscription_status = 'active'
  GROUP BY subscription_plan
  ORDER BY user_count DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Allow authenticated users to execute these functions
GRANT EXECUTE ON FUNCTION get_mrr() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_inactive_users(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_breakdown() TO authenticated;

-- =====================================================
-- TEST THE FUNCTIONS
-- =====================================================

-- Test MRR function
SELECT * FROM get_mrr();

-- Test user statistics
SELECT * FROM get_user_statistics();

-- Test revenue statistics
SELECT * FROM get_revenue_statistics();

-- Test inactive users (last 90 days)
SELECT * FROM get_inactive_users(90);

-- Test total bookings
SELECT get_total_bookings();

-- Test subscription breakdown
SELECT * FROM get_subscription_breakdown();
