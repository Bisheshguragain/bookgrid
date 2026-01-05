-- AUDIT: Check Signup and Email Verification Flow
-- Run this in Supabase SQL Editor to diagnose signup issues

-- 1. Check if email confirmations are enabled in Supabase
-- (This needs to be checked in Supabase Dashboard > Authentication > Settings)
-- Look for: "Enable email confirmations" should be ON

-- 2. Check users waiting for verification
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if there are orphaned profiles (profile created but email not confirmed)
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.account_status,
  up.created_at,
  au.email_confirmed_at,
  au.confirmed_at
FROM users_profile up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.email_confirmed_at IS NULL
  OR au.confirmed_at IS NULL
ORDER BY up.created_at DESC
LIMIT 10;

-- 4. Check for any RLS policies blocking profile creation
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
WHERE tablename = 'users_profile'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- 5. Verify the trigger for profile creation exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users_profile';
