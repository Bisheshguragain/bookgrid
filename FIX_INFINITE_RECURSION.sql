-- =====================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- =====================================================
-- This will remove the broken RLS policies and recreate correct ones

-- Step 1: List all current policies to see which one is broken
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users_profile';

-- Step 2: DROP ALL RLS POLICIES on users_profile
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_profile;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON users_profile;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON users_profile;
DROP POLICY IF EXISTS "Superadmin full access to all profiles" ON users_profile;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users_profile;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users_profile;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users_profile;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON users_profile;

-- Step 3: CREATE CORRECT RLS POLICIES (without recursion)

-- Policy 1: Users can SELECT their own profile
CREATE POLICY "Users can view own profile"
ON users_profile FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can UPDATE their own profile
CREATE POLICY "Users can update own profile"
ON users_profile FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can INSERT their own profile (for signup)
CREATE POLICY "Users can insert own profile"
ON users_profile FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 4: NO SUPERADMIN POLICY FOR NOW (to avoid recursion)
-- We'll add this later after testing basic policies work

-- Step 4: TEST if it works
SELECT * FROM users_profile WHERE id = auth.uid();

-- Step 5: Verify no infinite recursion
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users_profile'
ORDER BY policyname;
