-- Emergency Fix for 500 Error on users_profile
-- The 500 error indicates a server-side issue with the query

-- Step 1: Check what's causing the error
-- Run this to see the actual error message
DO $$
DECLARE
  error_message text;
BEGIN
  PERFORM * FROM users_profile LIMIT 1;
  RAISE NOTICE 'Query succeeded';
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
  RAISE NOTICE 'Error: %', error_message;
END $$;

-- Step 2: Check for broken RLS policies
-- Sometimes the subquery in RLS can cause 500 errors
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users_profile';

-- Step 3: Temporarily disable RLS to test if that's the issue
-- (We'll re-enable it after testing)
ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT id, email, role FROM users_profile LIMIT 5;

-- If the above works, the issue is with RLS policies

-- Step 4: Re-enable RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop ALL policies and recreate them cleanly
DROP POLICY IF EXISTS "Superadmin can update all users" ON users_profile;
DROP POLICY IF EXISTS "Superadmin can view all users" ON users_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can read their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
DROP POLICY IF EXISTS "users_select_own" ON users_profile;
DROP POLICY IF EXISTS "users_update_own" ON users_profile;
DROP POLICY IF EXISTS "users_insert_own" ON users_profile;
DROP POLICY IF EXISTS "superadmin_select_all" ON users_profile;
DROP POLICY IF EXISTS "superadmin_update_all" ON users_profile;

-- Step 6: Create simple, working policies
-- Policy 1: Users can SELECT their own profile
CREATE POLICY "enable_select_own_profile"
ON users_profile
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can UPDATE their own profile
CREATE POLICY "enable_update_own_profile"
ON users_profile
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can INSERT their own profile
CREATE POLICY "enable_insert_own_profile"
ON users_profile
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 4: Superadmins can SELECT all profiles
-- Using a simpler EXISTS that shouldn't cause 500 errors
CREATE POLICY "enable_superadmin_select_all"
ON users_profile
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR -- Can see own
  EXISTS ( -- OR is superadmin
    SELECT 1 
    FROM users_profile AS admin
    WHERE admin.id = auth.uid() 
    AND admin.role = 'superadmin'
  )
);

-- Policy 5: Superadmins can UPDATE all profiles
CREATE POLICY "enable_superadmin_update_all"
ON users_profile
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM users_profile AS admin
    WHERE admin.id = auth.uid() 
    AND admin.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM users_profile AS admin
    WHERE admin.id = auth.uid() 
    AND admin.role = 'superadmin'
  )
);

-- Step 7: Verify policies are created
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users_profile'
ORDER BY policyname;

-- Step 8: Test the query that was failing
SELECT id, email, full_name, role, account_status
FROM users_profile
WHERE id = 'e2afcb8f-dd48-4da2-9e43-b987272229ce';

-- Should return your user without error

-- Step 9: Test SELECT all (as superadmin)
SELECT id, email, role FROM users_profile LIMIT 10;

-- Should return all users if you're superadmin
