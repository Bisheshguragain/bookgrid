-- ============================================================
-- SUBSCRIPTION MANAGEMENT SQL
-- Handles subscription cancellations, downgrades, and auto-revert
-- ============================================================

-- ============================================================
-- 1. Function to auto-revert cancelled subscriptions to free
-- This should be run by a scheduled job (e.g., cron, Supabase Edge Function)
-- ============================================================

CREATE OR REPLACE FUNCTION revert_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  reverted_count INTEGER := 0;
BEGIN
  -- Find all cancelled subscriptions that have passed their end date
  UPDATE users_profile
  SET 
    subscription_plan = 'free',
    subscription_status = 'active',
    subscription_end_date = NULL
  WHERE 
    subscription_status = 'cancelled'
    AND subscription_end_date IS NOT NULL
    AND subscription_end_date < NOW();
  
  GET DIAGNOSTICS reverted_count = ROW_COUNT;
  
  -- Log the action
  IF reverted_count > 0 THEN
    RAISE NOTICE 'Reverted % expired subscriptions to free plan', reverted_count;
  END IF;
  
  RETURN reverted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. Function to handle subscription plan changes
-- Validates plan changes and applies them correctly
-- ============================================================

CREATE OR REPLACE FUNCTION change_subscription_plan(
  p_user_id UUID,
  p_new_plan TEXT,
  p_change_type TEXT -- 'upgrade', 'downgrade', or 'cancel'
)
RETURNS JSONB AS $$
DECLARE
  v_current_plan TEXT;
  v_current_status TEXT;
  v_plan_hierarchy JSONB := '{"free": 0, "pro": 1, "business": 2}'::JSONB;
  v_result JSONB;
BEGIN
  -- Get current plan
  SELECT subscription_plan, subscription_status
  INTO v_current_plan, v_current_status
  FROM users_profile
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Validate plan change
  IF p_change_type = 'upgrade' THEN
    -- Ensure it's actually an upgrade
    IF (v_plan_hierarchy->>p_new_plan)::INT <= (v_plan_hierarchy->>v_current_plan)::INT THEN
      RETURN jsonb_build_object('success', false, 'error', 'This is not an upgrade');
    END IF;
    
    -- Apply upgrade immediately
    UPDATE users_profile
    SET 
      subscription_plan = p_new_plan,
      subscription_status = 'active',
      subscription_start_date = NOW(),
      subscription_end_date = NULL
    WHERE id = p_user_id;
    
    v_result := jsonb_build_object(
      'success', true, 
      'message', format('Upgraded from %s to %s', v_current_plan, p_new_plan),
      'effective_date', NOW()
    );
    
  ELSIF p_change_type = 'downgrade' THEN
    -- Ensure it's actually a downgrade
    IF (v_plan_hierarchy->>p_new_plan)::INT >= (v_plan_hierarchy->>v_current_plan)::INT THEN
      RETURN jsonb_build_object('success', false, 'error', 'This is not a downgrade');
    END IF;
    
    -- Apply downgrade immediately (in production, might want to defer to end of billing)
    UPDATE users_profile
    SET 
      subscription_plan = p_new_plan,
      subscription_status = 'active',
      subscription_start_date = NOW(),
      subscription_end_date = NULL
    WHERE id = p_user_id;
    
    v_result := jsonb_build_object(
      'success', true, 
      'message', format('Downgraded from %s to %s', v_current_plan, p_new_plan),
      'effective_date', NOW()
    );
    
  ELSIF p_change_type = 'cancel' THEN
    IF v_current_plan = 'free' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Already on free plan');
    END IF;
    
    -- Schedule cancellation for end of billing period (assume 30 days)
    UPDATE users_profile
    SET 
      subscription_status = 'cancelled',
      subscription_end_date = NOW() + INTERVAL '30 days'
    WHERE id = p_user_id;
    
    v_result := jsonb_build_object(
      'success', true, 
      'message', 'Subscription will be cancelled at end of billing period',
      'effective_date', NOW() + INTERVAL '30 days'
    );
    
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid change type');
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. Function to deactivate excess event types on downgrade
-- Keeps only the allowed number when plan limits decrease
-- ============================================================

CREATE OR REPLACE FUNCTION enforce_event_type_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_max_event_types INTEGER;
  v_current_count INTEGER;
  v_excess_count INTEGER;
