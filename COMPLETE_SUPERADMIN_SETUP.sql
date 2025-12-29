-- ╔════════════════════════════════════════════════════════════════╗
-- ║       COMPLETE SUPERADMIN SETUP - CREATE MISSING TABLES        ║
-- ║                                                                ║
-- ║  This creates payment_history and account_deletion_notices     ║
-- ║  tables, then adds all necessary superadmin policies           ║
-- ╚════════════════════════════════════════════════════════════════╝

BEGIN;

-- =============================================
-- STEP 1: CREATE payment_history TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('free', 'pro', 'business')),
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payment_history
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);

-- Enable RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_history
CREATE POLICY "users_view_own_payments"
  ON payment_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "superadmin_select_all_payments"
  ON payment_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "superadmin_update_payments"
  ON payment_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "system_insert_payments"
  ON payment_history FOR INSERT
  WITH CHECK (true);

RAISE NOTICE '✅ Created payment_history table with policies';

-- =============================================
-- STEP 2: CREATE account_deletion_notices TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS account_deletion_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notice_type VARCHAR(50) NOT NULL CHECK (notice_type IN ('inactivity', 'manual', 'violation')),
  reason TEXT NOT NULL,
  days_inactive INTEGER,
  scheduled_deletion_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notice_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'cancelled', 'executed')),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deletion_notices_user_id ON account_deletion_notices(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_notices_status ON account_deletion_notices(status);
CREATE INDEX IF NOT EXISTS idx_deletion_notices_scheduled_date ON account_deletion_notices(scheduled_deletion_date);

-- Enable RLS
ALTER TABLE account_deletion_notices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users_view_own_deletion_notices"
  ON account_deletion_notices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "superadmin_select_all_deletions"
  ON account_deletion_notices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "superadmin_update_deletions"
  ON account_deletion_notices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "superadmin_insert_deletions"
  ON account_deletion_notices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "system_manage_deletions"
  ON account_deletion_notices FOR ALL
  WITH CHECK (true);

RAISE NOTICE '✅ Created account_deletion_notices table with policies';

-- =============================================
-- STEP 3: ADD SUPERADMIN POLICY FOR event_types
-- =============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_types' 
    AND policyname = 'superadmin_select_all_event_types'
  ) THEN
    CREATE POLICY "superadmin_select_all_event_types"
    ON event_types FOR SELECT
    USING (
      (user_id = auth.uid())
      OR
      (EXISTS (
        SELECT 1 FROM users_profile 
        WHERE id = auth.uid() AND role = 'superadmin'
      ))
    );
    RAISE NOTICE '✅ Created superadmin_select_all_event_types policy';
  ELSE
    RAISE NOTICE '⚠️ superadmin_select_all_event_types already exists';
  END IF;
END $$;

-- =============================================
-- STEP 4: CREATE ANALYTICS FUNCTIONS
-- =============================================

-- Function to get MRR
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
    AND (up.account_status = 'active' OR up.account_status IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ Created get_mrr() function';

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
    COUNT(*) FILTER (WHERE account_status = 'active' OR account_status IS NULL)::BIGINT as active_users,
    COUNT(*) FILTER (WHERE account_status = 'inactive')::BIGINT as inactive_users,
    COUNT(*) FILTER (WHERE subscription_plan = 'free' OR subscription_plan IS NULL)::BIGINT as free_users,
    COUNT(*) FILTER (WHERE subscription_plan = 'pro')::BIGINT as pro_users,
    COUNT(*) FILTER (WHERE subscription_plan = 'business')::BIGINT as business_users,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as users_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as users_this_week,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::BIGINT as users_this_month
  FROM users_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ Created get_user_statistics() function';

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
    COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
    COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at >= CURRENT_DATE), 0) as revenue_today,
    COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '7 days'), 0) as revenue_this_week,
    COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) as revenue_this_month,
    COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '1 year'), 0) as revenue_this_year,
    COUNT(*)::BIGINT as total_payments,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as successful_payments,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_payments
  FROM payment_history;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ Created get_revenue_statistics() function';

COMMIT;

-- =============================================
-- VERIFICATION
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                    ✅ SETUP COMPLETE!                           ║
╚════════════════════════════════════════════════════════════════╝
' AS status;

-- Show created tables
SELECT 'Tables created:' AS info;
SELECT table_name, '✅ EXISTS' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('payment_history', 'account_deletion_notices')
ORDER BY table_name;

-- Show created policies
SELECT 'Superadmin policies:' AS info;
SELECT tablename, policyname, cmd AS operation
FROM pg_policies
WHERE policyname LIKE '%superadmin%'
ORDER BY tablename, cmd;

-- Show created functions
SELECT 'Analytics functions:' AS info;
SELECT routine_name, '✅ EXISTS' AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_mrr', 'get_user_statistics', 'get_revenue_statistics')
ORDER BY routine_name;

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                    🎯 NEXT STEPS                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  1. Refresh your SuperAdmin Dashboard (Cmd+Shift+R)            ║
║  2. All tabs should now work:                                  ║
║     ✅ Overview (with full stats)                               ║
║     ✅ Users                                                     ║
║     ✅ Payments (newly working!)                                ║
║     ✅ Inactive Users                                            ║
║     ✅ Deletions (newly working!)                               ║
║                                                                ║
║  3. Test each tab to verify functionality                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
' AS final_message;
