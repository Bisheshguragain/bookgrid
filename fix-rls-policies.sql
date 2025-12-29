-- FIX SCRIPT FOR EVENT TYPE AND AVAILABILITY RULE CREATION
-- Run this script in Supabase SQL Editor to fix RLS policy issues

-- ============================================================================
-- PART 1: FIX EVENT TYPES RLS POLICIES
-- ============================================================================

-- Drop ALL existing event_types policies that might be causing issues
DROP POLICY IF EXISTS "Users can manage their own event types" ON event_types;
DROP POLICY IF EXISTS "Users can read their own event types" ON event_types;
DROP POLICY IF EXISTS "Users can read active event types for booking" ON event_types;
DROP POLICY IF EXISTS "Users can view their own event types" ON event_types;
DROP POLICY IF EXISTS "Users can insert their own event types" ON event_types;
DROP POLICY IF EXISTS "Users can update their own event types" ON event_types;
DROP POLICY IF EXISTS "Users can delete their own event types" ON event_types;
DROP POLICY IF EXISTS "Anyone can view active event types" ON event_types;

-- Create granular policies for better control
CREATE POLICY "Users can view their own event types" ON event_types
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event types" ON event_types
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event types" ON event_types
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event types" ON event_types
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Allow public to view active event types (for booking page)
CREATE POLICY "Anyone can view active event types" ON event_types
    FOR SELECT 
    USING (is_active = true);

-- ============================================================================
-- PART 2: FIX AVAILABILITY RULES RLS POLICIES
-- ============================================================================

-- Drop ALL existing availability_rules policies
DROP POLICY IF EXISTS "Users can manage their own availability" ON availability_rules;
DROP POLICY IF EXISTS "Users can view their own availability" ON availability_rules;
DROP POLICY IF EXISTS "Users can insert their own availability" ON availability_rules;
DROP POLICY IF EXISTS "Users can update their own availability" ON availability_rules;
DROP POLICY IF EXISTS "Users can delete their own availability" ON availability_rules;

-- Create granular policies for better control
CREATE POLICY "Users can view their own availability" ON availability_rules
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own availability" ON availability_rules
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability" ON availability_rules
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability" ON availability_rules
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================================================
-- PART 3: VERIFY POLICIES ARE IN PLACE
-- ============================================================================

-- Show all event_types policies
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Read'
        WHEN cmd = 'INSERT' THEN 'Create'
        WHEN cmd = 'UPDATE' THEN 'Update'
        WHEN cmd = 'DELETE' THEN 'Delete'
        WHEN cmd = 'ALL' THEN 'All Operations'
    END as operation,
    permissive
FROM pg_policies
WHERE tablename = 'event_types'
ORDER BY cmd;

-- Show all availability_rules policies
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Read'
        WHEN cmd = 'INSERT' THEN 'Create'
        WHEN cmd = 'UPDATE' THEN 'Update'
        WHEN cmd = 'DELETE' THEN 'Delete'
        WHEN cmd = 'ALL' THEN 'All Operations'
    END as operation,
    permissive
FROM pg_policies
WHERE tablename = 'availability_rules'
ORDER BY cmd;

-- ============================================================================
-- PART 4: VERIFY TABLE STRUCTURE
-- ============================================================================

-- Check event_types has all required columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'event_types'
    AND column_name IN (
        'id', 'user_id', 'title', 'description', 'duration', 
        'location_type', 'location_value', 'color', 'max_attendees', 
        'is_active', 'reminder_offsets', 'date_range_start', 'date_range_end',
        'created_at', 'updated_at'
    )
ORDER BY ordinal_position;

-- Check availability_rules has all required columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'availability_rules'
    AND column_name IN (
        'id', 'user_id', 'day_of_week', 'start_time', 'end_time',
        'buffer_before', 'buffer_after', 'created_at', 'updated_at'
    )
ORDER BY ordinal_position;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies have been updated successfully!';
    RAISE NOTICE '✅ Event types: 5 policies created (view, insert, update, delete, public view)';
    RAISE NOTICE '✅ Availability rules: 4 policies created (view, insert, update, delete)';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Check the policy output above';
    RAISE NOTICE '2. Test creating an event type in the app';
    RAISE NOTICE '3. Test creating an availability rule in the app';
    RAISE NOTICE '4. If issues persist, check DATABASE_FIX_GUIDE.md';
END $$;
