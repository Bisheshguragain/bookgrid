-- Debug Script for SuperAdmin Users Not Showing
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if users exist in the database
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
  created_at
FROM users_profile
ORDER BY created_at DESC
LIMIT 10;

-- Expected: You should see at least one user (bishesh.guragain@gmail.com)

-- 2. Check if the logged-in user has superadmin role
SELECT 
  id,
  email,
  full_name,
  role,
  account_status
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';

-- Expected: role = 'superadmin', account_status = 'active'

-- 3. Check RLS policies on users_profile table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users_profile';

-- Expected: Should see policies that allow superadmin to SELECT all users

-- 4. Check if RLS is enabled on users_profile
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users_profile';

-- Expected: rowsecurity = true (RLS is enabled)

-- 5. Test the exact query that the app is using
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
LIMIT 50;

-- Expected: Should return users if RLS allows it

-- 6. Check current user's role (this simulates what Supabase sees)
SELECT current_setting('request.jwt.claims', true)::json->>'role' AS jwt_role;

-- 7. If RLS is blocking, you might need to add a policy like this:
-- (Don't run this unless needed - check first!)
/*
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
*/

-- 8. Alternative: Check if we need to use service role
-- If RLS is too strict, superadmin queries might need to bypass RLS
-- This would require using the service role key (not recommended for client-side)

-- 9. Count total users
SELECT COUNT(*) as total_users FROM users_profile;

-- 10. Check if all required columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users_profile'
AND column_name IN (
  'id',
  'email',
  'full_name',
  'username',
  'subscription_plan',
  'subscription_status',
  'role',
  'account_status',
  'last_active_at',
  'deletion_notice_sent_at',
  'scheduled_deletion_at',
  'created_at',
  'bookings_this_month'
)
ORDER BY column_name;

-- Expected: All 13 columns should exist
