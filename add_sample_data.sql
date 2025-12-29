-- Add sample data for SuperAdmin Dashboard testing
-- Run this in Supabase SQL Editor (OPTIONAL - for demo/testing only)

-- =====================================================
-- 1. ADD SAMPLE PAYMENT HISTORY
-- =====================================================

-- Get the current user's ID (bishesh.guragain@gmail.com)
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO current_user_id
  FROM auth.users
  WHERE email = 'bishesh.guragain@gmail.com';

  -- Check if user exists
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'User not found';
    RETURN;
  END IF;

  RAISE NOTICE 'Adding sample payment history for user: %', current_user_id;

  -- Insert sample payment records (last 6 months)
  INSERT INTO payment_history (
    user_id,
    stripe_payment_id,
    stripe_customer_id,
    stripe_subscription_id,
    amount,
    currency,
    payment_status,
    payment_method,
    plan_type,
    billing_period_start,
    billing_period_end,
    created_at
  )
  VALUES
    -- Pro plan payment - 6 months ago
    (
      current_user_id,
      'pi_test_' || substr(md5(random()::text), 1, 24),
      'cus_test_' || substr(md5(random()::text), 1, 14),
      'sub_test_' || substr(md5(random()::text), 1, 14),
      9.99,
      'GBP',
      'succeeded',
      'card',
      'pro',
      NOW() - INTERVAL '6 months',
      NOW() - INTERVAL '5 months',
      NOW() - INTERVAL '6 months'
    ),
    -- Pro plan payment - 5 months ago
    (
      current_user_id,
      'pi_test_' || substr(md5(random()::text), 1, 24),
      'cus_test_' || substr(md5(random()::text), 1, 14),
      'sub_test_' || substr(md5(random()::text), 1, 14),
      9.99,
      'GBP',
      'succeeded',
      'card',
      'pro',
      NOW() - INTERVAL '5 months',
      NOW() - INTERVAL '4 months',
      NOW() - INTERVAL '5 months'
    ),
    -- Pro plan payment - 4 months ago
    (
      current_user_id,
      'pi_test_' || substr(md5(random()::text), 1, 24),
      'cus_test_' || substr(md5(random()::text), 1, 14),
      'sub_test_' || substr(md5(random()::text), 1, 14),
      9.99,
      'GBP',
      'succeeded',
      'card',
      'pro',
      NOW() - INTERVAL '4 months',
      NOW() - INTERVAL '3 months',
      NOW() - INTERVAL '4 months'
    ),
    -- Pro plan payment - 3 months ago
    (
      current_user_id,
      'pi_test_' || substr(md5(random()::text), 1, 24),
      'cus_test_' || substr(md5(random()::text), 1, 14),
      'sub_test_' || substr(md5(random()::text), 1, 14),
      9.99,
      'GBP',
      'succeeded',
      'card',
      'pro',
      NOW() - INTERVAL '3 months',
      NOW() - INTERVAL '2 months',
      NOW() - INTERVAL '3 months'
    ),
    -- Pro plan payment - 2 months ago
    (
      current_user_id,
      'pi_test_' || substr(md5(random()::text), 1, 24),
      'cus_test_' || substr(md5(random()::text), 1, 14),
      'sub_test_' || substr(md5(random()::text), 1, 14),
      9.99,
      'GBP',
      'succeeded',
      'card',
      'pro',
      NOW() - INTERVAL '2 months',
      NOW() - INTERVAL '1 month',
      NOW() - INTERVAL '2 months'
    ),
    -- Pro plan payment - 1 month ago
    (
      current_user_id,
      'pi_test_' || substr(md5(random()::text), 1, 24),
      'cus_test_' || substr(md5(random()::text), 1, 14),
      'sub_test_' || substr(md5(random()::text), 1, 14),
      9.99,
      'GBP',
      'succeeded',
      'card',
      'pro',
      NOW() - INTERVAL '1 month',
      NOW(),
      NOW() - INTERVAL '1 month'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Sample payment history added successfully';

END $$;

-- =====================================================
-- 2. VERIFY DATA
-- =====================================================

-- Check payment history count
SELECT 
  'Payment History' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_payment,
  MAX(created_at) as newest_payment,
  SUM(amount) as total_amount
FROM payment_history;

-- Check payment breakdown by plan
SELECT 
  plan_type,
  COUNT(*) as payment_count,
  SUM(amount) as total_amount,
  payment_status
FROM payment_history
GROUP BY plan_type, payment_status
ORDER BY plan_type;

-- Check deletion notices count
SELECT 
  'Deletion Notices' as table_name,
  COUNT(*) as record_count
FROM account_deletion_notices;

-- =====================================================
-- 3. OPTIONAL: ADD SAMPLE DELETION NOTICE (COMMENTED OUT)
-- =====================================================

/*
-- Uncomment this section if you want to test deletion notices
-- This will create a test user and send them a deletion notice

-- Create a test inactive user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  uuid_generate_v4(),
  'inactive.test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW() - INTERVAL '120 days',
  NOW() - INTERVAL '120 days'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Get the test user ID and create profile
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'inactive.test@example.com';

  -- Create profile
  INSERT INTO users_profile (
    id,
    user_id,
    email,
    full_name,
    username,
    subscription_plan,
    account_status,
    last_active_at,
    created_at
  )
  VALUES (
    uuid_generate_v4(),
    test_user_id,
    'inactive.test@example.com',
    'Inactive Test User',
    'inactivetest',
    'free',
    'inactive',
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '120 days'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Send deletion notice
  INSERT INTO account_deletion_notices (
    user_id,
    notice_type,
    reason,
    days_inactive,
    scheduled_deletion_date,
    status
  )
  VALUES (
    test_user_id,
    'inactivity',
    'Account inactive for 120+ days',
    120,
    NOW() + INTERVAL '30 days',
    'sent'
  )
  ON CONFLICT DO NOTHING;

END $$;
*/

-- =====================================================
-- 4. FINAL VERIFICATION
-- =====================================================

SELECT 
  'Summary' as report,
  (SELECT COUNT(*) FROM users_profile) as total_users,
  (SELECT COUNT(*) FROM payment_history) as total_payments,
  (SELECT COUNT(*) FROM account_deletion_notices) as total_deletion_notices,
  (SELECT SUM(amount) FROM payment_history WHERE payment_status = 'succeeded') as total_revenue;
