-- ============================================
-- COMPLETE RLS RESET - NUCLEAR OPTION
-- This removes ALL policies and creates fresh ones
-- ============================================

-- Step 1: Disable RLS temporarily to clean up
ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (including duplicates)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users_profile'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users_profile', r.policyname);
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- Step 4: Create SIMPLE policies that definitely work
-- Allow authenticated users to read their own profile
CREATE POLICY "users_select_own"
ON users_profile
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow authenticated users to update their own profile  
CREATE POLICY "users_update_own"
ON users_profile
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow authenticated users to insert their own profile
CREATE POLICY "users_insert_own"
ON users_profile
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Step 5: Test if basic policy works
SELECT 
    id,
    email,
    full_name,
    role,
    subscription_plan
FROM users_profile 
WHERE id = auth.uid();

-- Step 6: Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users_profile';
