-- ============================================================================
-- 🔍 VERIFY ANTI-SPAM SETUP
-- Run these queries to confirm everything is working
-- ============================================================================

-- 1. Check all anti-spam tables exist
SELECT 
    tablename,
    CASE WHEN tablename IS NOT NULL THEN '✅ Created' ELSE '❌ Missing' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('booking_rate_limits', 'blocked_identifiers', 'booking_attempts_log')
ORDER BY tablename;

-- 2. Check all anti-spam functions exist
SELECT 
    proname as function_name,
    '✅ Created' as status
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
    'check_booking_rate_limit_v2',
    'check_booking_allowed',
    'record_booking_attempt',
    'is_identifier_blocked',
    'mark_booking_success',
    'auto_block_repeat_offenders',
    'cleanup_booking_rate_limits',
    'cleanup_booking_attempts_log'
)
ORDER BY proname;

-- 3. Check blocked email domains count
SELECT 
    COUNT(*) as blocked_domains,
    CASE 
        WHEN COUNT(*) >= 30 THEN '✅ Well protected'
        WHEN COUNT(*) >= 10 THEN '⚠️ Basic protection'
        ELSE '❌ Add more domains'
    END as status
FROM blocked_identifiers 
WHERE identifier_type = 'email_domain';

-- 4. Check RLS is enabled on all anti-spam tables
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN ('booking_rate_limits', 'blocked_identifiers', 'booking_attempts_log');

-- 5. Test the rate limit function (dry run)
SELECT check_booking_rate_limit_v2(
    'test@example.com',  -- email
    'test-fingerprint',  -- fingerprint
    NULL                 -- host_user_id
) as rate_limit_check;

-- 6. Test the blocked identifier check (dry run)
SELECT is_identifier_blocked(
    'test@mailinator.com',  -- should be blocked (disposable)
    NULL
) as blocked_check;

-- 7. View sample blocked domains
SELECT identifier, reason 
FROM blocked_identifiers 
WHERE identifier_type = 'email_domain'
LIMIT 10;
