-- ============================================================================
-- ENSURE USERNAME UNIQUENESS
-- ============================================================================
-- This script adds a unique constraint on the username column to prevent
-- duplicate usernames at the database level.
-- ============================================================================

-- First, check if there are any duplicate usernames (should be none)
SELECT username, COUNT(*) as count
FROM users_profile
WHERE username IS NOT NULL AND username != ''
GROUP BY username
HAVING COUNT(*) > 1;

-- Add unique constraint on username (case-insensitive)
-- First, create a unique index on lowercase username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_profile_username_unique 
ON users_profile (LOWER(username)) 
WHERE username IS NOT NULL AND username != '';

-- Add a check constraint for username format
ALTER TABLE users_profile
ADD CONSTRAINT chk_username_format 
CHECK (
  username IS NULL 
  OR username = '' 
  OR (
    LENGTH(username) >= 3 
    AND LENGTH(username) <= 30 
    AND username ~ '^[a-zA-Z0-9_-]+$'
  )
);

-- Create a function to validate username uniqueness (called from RPC if needed)
CREATE OR REPLACE FUNCTION public.check_username_available(p_username TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_username IS NULL OR p_username = '' OR LENGTH(p_username) < 3 THEN
        RETURN TRUE;
    END IF;
    
    RETURN NOT EXISTS (
        SELECT 1 FROM users_profile
        WHERE LOWER(username) = LOWER(p_username)
        AND (p_user_id IS NULL OR id != p_user_id)
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_username_available TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_available TO anon;

-- ============================================================================
-- USAGE EXAMPLE
-- ============================================================================
-- Check if a username is available:
-- SELECT check_username_available('desired-username', 'current-user-id');
-- Returns TRUE if available, FALSE if taken
