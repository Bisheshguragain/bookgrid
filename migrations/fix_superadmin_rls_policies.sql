-- Fix SuperAdmin Access to View All Users
-- This adds RLS policies to allow superadmins to view all user data

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Superadmin can view all users" ON users_profile;
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON users_profile
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow superadmins to view ALL users
CREATE POLICY "Superadmin can view all users"
ON users_profile
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role = 'superadmin'
  )
);

-- Allow superadmins to update any user
DROP POLICY IF EXISTS "Superadmin can update all users" ON users_profile;

CREATE POLICY "Superadmin can update all users"
ON users_profile
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role = 'superadmin'
  )
);

-- Verify the policies were created
SELECT 
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users_profile'
ORDER BY policyname;
