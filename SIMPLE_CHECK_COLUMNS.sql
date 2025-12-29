-- Simple diagnostic - Check users_profile columns
-- Run this in Supabase SQL Editor

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users_profile'
ORDER BY ordinal_position;
