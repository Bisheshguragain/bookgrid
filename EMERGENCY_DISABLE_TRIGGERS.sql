-- =====================================================
-- EMERGENCY FIX: DISABLE BROKEN TRIGGERS
-- =====================================================
-- This will temporarily disable all triggers on users_profile
-- so we can identify which one is broken

-- Step 1: List all triggers (so we know what we're disabling)
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users_profile';

-- Step 2: Disable each trigger one by one
-- (We'll uncomment these as needed based on what we find)

-- Disable update_updated_at trigger if it exists
-- ALTER TABLE users_profile DISABLE TRIGGER update_users_profile_updated_at;

-- Disable any other triggers found
-- ALTER TABLE users_profile DISABLE TRIGGER [trigger_name_here];

-- Step 3: Test if users_profile works now
SELECT 
  'TEST AFTER DISABLING TRIGGERS' as test_name,
  id,
  email,
  full_name,
  role,
  subscription_plan
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';

-- Step 4: If it works, we'll re-enable or fix the broken trigger
-- ALTER TABLE users_profile ENABLE TRIGGER [trigger_name_here];
