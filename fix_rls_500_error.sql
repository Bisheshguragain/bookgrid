-- ============================================
-- FIX 500 ERROR - RLS POLICIES
-- This will fix the permission denied errors
-- ============================================

-- Step 1: Drop all existing RLS policies on users_profile
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users_profile;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users_profile;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users_profile;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Users can read their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;

-- Step 2: Create simple, working RLS policies
CREATE POLICY "allow_select_own_profile"
ON users_profile
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_insert_own_profile"
ON users_profile
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_own_profile"
ON users_profile
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_delete_own_profile"
ON users_profile
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Step 3: Add superadmin policies
CREATE POLICY "superadmin_select_all"
ON users_profile
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM users_profile up 
    WHERE up.id = auth.uid() 
    AND up.role = 'superadmin'
  )
);

CREATE POLICY "superadmin_update_all"
ON users_profile
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM users_profile up 
    WHERE up.id = auth.uid() 
    AND up.role = 'superadmin'
  )
);

CREATE POLICY "superadmin_delete_all"
ON users_profile
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM users_profile up 
    WHERE up.id = auth.uid() 
    AND up.role = 'superadmin'
  )
);

-- Step 4: Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'users_profile'
ORDER BY policyname;

-- Step 5: Test if you can now read your profile
SELECT 
    id,
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status
FROM users_profile 
WHERE id = auth.uid();
