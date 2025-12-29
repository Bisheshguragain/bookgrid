-- ============================================
-- SIMPLE PROFILE UPDATE
-- Direct update without DO blocks
-- ============================================

-- Update all fields in one go
UPDATE users_profile 
SET 
    full_name = 'Bishesh Guragain',
    role = 'superadmin',
    subscription_plan = 'business',
    subscription_status = 'active',
    subscription_start_date = NOW(),
    updated_at = NOW()
WHERE email = 'bishesh.guragain@gmail.com';

-- Verify the update
SELECT 
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status,
    subscription_start_date
FROM users_profile 
WHERE email = 'bishesh.guragain@gmail.com';
