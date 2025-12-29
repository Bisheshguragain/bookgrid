-- ============================================
-- FINAL PROFILE UPDATE
-- Run this to ensure your profile is complete
-- ============================================

-- First, check what columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users_profile'
AND column_name IN ('role', 'subscription_plan', 'subscription_status', 'full_name')
ORDER BY column_name;

-- 1. Update basic profile (works even if subscription columns don't exist yet)
UPDATE users_profile 
SET 
    full_name = 'Bishesh Guragain',
    updated_at = NOW()
WHERE email = 'bishesh.guragain@gmail.com';

-- 2. Update role if column exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' AND column_name = 'role'
    ) THEN
        UPDATE users_profile 
        SET role = 'superadmin'
        WHERE email = 'bishesh.guragain@gmail.com';
        
        RAISE NOTICE 'Updated role to superadmin';
    ELSE
        RAISE WARNING 'Role column does not exist - run add_missing_subscription_columns.sql first';
    END IF;
END $$;

-- 3. Update subscription fields if columns exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' AND column_name = 'subscription_plan'
    ) THEN
        UPDATE users_profile 
        SET 
            subscription_plan = 'business',
            subscription_status = 'active',
            subscription_start_date = NOW()
        WHERE email = 'bishesh.guragain@gmail.com';
        
        RAISE NOTICE 'Updated subscription to business plan';
    ELSE
        RAISE WARNING 'Subscription columns do not exist - run add_missing_subscription_columns.sql first';
    END IF;
END $$;

-- 4. Verify the update (select only columns that exist)
SELECT 
    id,
    email,
    full_name,
    created_at,
    updated_at
FROM users_profile 
WHERE email = 'bishesh.guragain@gmail.com';

-- 5. If all columns exist, show complete profile
DO $$ 
DECLARE
    v_result RECORD;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name IN ('role', 'subscription_plan', 'subscription_status')
        GROUP BY table_name
        HAVING COUNT(*) = 3
    ) THEN
        FOR v_result IN 
            SELECT 
                id,
                email,
                full_name,
                role,
                subscription_plan,
                subscription_status,
                created_at,
                updated_at
            FROM users_profile 
            WHERE email = 'bishesh.guragain@gmail.com'
        LOOP
            RAISE NOTICE 'Complete Profile:';
            RAISE NOTICE '  Email: %', v_result.email;
            RAISE NOTICE '  Name: %', v_result.full_name;
            RAISE NOTICE '  Role: %', v_result.role;
            RAISE NOTICE '  Plan: %', v_result.subscription_plan;
            RAISE NOTICE '  Status: %', v_result.subscription_status;
        END LOOP;
    END IF;
END $$;
