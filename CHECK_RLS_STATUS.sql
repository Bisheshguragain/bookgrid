-- =====================================================
-- SIMPLE TEST: Check if RLS is the issue
-- =====================================================

-- 1. Check if RLS is enabled on users_profile
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'users_profile';

-- 2. List ALL RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users_profile';

-- 3. TEMPORARY FIX: Disable RLS to test
-- (Only run this if you want to test if RLS is the issue)
-- ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;

-- 4. Test query again
SELECT * FROM users_profile WHERE email = 'bishesh.guragain@gmail.com';

-- 5. Re-enable RLS after testing
-- ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