BEGIN
  -- Only trigger on plan changes
  IF OLD.subscription_plan = NEW.subscription_plan THEN
    RETURN NEW;
  END IF;
  
  -- Get the limit for the new plan
  SELECT max_event_types INTO v_max_event_types
  FROM subscription_plans
  WHERE name = NEW.subscription_plan;
  
  -- If unlimited (-1), no action needed
  IF v_max_event_types = -1 OR v_max_event_types IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count current active event types
  SELECT COUNT(*) INTO v_current_count
  FROM event_types
  WHERE user_id = NEW.id AND is_active = true;
  
  -- If over limit, deactivate excess (oldest first)
  IF v_current_count > v_max_event_types THEN
    v_excess_count := v_current_count - v_max_event_types;
    
    -- Deactivate oldest excess event types
    UPDATE event_types
    SET is_active = false
    WHERE id IN (
      SELECT id FROM event_types
      WHERE user_id = NEW.id AND is_active = true
      ORDER BY created_at ASC
      LIMIT v_excess_count
    );
    
    RAISE NOTICE 'Deactivated % event types for user % due to plan downgrade',
      v_excess_count, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for enforcing limits on plan change
DROP TRIGGER IF EXISTS enforce_event_limits_on_plan_change ON users_profile;
CREATE TRIGGER enforce_event_limits_on_plan_change
  AFTER UPDATE OF subscription_plan ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION enforce_event_type_limits();

-- ============================================================
-- 4. View for subscription analytics (admin use)
-- ============================================================

CREATE OR REPLACE VIEW subscription_analytics AS
SELECT 
  subscription_plan,
  subscription_status,
  COUNT(*) as user_count,
  COUNT(*) FILTER (WHERE subscription_status = 'cancelled') as pending_cancellations,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week
FROM users_profile
GROUP BY subscription_plan, subscription_status
ORDER BY subscription_plan;

-- ============================================================
-- 5. Function to get subscription metrics
-- ============================================================

CREATE OR REPLACE FUNCTION get_subscription_metrics()
RETURNS JSONB AS $$
DECLARE
  v_metrics JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM users_profile),
    'free_users', (SELECT COUNT(*) FROM users_profile WHERE subscription_plan = 'free'),
    'pro_users', (SELECT COUNT(*) FROM users_profile WHERE subscription_plan = 'pro'),
    'business_users', (SELECT COUNT(*) FROM users_profile WHERE subscription_plan = 'business'),
    'pending_cancellations', (SELECT COUNT(*) FROM users_profile WHERE subscription_status = 'cancelled'),
    'mrr_estimate', (
      SELECT 
        (SELECT COUNT(*) FROM users_profile WHERE subscription_plan = 'pro' AND subscription_status = 'active') * 
        (SELECT price_monthly FROM subscription_plans WHERE name = 'pro') +
        (SELECT COUNT(*) FROM users_profile WHERE subscription_plan = 'business' AND subscription_status = 'active') * 
        (SELECT price_monthly FROM subscription_plans WHERE name = 'business')
    )
  ) INTO v_metrics;
  
  RETURN v_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. Grant permissions
-- ============================================================

-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION change_subscription_plan(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_metrics() TO authenticated;

-- Only service role can run the scheduled revert function
GRANT EXECUTE ON FUNCTION revert_expired_subscriptions() TO service_role;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check current subscription distribution
-- SELECT * FROM subscription_analytics;

-- Check for pending cancellations
-- SELECT id, email, subscription_plan, subscription_status, subscription_end_date
-- FROM users_profile
-- WHERE subscription_status = 'cancelled';

-- Test the revert function (dry run - just view who would be affected)
-- SELECT id, email, subscription_plan, subscription_status, subscription_end_date
-- FROM users_profile
-- WHERE subscription_status = 'cancelled'
--   AND subscription_end_date IS NOT NULL
--   AND subscription_end_date < NOW();

COMMENT ON FUNCTION revert_expired_subscriptions IS 'Automatically reverts cancelled subscriptions to free plan after billing period ends. Should be run by a scheduled job.';
COMMENT ON FUNCTION change_subscription_plan IS 'Handles subscription plan changes with validation';
COMMENT ON FUNCTION enforce_event_type_limits IS 'Trigger function to deactivate excess event types when user downgrades';
