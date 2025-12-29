-- ============================================
-- CHECK COMPLETE PROFILE
-- Verify all fields including role and subscription
-- ============================================

SELECT 
    id,
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    last_active,
    created_at,
    updated_at
FROM users_profile 
WHERE email = 'bishesh.guragain@gmail.com';
