-- =====================================================
-- SUPERADMIN DASHBOARD SYSTEM
-- =====================================================
-- This migration adds comprehensive superadmin functionality including:
-- - Superadmin roles and permissions
-- - User activity tracking
-- - Payment history tracking
-- - Account deletion notices
-- - Analytics and reporting functions

-- =====================================================
-- 1. ADD SUPERADMIN ROLE TO USERS
-- =====================================================

-- Add role and last_active fields to users_profile
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS deletion_notice_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile(role);
CREATE INDEX IF NOT EXISTS idx_users_profile_last_active ON users_profile(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_profile_account_status ON users_profile(account_status);

-- Add check constraint for role
ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS users_profile_role_check;
ALTER TABLE users_profile ADD CONSTRAINT users_profile_role_check 
  CHECK (role IN ('user', 'superadmin'));

-- Add check constraint for account_status
ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS users_profile_account_status_check;
ALTER TABLE users_profile ADD CONSTRAINT users_profile_account_status_check 
  CHECK (account_status IN ('active', 'inactive', 'pending_deletion', 'deleted'));

-- =====================================================
-- 2. PAYMENT HISTORY TABLE
-- =====================================================

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

-- Indexes for payment_history
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_payment_id ON payment_history(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_customer_id ON payment_history(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_status ON payment_history(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_history_plan_type ON payment_history(plan_type);

-- Enable RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_history
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

-- =====================================================
-- 3. USER ACTIVITY LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  activity_description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_activity_log
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON user_activity_log(activity_type);

-- Enable RLS
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity_log
CREATE POLICY "Superadmins can view all activity logs"
  ON user_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "System can insert activity logs"
  ON user_activity_log FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 4. ACCOUNT DELETION NOTICES TABLE
-- =====================================================

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deletion_notices_user_id ON account_deletion_notices(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_notices_status ON account_deletion_notices(status);
CREATE INDEX IF NOT EXISTS idx_deletion_notices_scheduled_date ON account_deletion_notices(scheduled_deletion_date);

-- Enable RLS
ALTER TABLE account_deletion_notices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

CREATE POLICY "System can manage deletion notices"
  ON account_deletion_notices FOR ALL
  WITH CHECK (true);

-- =====================================================
-- 5. ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get MRR (Monthly Recurring Revenue)
CREATE OR REPLACE FUNCTION get_mrr()
RETURNS TABLE(
  total_mrr DECIMAL,
  pro_mrr DECIMAL,
  business_mrr DECIMAL,
  currency VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN up.subscription_plan = 'pro' THEN 12.00
        WHEN up.subscription_plan = 'business' THEN 24.00
        ELSE 0
      END
    ), 0) as total_mrr,
    COALESCE(SUM(
      CASE WHEN up.subscription_plan = 'pro' THEN 12.00 ELSE 0 END
    ), 0) as pro_mrr,
    COALESCE(SUM(
      CASE WHEN up.subscription_plan = 'business' THEN 24.00 ELSE 0 END
    ), 0) as business_mrr,
    'GBP'::VARCHAR as currency
  FROM users_profile up
  WHERE up.subscription_plan IN ('pro', 'business')
    AND up.account_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE(
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
    COUNT(*)::BIGINT as total_users,
    COUNT(*) FILTER (WHERE account_status = 'active')::BIGINT as active_users,
    COUNT(*) FILTER (WHERE account_status = 'inactive')::BIGINT as inactive_users,
    COUNT(*) FILTER (WHERE subscription_plan = 'free')::BIGINT as free_users,
    COUNT(*) FILTER (WHERE subscription_plan = 'pro')::BIGINT as pro_users,
    COUNT(*) FILTER (WHERE subscription_plan = 'business')::BIGINT as business_users,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as users_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as users_this_week,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::BIGINT as users_this_month
  FROM users_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get revenue statistics
CREATE OR REPLACE FUNCTION get_revenue_statistics()
RETURNS TABLE(
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
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount), 0) as total_revenue,
    COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE), 0) as revenue_today,
    COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'), 0) as revenue_this_week,
    COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) as revenue_this_month,
    COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '365 days'), 0) as revenue_this_year,
    COUNT(*)::BIGINT as total_payments,
    COUNT(*) FILTER (WHERE payment_status = 'succeeded')::BIGINT as successful_payments,
    COUNT(*) FILTER (WHERE payment_status = 'failed')::BIGINT as failed_payments
  FROM payment_history;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to identify inactive users
