-- ============================================================================
-- 🔧 BOOKGRID RLS SECURITY FIXES - APPLY AFTER AUDIT
-- ============================================================================
-- ⚠️ WARNING: This script WILL MODIFY your database!
-- Only run AFTER reviewing the RLS_AUDIT_READ_ONLY.sql results.
-- Test in a staging environment first!
-- Date: December 2024
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE PERFORMANCE INDEXES (SAFE - IF NOT EXISTS)
-- ============================================================================
-- These are safe to run and will improve RLS policy performance

CREATE INDEX IF NOT EXISTS idx_users_profile_id ON public.users_profile(id);
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON public.users_profile(role);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_type_id ON public.bookings(event_type_id);
CREATE INDEX IF NOT EXISTS idx_event_types_user_id ON public.event_types(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_booking_id ON public.reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_rules_user_id ON public.availability_rules(user_id);

-- ============================================================================
-- STEP 2: STRENGTHEN USERS_PROFILE INSERT POLICY
-- ============================================================================
-- Prevents users from creating profiles with elevated roles
-- Only allows role = NULL or role = 'user' on creation (unless superadmin)

-- First, check if a conflicting policy exists and drop it
-- UNCOMMENT the DROP statement if you have a conflicting policy
-- DROP POLICY IF EXISTS "users_profile_insert_no_role" ON public.users_profile;
-- DROP POLICY IF EXISTS "Users can create their own profile" ON public.users_profile;

CREATE POLICY "users_profile_insert_role_protected" ON public.users_profile
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User can only create their own profile
    id = auth.uid() 
    -- AND role must be NULL or 'user' (not 'superadmin' or anything else)
    AND (role IS NULL OR role = 'user')
  );

-- ============================================================================
-- STEP 3: STRENGTHEN USERS_PROFILE UPDATE POLICY (ROLE PROTECTION)
-- ============================================================================
-- Prevents non-superadmins from changing their role
-- This is the most critical security fix

-- First, check if the old policy exists and drop it
-- UNCOMMENT if you have the old complex policy
-- DROP POLICY IF EXISTS "prevent_role_self_elevation" ON public.users_profile;
-- DROP POLICY IF EXISTS "users_cannot_change_role_unless_superadmin" ON public.users_profile;

CREATE POLICY "users_profile_update_role_protected" ON public.users_profile
  FOR UPDATE
  TO authenticated
  USING (
    -- Can only update your own row
    id = auth.uid()
  )
  WITH CHECK (
    -- Must be updating your own row
    id = auth.uid() 
    AND (
      -- Either: role stays the same (IS NOT DISTINCT FROM handles NULLs)
      role IS NOT DISTINCT FROM (SELECT role FROM users_profile WHERE id = auth.uid())
      -- Or: you are a superadmin (can change anything)
      OR EXISTS (
        SELECT 1 FROM users_profile up 
        WHERE up.id = auth.uid() AND up.role = 'superadmin'
      )
    )
  );

-- ============================================================================
-- STEP 4: BOOKINGS INSERT POLICY OPTIONS
-- ============================================================================
-- Choose ONE of the options below based on your needs:

-- OPTION A: For authenticated users only (user_id must match auth.uid())
-- Use this if ONLY logged-in users can create bookings

-- CREATE POLICY "bookings_insert_authenticated_only" ON public.bookings
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (user_id = auth.uid());

-- OPTION B: Allow public bookings (anon can create bookings for hosts)
-- Use this if guests can book without logging in
-- This is likely what you need for BookGrid's public booking feature

-- Note: Your existing policy should already allow this.
-- If you need to add it:

-- CREATE POLICY "bookings_insert_public" ON public.bookings
--   FOR INSERT
--   TO anon, authenticated
--   WITH CHECK (
--     -- For authenticated users: can book with themselves as host
--     (auth.uid() IS NOT NULL AND user_id = auth.uid())
--     -- For anon: can create booking for any valid host (event owner)
--     OR (auth.uid() IS NULL AND EXISTS (
--       SELECT 1 FROM event_types et 
--       WHERE et.user_id = user_id AND et.is_active = true
--     ))
--   );

