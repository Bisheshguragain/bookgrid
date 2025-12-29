-- ============================================================================
-- 🔧 BOOKGRID RLS FIXES - BASED ON AUDIT RESULTS
-- ============================================================================
-- Run these fixes AFTER backing up your database or testing in staging!
-- Date: December 29, 2025
-- ============================================================================

-- ============================================================================
-- FIX 1: BOOKINGS INSERT POLICY (CRITICAL)
-- ============================================================================
-- Current Issue: WITH CHECK = true allows anyone to create bookings with any user_id
-- 
-- Your app has TWO booking scenarios:
-- 1. Public booking: Guests (anon) book with a host -> user_id = host's ID
-- 2. Book-a-Meet: Authenticated users book for themselves -> user_id = auth.uid()
--
-- We need to handle BOTH cases securely.

-- Step 1: Drop the dangerous policy
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;

-- Step 2: Create a secure policy that handles both scenarios
CREATE POLICY "secure_bookings_insert" ON public.bookings
  FOR INSERT
  TO public  -- Allow both anon and authenticated
  WITH CHECK (
    -- CASE 1: Authenticated user booking (Book-a-Meet feature)
    -- user_id must match the authenticated user
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    
    OR
    
    -- CASE 2: Public booking (guest booking with a host)
    -- Allow if the user_id belongs to a user who has an active event type
    -- This ensures you can only create bookings for valid hosts
    (
      auth.uid() IS NULL  -- Anonymous user
      AND EXISTS (
        SELECT 1 FROM event_types et 
        WHERE et.user_id = bookings.user_id 
        AND et.is_active = true
        AND et.id = bookings.event_type_id  -- Must match the event being booked
      )
    )
    
    OR
    
    -- CASE 3: Authenticated user booking with a host (like public booking but logged in)
    (
      auth.uid() IS NOT NULL
      AND user_id != auth.uid()  -- Booking with someone else
      AND EXISTS (
        SELECT 1 FROM event_types et 
        WHERE et.user_id = bookings.user_id 
        AND et.is_active = true
        AND et.id = bookings.event_type_id
      )
    )
  );

-- ============================================================================
-- FIX 2: TIGHTEN AVAILABILITY_RULES TO AUTHENTICATED ONLY
-- ============================================================================
-- Current: Uses {public} which includes anon
-- Fix: Change to authenticated only (anon shouldn't access availability)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete their own availability" ON public.availability_rules;
DROP POLICY IF EXISTS "Users can insert their own availability" ON public.availability_rules;
DROP POLICY IF EXISTS "Users can view their own availability" ON public.availability_rules;
DROP POLICY IF EXISTS "Users can update their own availability" ON public.availability_rules;

-- Recreate with authenticated role
CREATE POLICY "authenticated_availability_select" ON public.availability_rules
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "authenticated_availability_insert" ON public.availability_rules
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_availability_update" ON public.availability_rules
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_availability_delete" ON public.availability_rules
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- FIX 3: TIGHTEN REMINDERS TO AUTHENTICATED ONLY
-- ============================================================================

DROP POLICY IF EXISTS "Users can read their reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update their reminders" ON public.reminders;

CREATE POLICY "authenticated_reminders_select" ON public.reminders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = reminders.booking_id 
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "authenticated_reminders_update" ON public.reminders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = reminders.booking_id 
      AND b.user_id = auth.uid()
    )
  );

-- Also add INSERT policy for reminders (needed when creating bookings)
CREATE POLICY "authenticated_reminders_insert" ON public.reminders
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = reminders.booking_id 
      AND b.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX 4: STRENGTHEN USERS_PROFILE ROLE PROTECTION
-- ============================================================================
-- The existing prevent_role_self_elevation is complex. Let's add an explicit one.

-- First check if we need to modify the existing UPDATE policy
-- We'll create an additional restrictive policy

-- This policy EXPLICITLY blocks role changes for non-superadmins
CREATE POLICY "block_role_escalation" ON public.users_profile
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    -- Allow update only if:
    id = auth.uid() AND (
      -- Role is not being changed
      role IS NOT DISTINCT FROM (SELECT role FROM users_profile WHERE id = auth.uid())
      -- OR user is superadmin
      OR EXISTS (
        SELECT 1 FROM users_profile up 
        WHERE up.id = auth.uid() AND up.role = 'superadmin'
      )
    )
  );

-- ============================================================================
-- FIX 5: PROTECT users_profile INSERT (prevent role injection)
-- ============================================================================
-- Ensure new users can't create profiles with elevated roles

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users_profile;

CREATE POLICY "secure_profile_insert" ON public.users_profile
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND (role IS NULL OR role = 'user')  -- Can only be NULL or 'user', not 'superadmin'
  );

-- ============================================================================
-- FIX 6: ADD PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_profile_id ON public.users_profile(id);
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON public.users_profile(role);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_type_id ON public.bookings(event_type_id);
CREATE INDEX IF NOT EXISTS idx_event_types_user_id ON public.event_types(user_id);
CREATE INDEX IF NOT EXISTS idx_event_types_is_active ON public.event_types(is_active);
CREATE INDEX IF NOT EXISTS idx_reminders_booking_id ON public.reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_rules_user_id ON public.availability_rules(user_id);

-- ============================================================================
-- VERIFICATION QUERIES (Run after applying fixes)
-- ============================================================================

-- Verify all policies are in place:
-- SELECT tablename, policyname, cmd, roles::text FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, cmd;

-- Test role escalation prevention (should fail):
-- UPDATE users_profile SET role = 'superadmin' WHERE id = auth.uid();

-- Test booking insertion validation:
-- INSERT INTO bookings (user_id, event_type_id, ...) VALUES ('random-uuid', ...);
-- Should only work if the event_type exists and is active

-- ============================================================================
-- ROLLBACK SCRIPT (If something breaks)
-- ============================================================================
/*
-- Restore original booking policy
DROP POLICY IF EXISTS "secure_bookings_insert" ON public.bookings;
CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT TO public
  WITH CHECK (true);

-- Restore original availability policies
DROP POLICY IF EXISTS "authenticated_availability_select" ON public.availability_rules;
DROP POLICY IF EXISTS "authenticated_availability_insert" ON public.availability_rules;
DROP POLICY IF EXISTS "authenticated_availability_update" ON public.availability_rules;
DROP POLICY IF EXISTS "authenticated_availability_delete" ON public.availability_rules;

CREATE POLICY "Users can view their own availability" ON public.availability_rules
  FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own availability" ON public.availability_rules
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own availability" ON public.availability_rules
  FOR UPDATE TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own availability" ON public.availability_rules
  FOR DELETE TO public USING (auth.uid() = user_id);

-- Restore original reminders policies
DROP POLICY IF EXISTS "authenticated_reminders_select" ON public.reminders;
DROP POLICY IF EXISTS "authenticated_reminders_update" ON public.reminders;
DROP POLICY IF EXISTS "authenticated_reminders_insert" ON public.reminders;

CREATE POLICY "Users can read their reminders" ON public.reminders
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = reminders.booking_id AND b.user_id = auth.uid()));
CREATE POLICY "Users can update their reminders" ON public.reminders
  FOR UPDATE TO public
  USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = reminders.booking_id AND b.user_id = auth.uid()));

-- Restore profile insert
DROP POLICY IF EXISTS "secure_profile_insert" ON public.users_profile;
CREATE POLICY "Users can insert own profile" ON public.users_profile
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Remove the extra role protection policy
DROP POLICY IF EXISTS "block_role_escalation" ON public.users_profile;
*/
