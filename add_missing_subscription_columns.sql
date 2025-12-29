-- ============================================
-- ADD MISSING SUBSCRIPTION COLUMNS
-- Run this first to add missing columns
-- ============================================

-- Check what columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users_profile'
ORDER BY ordinal_position;

-- Add missing subscription columns if they don't exist
DO $$ 
BEGIN
    -- Add subscription_plan column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE users_profile 
        ADD COLUMN subscription_plan TEXT DEFAULT 'free';
        
        RAISE NOTICE 'Added subscription_plan column';
    END IF;

    -- Add subscription_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE users_profile 
        ADD COLUMN subscription_status TEXT DEFAULT 'active';
        
        RAISE NOTICE 'Added subscription_status column';
    END IF;

    -- Add subscription_start_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'subscription_start_date'
    ) THEN
        ALTER TABLE users_profile 
        ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added subscription_start_date column';
    END IF;

    -- Add subscription_end_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'subscription_end_date'
    ) THEN
        ALTER TABLE users_profile 
        ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added subscription_end_date column';
    END IF;

    -- Add role column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE users_profile 
        ADD COLUMN role TEXT DEFAULT 'user';
        
        RAISE NOTICE 'Added role column';
    END IF;

    -- Add last_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'last_active'
    ) THEN
        ALTER TABLE users_profile 
        ADD COLUMN last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added last_active column';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan 
ON users_profile(subscription_plan);

CREATE INDEX IF NOT EXISTS idx_users_subscription_status 
ON users_profile(subscription_status);

CREATE INDEX IF NOT EXISTS idx_users_role 
ON users_profile(role);

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users_profile'
AND column_name IN (
    'subscription_plan', 
    'subscription_status', 
    'subscription_start_date',
    'subscription_end_date',
    'role',
    'last_active'
)
ORDER BY column_name;
