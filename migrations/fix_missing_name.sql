-- Check and Fix Missing Full Name
-- This checks if your full_name exists and adds it if missing

-- Step 1: Check your current profile data
SELECT 
  id,
  email,
  full_name,
  username,
  role,
  account_status,
  subscription_plan
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';

-- If full_name is NULL or empty, update it:
UPDATE users_profile
SET 
  full_name = 'Bishesh Guragain',
  username = 'bishesh'
WHERE email = 'bishesh.guragain@gmail.com';

-- Verify the update
SELECT 
  id,
  email,
  full_name,
  username,
  role,
  account_status
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';

-- Expected result:
-- full_name: Bishesh Guragain
-- role: superadmin
-- account_status: active