-- ============================================================================
-- STEP 5: TRIGGER TO AUTO-SET user_id (OPTIONAL - DEFENSE IN DEPTH)
-- ============================================================================
-- This trigger automatically sets user_id to auth.uid() on insert
-- Provides extra protection even if policy is misconfigured
-- NOTE: Only use for authenticated user's own resources, NOT for public bookings

-- CREATE OR REPLACE FUNCTION public.set_user_id_on_insert()
-- RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
-- BEGIN
--   -- Only set if user is authenticated and user_id matches
--   IF auth.uid() IS NOT NULL THEN
--     NEW.user_id := auth.uid();
--   END IF;
--   RETURN NEW;
-- END;
-- $$;

-- CREATE TRIGGER set_user_id_trigger
--   BEFORE INSERT ON public.event_types
--   FOR EACH ROW EXECUTE FUNCTION public.set_user_id_on_insert();

-- CREATE TRIGGER set_user_id_trigger
--   BEFORE INSERT ON public.availability_rules
--   FOR EACH ROW EXECUTE FUNCTION public.set_user_id_on_insert();

-- ============================================================================
-- STEP 6: REVOKE UNNECESSARY PERMISSIONS FROM ANON
-- ============================================================================
-- Review what anon can access and restrict if needed

-- Check current grants first (read-only):
-- SELECT grantee, table_name, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_schema = 'public' AND grantee = 'anon';

-- Example: Revoke anon access to sensitive tables
-- REVOKE ALL ON public.users_profile FROM anon;
-- REVOKE ALL ON public.reminders FROM anon;
-- REVOKE ALL ON public.availability_rules FROM anon;

-- ============================================================================
-- STEP 7: VERIFY SECURITY DEFINER FUNCTIONS
-- ============================================================================
-- List all SECURITY DEFINER functions and review them:

-- SELECT p.proname AS function_name, pg_get_functiondef(p.oid) AS definition
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' AND p.prosecdef = true;

-- If any SECURITY DEFINER functions should be restricted:
-- REVOKE EXECUTE ON FUNCTION public.function_name FROM anon;
-- REVOKE EXECUTE ON FUNCTION public.function_name FROM authenticated;
-- GRANT EXECUTE ON FUNCTION public.function_name TO service_role;

-- ============================================================================
-- VERIFICATION TESTS (RUN AFTER APPLYING FIXES)
-- ============================================================================

-- Test 1: Verify role protection (should fail for non-superadmin)
-- UPDATE users_profile SET role = 'superadmin' WHERE id = auth.uid();
-- Expected: ERROR or no rows updated

-- Test 2: Verify profile creation (should fail with elevated role)
-- INSERT INTO users_profile (id, email, role) VALUES (auth.uid(), 'test@test.com', 'superadmin');
-- Expected: ERROR

-- Test 3: Verify booking user_id (authenticated)
-- INSERT INTO bookings (user_id, event_type_id, ...) VALUES ('some-other-uuid', ...);
-- Expected: ERROR or user_id overwritten by trigger

-- ============================================================================
-- ROLLBACK COMMANDS (IF SOMETHING BREAKS)
-- ============================================================================
-- Save these in case you need to undo changes:

-- DROP POLICY IF EXISTS "users_profile_insert_role_protected" ON public.users_profile;
-- DROP POLICY IF EXISTS "users_profile_update_role_protected" ON public.users_profile;
-- DROP POLICY IF EXISTS "bookings_insert_authenticated_only" ON public.bookings;

-- DROP INDEX IF EXISTS idx_users_profile_role;
-- (other indexes are safe to keep)

-- ============================================================================
-- END OF FIXES
-- ============================================================================
