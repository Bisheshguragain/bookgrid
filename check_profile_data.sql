-- Diagnose: Check Your Actual Profile Data
-- Run each query separately to see what's happening

-- Query 1: Check if the user exists and what data it has
SELECT 
  id,
  email,
  full_name,
  CASE 
    WHEN full_name IS NULL THEN 'NULL'
    WHEN full_name = '' THEN 'EMPTY STRING'
    ELSE 'HAS VALUE: ' || full_name
  END as full_name_status,
  username,
  role,
  account_status,
  created_at
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';

-- Query 2: If the above returns nothing, check all users
SELECT COUNT(*) as total_users FROM users_profile;

-- Query 3: Check if user exists with that ID
SELECT 
  id,
  email,
  full_name,
  role
FROM users_profile
WHERE id = 'e2afcb8f-dd48-4da2-9e43-b987272229ce';

-- Query 4: If full_name is actually set, try updating anyway
UPDATE users_profile
SET 
  full_name = 'Bishesh Guragain',
  username = COALESCE(username, 'bishesh'),
  updated_at = NOW()
WHERE id = 'e2afcb8f-dd48-4da2-9e43-b987272229ce'
RETURNING id, email, full_name, username, role;

-- Query 5: Check all columns to see what exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users_profile'
  AND column_name IN ('id', 'email', 'full_name', 'username', 'role')
ORDER BY column_name;
