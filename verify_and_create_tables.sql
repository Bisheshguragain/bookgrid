-- Verify and create payment_history and account_deletion_notices tables
-- Run this in Supabase SQL Editor

-- Check if uuid-ossp extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PAYMENT HISTORY TABLE
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own payment history" ON payment_history;
DROP POLICY IF EXISTS "Superadmins can view all payment history" ON payment_history;
DROP POLICY IF EXISTS "System can insert payment records" ON payment_history;

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
-- 2. ACCOUNT DELETION NOTICES TABLE
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own deletion notices" ON account_deletion_notices;
DROP POLICY IF EXISTS "Superadmins can view all deletion notices" ON account_deletion_notices;
DROP POLICY IF EXISTS "System can insert deletion notices" ON account_deletion_notices;

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

CREATE POLICY "System can insert deletion notices"
  ON account_deletion_notices FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 3. VERIFY TABLES EXIST
-- =====================================================

-- Check payment_history
SELECT 
  'payment_history' as table_name,
  COUNT(*) as record_count,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'payment_history') as table_exists
FROM payment_history;

-- Check account_deletion_notices
SELECT 
  'account_deletion_notices' as table_name,
  COUNT(*) as record_count,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'account_deletion_notices') as table_exists
FROM account_deletion_notices;

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('payment_history', 'account_deletion_notices')
AND schemaname = 'public';
