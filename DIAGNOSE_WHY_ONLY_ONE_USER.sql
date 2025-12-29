-- ═══════════════════════════════════════════════════════════════
-- DIAGNOSE WHY YOU ONLY SEE 1 USER
-- ═══════════════════════════════════════════════════════════════

-- CHECK 1: How many users exist in total? (Bypassing RLS)
SELECT 
  'Total users in database (RLS bypassed):' AS info;

-- This query runs as superuser, bypassing RLS
SELECT COUNT(*) AS total_users_in_database
FROM auth.users;

-- CHECK 2: How many profiles exist?
SELECT 
  'Total profiles in users_profile:' AS info;

-- Count in users_profile table
SELECT 
  COUNT(*) AS total_profiles,
  COUNT(*) FILTER (WHERE role = 'superadmin') AS superadmin_count,
  COUNT(*) FILTER (WHERE role = 'user') AS regular_user_count,
  COUNT(*) FILTER (WHERE role IS NULL) AS no_role_count
FROM users_profile;

-- CHECK 3: Show YOUR user details
SELECT 
  'YOUR user details:' AS info;

SELECT 
  id,
  email,
  full_name,
  role,
  subscription_plan,
  subscription_status,
  created_at
FROM users_profile
WHERE id = auth.uid();

-- CHECK 4: Check the superadmin_select_all policy
SELECT 
  'Checking superadmin_select_all policy:' AS info;

SELECT 
  policyname,
  cmd,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'users_profile'
AND policyname = 'superadmin_select_all';

-- CHECK 5: Test if you are recognized as superadmin
SELECT 
  'Am I recognized as superadmin?' AS test;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'superadmin'
    ) THEN '✅ YES - You are superadmin'
    ELSE '❌ NO - You are NOT superadmin'
  END AS superadmin_check;

-- CHECK 6: List all users (what you can see via RLS)
SELECT 
  'All users you can see (via RLS):' AS info;

SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM users_profile
ORDER BY created_at;
