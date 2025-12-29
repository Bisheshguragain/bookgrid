-- Database Debugging Script for Calendly Clone
-- Run this in Supabase SQL Editor to check database setup

-- 1. Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = table_name
        ) THEN '✓ Exists'
        ELSE '✗ Missing'
    END as status
FROM (
    VALUES 
        ('users_profile'),
        ('event_types'),
        ('availability_rules'),
        ('bookings'),
        ('reminders'),
        ('global_settings'),
        ('event_type_overrides')
) AS t(table_name);

-- 2. Check event_types table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'event_types'
ORDER BY ordinal_position;

-- 3. Check location_type constraint
SELECT 
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'event_types'
    AND con.contype = 'c' -- check constraints
    AND con.conname LIKE '%location%';

-- 4. Check date range columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'event_types'
    AND column_name IN ('date_range_start', 'date_range_end');

-- 5. Check RLS policies for event_types
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'event_types';

-- 6. Check RLS policies for availability_rules
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'availability_rules';

-- 7. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('event_types', 'availability_rules', 'users_profile');

-- 8. Check availability_rules table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'availability_rules'
ORDER BY ordinal_position;

-- 9. Test insert into event_types (will fail if auth.uid() is not set, which is expected)
-- This shows what would happen during an insert
DO $$
BEGIN
    -- This is just to show the structure, won't actually insert
    RAISE NOTICE 'Event types table is ready for inserts';
    RAISE NOTICE 'Required fields: user_id, title, duration';
    RAISE NOTICE 'Optional fields: description, location_type, location_value, color, max_attendees, is_active, reminder_offsets, date_range_start, date_range_end';
END $$;

-- 10. Check for any existing constraints that might block inserts
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('event_types', 'availability_rules')
ORDER BY tc.table_name, tc.constraint_type;