CREATE OR REPLACE FUNCTION get_inactive_users(days_threshold INTEGER DEFAULT 90)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name VARCHAR,
  subscription_plan VARCHAR,
  last_active_at TIMESTAMP WITH TIME ZONE,
  days_inactive INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    au.email,
    up.full_name,
    up.subscription_plan,
    up.last_active_at,
    EXTRACT(DAY FROM NOW() - up.last_active_at)::INTEGER as days_inactive,
    up.created_at
  FROM users_profile up
  JOIN auth.users au ON au.id = up.user_id
  WHERE up.last_active_at < NOW() - (days_threshold || ' days')::INTERVAL
    AND up.account_status = 'active'
  ORDER BY up.last_active_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last active timestamp
CREATE OR REPLACE FUNCTION update_user_last_active(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users_profile
  SET last_active_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send deletion notice
CREATE OR REPLACE FUNCTION send_deletion_notice(
  p_user_id UUID,
  p_notice_type VARCHAR,
  p_reason TEXT,
  p_days_inactive INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_notice_id UUID;
  v_deletion_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate deletion date (7 days from now)
  v_deletion_date := NOW() + INTERVAL '7 days';
  
  -- Insert deletion notice
  INSERT INTO account_deletion_notices (
    user_id,
    notice_type,
    reason,
    days_inactive,
    scheduled_deletion_date
  ) VALUES (
    p_user_id,
    p_notice_type,
    p_reason,
    p_days_inactive,
    v_deletion_date
  )
  RETURNING id INTO v_notice_id;
  
  -- Update user profile
  UPDATE users_profile
  SET 
    deletion_notice_sent_at = NOW(),
    scheduled_deletion_at = v_deletion_date,
    account_status = 'pending_deletion'
  WHERE user_id = p_user_id;
  
  RETURN v_notice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel deletion notice
CREATE OR REPLACE FUNCTION cancel_deletion_notice(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update deletion notices
  UPDATE account_deletion_notices
  SET status = 'cancelled'
  WHERE user_id = p_user_id AND status = 'sent';
  
  -- Update user profile
  UPDATE users_profile
  SET 
    deletion_notice_sent_at = NULL,
    scheduled_deletion_at = NULL,
    account_status = 'active',
    last_active_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. AUTOMATED CLEANUP FUNCTIONS
-- =====================================================

-- Function to process inactive accounts
CREATE OR REPLACE FUNCTION process_inactive_accounts()
RETURNS TABLE(
  notices_sent INTEGER,
  accounts_deleted INTEGER
) AS $$
DECLARE
  v_notices_sent INTEGER := 0;
  v_accounts_deleted INTEGER := 0;
  v_user RECORD;
BEGIN
  -- Send deletion notices for free users inactive for 90+ days
  FOR v_user IN 
    SELECT up.user_id, up.full_name, au.email
    FROM users_profile up
    JOIN auth.users au ON au.id = up.user_id
    WHERE up.subscription_plan = 'free'
      AND up.last_active_at < NOW() - INTERVAL '90 days'
      AND up.account_status = 'active'
      AND up.deletion_notice_sent_at IS NULL
  LOOP
    PERFORM send_deletion_notice(
      v_user.user_id,
      'inactivity',
      'Free account inactive for 90 days',
      90
    );
    v_notices_sent := v_notices_sent + 1;
  END LOOP;
  
  -- Delete accounts where deletion date has passed
  FOR v_user IN
    SELECT up.user_id
    FROM users_profile up
    WHERE up.scheduled_deletion_at IS NOT NULL
      AND up.scheduled_deletion_at < NOW()
      AND up.account_status = 'pending_deletion'
  LOOP
    -- Mark account as deleted (actual deletion handled by application)
    UPDATE users_profile
    SET account_status = 'deleted'
    WHERE user_id = v_user.user_id;
    
    v_accounts_deleted := v_accounts_deleted + 1;
  END LOOP;
  
  RETURN QUERY SELECT v_notices_sent, v_accounts_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_mrr() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_inactive_users(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_last_active(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_deletion_notice(UUID, VARCHAR, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_deletion_notice(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_inactive_accounts() TO authenticated;

-- =====================================================
-- COMPLETED
-- =====================================================
-- This migration sets up:
-- ✅ Superadmin role system
-- ✅ Payment history tracking
-- ✅ User activity logging
-- ✅ Account deletion notices
-- ✅ Analytics functions (MRR, user stats, revenue)
-- ✅ Inactive user detection
-- ✅ Automated account cleanup
-- =====================================================
