-- ============================================
-- CHECK WHAT TABLES ACTUALLY EXIST
-- Run this FIRST before any fixes
-- ============================================

-- Check if payment_history table exists
SELECT 
  'payment_history' AS table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'payment_history'
    ) THEN '✅ EXISTS'
    ELSE '❌ DOES NOT EXIST'
  END AS status;

-- Check if account_deletion_notices table exists
SELECT 
  'account_deletion_notices' AS table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'account_deletion_notices'
    ) THEN '✅ EXISTS'
    ELSE '❌ DOES NOT EXIST'
  END AS status;

-- Check if event_types table exists
SELECT 
  'event_types' AS table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'event_types'
    ) THEN '✅ EXISTS'
    ELSE '❌ DOES NOT EXIST'
  END AS status;

-- Check if users_profile table exists
SELECT 
  'users_profile' AS table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users_profile'
    ) THEN '✅ EXISTS'
    ELSE '❌ DOES NOT EXIST'
  END AS status;

-- Check if bookings table exists
SELECT 
  'bookings' AS table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'bookings'
    ) THEN '✅ EXISTS'
    ELSE '❌ DOES NOT EXIST'
  END AS status;

-- List ALL tables that actually exist in public schema
SELECT '
╔════════════════════════════════════════════════════════════════╗
║                    ALL EXISTING TABLES                         ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

SELECT 
  table_name,
  '✅ EXISTS' AS status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Show all columns in users_profile (if it exists)
SELECT '
╔════════════════════════════════════════════════════════════════╗
║              USERS_PROFILE COLUMNS (if exists)                 ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users_profile'
ORDER BY ordinal_position;

-- Show all existing RLS policies
SELECT '
╔════════════════════════════════════════════════════════════════╗
║                    ALL EXISTING RLS POLICIES                   ║
╚════════════════════════════════════════════════════════════════╝
' AS header;

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
