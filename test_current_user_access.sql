-- Direct User Query Test
-- Run this to see what the current authenticated user can see

-- 1. First, check YOUR current user ID and role
SELECT 
  auth.uid() as my_user_id,
  up.id,
  up.email,
  up.full_name,
  up.role,
  up.account_status
FROM users_profile up
WHERE up.id = auth.uid();

-- Expected: Should show your user with role = 'superadmin'

-- 2. Test the exact SELECT query that the app uses
SELECT 
  id,
  email,
  full_name,
  username,
  subscription_plan,
  subscription_status,
  role,
  account_status,
  last_active_at,
  deletion_notice_sent_at,
  scheduled_deletion_at,
  created_at,
  bookings_this_month
FROM users_profile
ORDER BY created_at DESC
LIMIT 10;

-- Expected: Should return multiple users if you're superadmin

-- 3. Check if the RLS policy is working correctly
-- This simulates what the Supabase client sees
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'superadmin' THEN 1 END) as superadmins,
  COUNT(CASE WHEN account_status = 'active' THEN 1 END) as active_users
FROM users_profile;

-- Expected: Should show counts of all users if superadmin

-- 4. If the above queries return empty, check if you're authenticated
SELECT 
  CASE 
    WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED'
    ELSE 'AUTHENTICATED as ' || auth.uid()::text
  END as auth_status;

-- 5. Test if the subquery in the RLS policy works
SELECT 
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role = 'superadmin'
  ) as is_superadmin;

-- Expected: Should return true if you're logged in as superadmin

-- 6. If still not working, temporarily disable RLS to test
-- (CAUTION: Only for debugging, re-enable after!)
-- ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;
-- 
-- Then test again:
-- SELECT COUNT(*) FROM users_profile;
-- 
-- Re-enable RLS:
-- ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
