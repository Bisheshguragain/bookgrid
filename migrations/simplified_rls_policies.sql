-- EMERGENCY FIX: Simplified RLS Policies
-- If the complex subquery policies aren't working, use these simpler ones

-- FIRST: Drop all existing policies
DROP POLICY IF EXISTS "Superadmin can view all users" ON users_profile;
DROP POLICY IF EXISTS "Superadmin can update all users" ON users_profile;
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can read their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users_profile;

-- OPTION 1: Simple policies (recommended for debugging)
-- Allow authenticated users to view their own profile
CREATE POLICY "users_select_own"
ON users_profile
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "users_update_own"
ON users_profile
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "users_insert_own"
ON users_profile
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- CRITICAL: Allow superadmin to SELECT all users
-- Using a simpler approach with a function
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create superadmin policies using the function
CREATE POLICY "superadmin_select_all"
ON users_profile
FOR SELECT
TO authenticated
USING (is_superadmin());

CREATE POLICY "superadmin_update_all"
ON users_profile
FOR UPDATE
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- OPTION 2: If even the function doesn't work, try this TEMPORARY bypass
-- (ONLY FOR DEBUGGING - REMOVE IN PRODUCTION!)
/*
CREATE POLICY "temp_allow_all_select"
ON users_profile
FOR SELECT
TO authenticated
USING (true);
*/

-- Verify the new policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users_profile'
ORDER BY policyname;

-- Test if it works
SELECT COUNT(*) as total_users FROM users_profile;

-- If the count > 0, it's working!
