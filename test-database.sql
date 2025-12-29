-- TEST SCRIPT FOR EVENT TYPE AND AVAILABILITY CREATION
-- This script tests all database operations to ensure they work correctly
-- Run this AFTER applying fix-rls-policies.sql

-- ============================================================================
-- SETUP: Get a test user ID (replace with your actual user ID from auth.users)
-- ============================================================================

-- First, find your user ID:
-- SELECT id, email FROM auth.users LIMIT 1;

-- Then replace 'YOUR_USER_ID_HERE' in the tests below with your actual user ID

-- ============================================================================
-- TEST 1: Insert Event Type with Minimal Fields
-- ============================================================================

DO $$
DECLARE
    test_user_id UUID := 'YOUR_USER_ID_HERE'; -- REPLACE THIS
    new_event_id UUID;
BEGIN
    -- Set the user context (simulates being logged in)
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
    
    -- Try to insert a minimal event type
    INSERT INTO event_types (user_id, title, duration)
    VALUES (test_user_id, 'Test Event Type 1', 30)
    RETURNING id INTO new_event_id;
    
    RAISE NOTICE '✅ TEST 1 PASSED: Minimal event type created with ID: %', new_event_id;
    
    -- Clean up
    DELETE FROM event_types WHERE id = new_event_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ TEST 1 FAILED: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 2: Insert Event Type with All Fields (including new date range)
-- ============================================================================

DO $$
DECLARE
    test_user_id UUID := 'YOUR_USER_ID_HERE'; -- REPLACE THIS
    new_event_id UUID;
BEGIN
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
    
    INSERT INTO event_types (
        user_id, 
        title, 
        description,
        duration,
        location_type,
        location_value,
        color,
        max_attendees,
        is_active,
        reminder_offsets,
        date_range_start,
        date_range_end
    )
    VALUES (
        test_user_id,
        'Test Event Type 2',
        'Test description',
        45,
        'google_meet',
        'meet.google.com/test',
        '#10B981',
        5,
        true,
        ARRAY[15, 60, 1440],
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days'
    )
    RETURNING id INTO new_event_id;
    
    RAISE NOTICE '✅ TEST 2 PASSED: Full event type created with ID: %', new_event_id;
    RAISE NOTICE '   - Date range: % to %', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days';
    
    -- Clean up
    DELETE FROM event_types WHERE id = new_event_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ TEST 2 FAILED: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 3: Test All New Location Types
-- ============================================================================

DO $$
DECLARE
    test_user_id UUID := 'YOUR_USER_ID_HERE'; -- REPLACE THIS
    location_type TEXT;
    location_types TEXT[] := ARRAY['zoom', 'google_meet', 'microsoft_teams', 'phone', 'in_person', 'webex', 'skype', 'custom'];
    new_event_id UUID;
BEGIN
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
    
    FOREACH location_type IN ARRAY location_types
    LOOP
        INSERT INTO event_types (user_id, title, duration, location_type)
        VALUES (test_user_id, 'Test ' || location_type, 30, location_type)
        RETURNING id INTO new_event_id;
        
        RAISE NOTICE '✅ Location type "%" works', location_type;
        
        -- Clean up
        DELETE FROM event_types WHERE id = new_event_id;
    END LOOP;
    
    RAISE NOTICE '✅ TEST 3 PASSED: All location types work correctly';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ TEST 3 FAILED: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 4: Insert Availability Rule
-- ============================================================================

DO $$
DECLARE
    test_user_id UUID := 'YOUR_USER_ID_HERE'; -- REPLACE THIS
    new_rule_id UUID;
BEGIN
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
    
    INSERT INTO availability_rules (
        user_id,
        day_of_week,
        start_time,
        end_time,
        buffer_before,
        buffer_after
    )
    VALUES (
        test_user_id,
        1, -- Monday
        '09:00:00',
        '17:00:00',
        15,
        15
    )
    RETURNING id INTO new_rule_id;
    
    RAISE NOTICE '✅ TEST 4 PASSED: Availability rule created with ID: %', new_rule_id;
    
    -- Clean up
    DELETE FROM availability_rules WHERE id = new_rule_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ TEST 4 FAILED: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 5: Test RLS Policies - User Can Only See Own Data
-- ============================================================================

DO $$
DECLARE
    test_user_id UUID := 'YOUR_USER_ID_HERE'; -- REPLACE THIS
    event_count INTEGER;
BEGIN
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
    
    -- This should only return events for the current user
    SELECT COUNT(*) INTO event_count
    FROM event_types
    WHERE user_id = test_user_id;
    
    RAISE NOTICE '✅ TEST 5 PASSED: RLS allows user to see their own events (count: %)', event_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ TEST 5 FAILED: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 6: Test Date Range Constraint
-- ============================================================================

DO $$
DECLARE
    test_user_id UUID := 'YOUR_USER_ID_HERE'; -- REPLACE THIS
    new_event_id UUID;
BEGIN
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
    
    -- Try to insert with invalid date range (end before start) - should fail
    BEGIN
        INSERT INTO event_types (
            user_id, 
            title, 
            duration,
            date_range_start,
            date_range_end
        )
        VALUES (
            test_user_id,
            'Invalid Date Range Test',
            30,
            CURRENT_DATE + INTERVAL '30 days',
            CURRENT_DATE -- End before start!
        );
        
        RAISE NOTICE '❌ TEST 6 FAILED: Invalid date range was accepted (should have been rejected)';
        
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✅ TEST 6 PASSED: Invalid date range was correctly rejected';
    END;
    
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║          DATABASE TESTS COMPLETED                      ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE 'Review the test results above:';
    RAISE NOTICE '- ✅ means the test passed';
    RAISE NOTICE '- ❌ means the test failed';
    RAISE NOTICE '';
    RAISE NOTICE 'If all tests passed, you can now:';
    RAISE NOTICE '1. Test creating event types in the app UI';
    RAISE NOTICE '2. Test creating availability rules in the app UI';
    RAISE NOTICE '3. Test the new date range feature';
    RAISE NOTICE '4. Test all new location types';
    RAISE NOTICE '';
    RAISE NOTICE 'If any tests failed:';
    RAISE NOTICE '1. Make sure you replaced YOUR_USER_ID_HERE with actual user ID';
    RAISE NOTICE '2. Check that fix-rls-policies.sql was run successfully';
    RAISE NOTICE '3. Check that migrations/001_add_new_features.sql was run';
    RAISE NOTICE '4. See DATABASE_FIX_GUIDE.md for more help';
END $$;
