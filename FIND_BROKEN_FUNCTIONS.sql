-- =====================================================
-- FIND BROKEN FUNCTIONS/TRIGGERS ON USERS_PROFILE
-- =====================================================

-- 1. List all triggers on users_profile
SELECT 
  '1. TRIGGERS ON USERS_PROFILE' as check_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users_profile'
ORDER BY trigger_name;

-- 2. List all functions that might be referenced
SELECT 
  '2. FUNCTIONS THAT MIGHT BE BROKEN' as check_name,
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname IN (
  'handle_new_user',
  'update_updated_at',
  'check_user_limits',
  'increment_booking_count'
)
ORDER BY proname;

-- 3. Try to select from users_profile directly
-- This will show us the actual error
SELECT 
  '3. DIRECT QUERY TEST' as check_name,
  id,
  email,
  full_name,
  role
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com'
LIMIT 1;

-- 4. Check for any RLS policies that might be causing issues
SELECT 
  '4. RLS POLICIES ON USERS_PROFILE' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users_profile';
