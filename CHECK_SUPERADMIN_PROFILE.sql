-- ====================================================================
-- CHECK SUPERADMIN PROFILE AND PERMISSIONS
-- Run this to check if your superadmin account is set up correctly
-- ====================================================================

-- 1. Check your current user session
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_email;

-- 2. Check if you're in users_profile and your role
SELECT 
    id,
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status,
    account_status,
    created_at,
    last_active_at
FROM users_profile
WHERE id = auth.uid();

-- 3. If the above returns NULL or role is not 'superadmin', fix it:
-- UNCOMMENT AND RUN THIS (replace with your actual email):
-- UPDATE users_profile 
-- SET 
--     role = 'superadmin',
--     subscription_plan = 'business',
--     subscription_status = 'active'
-- WHERE email = 'your-email@example.com';

-- 4. Verify the fix worked:
SELECT 
    id,
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status
FROM users_profile
WHERE role = 'superadmin';

-- 5. Check if superadmin RLS policies exist:
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE policyname ILIKE '%superadmin%'
ORDER BY tablename, policyname;

-- 6. Test if you can see ALL users (superadmin should see all):
SELECT COUNT(*) as total_users FROM users_profile;

-- 7. Test if you can see payment_history (superadmin should see all):
SELECT COUNT(*) as total_payments FROM payment_history;

-- 8. Test if you can see account_deletion_notices (superadmin should see all):
SELECT COUNT(*) as total_notices FROM account_deletion_notices;

-- ====================================================================
-- EXPECTED RESULTS:
-- ====================================================================
-- 1. Your user ID and email should show
-- 2. Your role should be 'superadmin'
-- 3. Superadmin should be able to see ALL users, payments, and notices
-- 4. If any counts return errors, check if those tables exist
-- ====================================================================
