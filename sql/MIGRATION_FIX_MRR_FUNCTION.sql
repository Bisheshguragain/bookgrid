-- MIGRATION: Fix get_mrr() to use only real, active, paid subscriptions for MRR calculation
-- Run this in your Supabase SQL editor or psql

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
        WHEN up.subscription_plan = 'pro' AND up.subscription_status = 'active'
          AND EXISTS (
            SELECT 1 FROM payment_history ph
            WHERE ph.user_id = up.id
              AND ph.status = 'completed'
              AND ph.plan_type = 'pro'
              AND ph.billing_period_end > NOW()
          )
        THEN 12.00
        WHEN up.subscription_plan = 'business' AND up.subscription_status = 'active'
          AND EXISTS (
            SELECT 1 FROM payment_history ph
            WHERE ph.user_id = up.id
              AND ph.status = 'completed'
              AND ph.plan_type = 'business'
              AND ph.billing_period_end > NOW()
          )
        THEN 24.00
        ELSE 0
      END
    ), 0) as total_mrr,
    COALESCE(SUM(
      CASE 
        WHEN up.subscription_plan = 'pro' AND up.subscription_status = 'active'
          AND EXISTS (
            SELECT 1 FROM payment_history ph
            WHERE ph.user_id = up.id
              AND ph.status = 'completed'
              AND ph.plan_type = 'pro'
              AND ph.billing_period_end > NOW()
          )
        THEN 12.00 ELSE 0 END
    ), 0) as pro_mrr,
    COALESCE(SUM(
      CASE 
        WHEN up.subscription_plan = 'business' AND up.subscription_status = 'active'
          AND EXISTS (
            SELECT 1 FROM payment_history ph
            WHERE ph.user_id = up.id
              AND ph.status = 'completed'
              AND ph.plan_type = 'business'
              AND ph.billing_period_end > NOW()
          )
        THEN 24.00 ELSE 0 END
    ), 0) as business_mrr,
    'GBP'::VARCHAR as currency
  FROM users_profile up
  WHERE up.subscription_plan IN ('pro', 'business')
    AND up.account_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
