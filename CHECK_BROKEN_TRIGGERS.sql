-- =====================================================
-- CHECK FOR BROKEN FUNCTION REFERENCES
-- =====================================================

-- This script will identify functions that are referenced but don't exist

-- 1. Disable all triggers temporarily to test if that's the issue
-- (DON'T RUN THIS YET - just checking what triggers exist first)

-- 2. List triggers and their referenced functions
SELECT 
  t.trigger_name,
  t.event_object_table as table_name,
  t.action_timing,
  t.event_manipulation as event,
  t.action_statement,
  -- Try to find if the function exists
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = SPLIT_PART(SPLIT_PART(t.action_statement, 'EXECUTE FUNCTION ', 2), '(', 1)
    ) THEN '✅ Function exists'
    ELSE '❌ Function MISSING'
  END as function_status
FROM information_schema.triggers t
WHERE t.event_object_table IN ('users_profile', 'bookings', 'event_types')
ORDER BY t.event_object_table, t.trigger_name;

-- 3. List all functions and check if they're valid
SELECT 
  proname as function_name,
  pronamespace::regnamespace as schema_name,
  CASE 
    WHEN prosrc IS NOT NULL THEN '✅ Has source code'
    ELSE '❌ No source code'
  END as status,
  CASE 
    WHEN prorettype = 0 THEN 'void'
    ELSE prorettype::regtype::text
  END as return_type
FROM pg_proc
WHERE pronamespace::regnamespace::text = 'public'
  AND (
    proname LIKE '%user%' OR 
    proname LIKE '%booking%' OR
    proname LIKE '%subscription%' OR
    proname = 'update_updated_at'
  )
ORDER BY proname;
