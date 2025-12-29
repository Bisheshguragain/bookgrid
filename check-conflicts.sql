-- Check for unique constraints and indexes on event_types that might cause 409 Conflict

-- 1. Check all constraints
SELECT 
    con.conname as constraint_name,
    con.contype as constraint_type,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'event_types'
ORDER BY con.contype;

-- 2. Check all indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'event_types';

-- 3. Check if there are any triggers that might cause issues
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'event_types';

-- 4. Try a test insert to see exact error
DO $$
DECLARE
    test_user_id UUID := 'YOUR_USER_ID_HERE'; -- Replace with actual user ID
    test_event_id UUID;
BEGIN
    -- Set auth context
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
    
    -- Try to insert
    INSERT INTO event_types (user_id, title, duration, location_type)
    VALUES (test_user_id, 'Debug Test Event', 30, 'zoom')
    RETURNING id INTO test_event_id;
    
    RAISE NOTICE 'SUCCESS: Event created with ID %', test_event_id;
    
    -- Clean up
    DELETE FROM event_types WHERE id = test_event_id;
    RAISE NOTICE 'Test event cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
    RAISE NOTICE 'DETAIL: %', SQLSTATE;
END $$;
