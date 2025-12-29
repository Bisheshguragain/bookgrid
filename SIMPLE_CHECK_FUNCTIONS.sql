-- Simple diagnostic - Check what exists
-- Run this in Supabase SQL Editor

-- 1. List all functions
SELECT 
  routine_name AS function_name,
  '✅ EXISTS' AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
