-- ============================================================================
-- 🔒 BOOKGRID RLS SECURITY AUDIT - READ ONLY
-- ============================================================================
-- This script is 100% READ-ONLY and will not modify anything.
-- Run this in Supabase SQL Editor to audit your security configuration.
-- Date: December 2024
-- ============================================================================

-- ============================================================================
-- SECTION 1: ALL RLS POLICIES OVERVIEW
-- ============================================================================
SELECT '=== SECTION 1: ALL RLS POLICIES ===' AS section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 2: RLS STATUS PER TABLE
-- ============================================================================
SELECT '=== SECTION 2: RLS ENABLED STATUS ===' AS section;

SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS DISABLED - SECURITY RISK!'
    END AS status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- SECTION 3: POLICY COUNT PER TABLE
-- ============================================================================
SELECT '=== SECTION 3: POLICY COUNT PER TABLE ===' AS section;

SELECT 
    t.tablename,
    t.rowsecurity AS rls_enabled,
    COUNT(p.policyname) AS policy_count,
    CASE 
        WHEN t.rowsecurity AND COUNT(p.policyname) = 0 THEN '⚠️ RLS ON but NO POLICIES - blocks all access!'
        WHEN NOT t.rowsecurity THEN '❌ RLS OFF - open to all!'
        WHEN COUNT(p.policyname) > 0 THEN '✅ Protected'
        ELSE '❓ Unknown'
    END AS status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- ============================================================================
-- SECTION 4: USERS_PROFILE POLICIES (CRITICAL FOR ROLE SECURITY)
-- ============================================================================
SELECT '=== SECTION 4: USERS_PROFILE POLICIES ===' AS section;

SELECT 
    policyname,
    cmd AS operation,
    permissive,
    roles,
    qual AS using_clause,
    with_check AS with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users_profile'
ORDER BY cmd, policyname;

-- ============================================================================
-- SECTION 5: BOOKINGS POLICIES (CHECK FOR USER_ID VALIDATION)
-- ============================================================================
SELECT '=== SECTION 5: BOOKINGS POLICIES ===' AS section;

SELECT 
    policyname,
    cmd AS operation,
    permissive,
    roles,
    qual AS using_clause,
    with_check AS with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'bookings'
ORDER BY cmd, policyname;

-- ============================================================================
-- SECTION 6: EVENT_TYPES POLICIES
-- ============================================================================
SELECT '=== SECTION 6: EVENT_TYPES POLICIES ===' AS section;

SELECT 
    policyname,
    cmd AS operation,
    permissive,
    roles,
    qual AS using_clause,
    with_check AS with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'event_types'
ORDER BY cmd, policyname;

-- ============================================================================
-- SECTION 7: SECURITY DEFINER FUNCTIONS (ELEVATED PRIVILEGE CHECK)
-- ============================================================================
SELECT '=== SECTION 7: SECURITY DEFINER FUNCTIONS ===' AS section;

SELECT 
    n.nspname AS schema,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    CASE 
        WHEN p.prosecdef THEN '⚠️ SECURITY DEFINER - runs with owner privileges'
        ELSE '✅ SECURITY INVOKER - runs with caller privileges'
    END AS security_mode
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;

-- ============================================================================
-- SECTION 8: ALL FUNCTIONS WITH THEIR SECURITY MODE
-- ============================================================================
SELECT '=== SECTION 8: ALL PUBLIC FUNCTIONS ===' AS section;

SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security_mode,
    r.rolname AS owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_roles r ON p.proowner = r.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- ============================================================================
-- SECTION 9: CHECK FOR DANGEROUS POLICIES (WITH CHECK = true)
-- ============================================================================
SELECT '=== SECTION 9: POTENTIALLY DANGEROUS POLICIES ===' AS section;

SELECT 
    tablename,
    policyname,
    cmd,
    '⚠️ WITH CHECK = true allows any value!' AS warning
FROM pg_policies 
WHERE schemaname = 'public'
  AND with_check = 'true'
  AND cmd IN ('INSERT', 'UPDATE');

-- ============================================================================
-- SECTION 10: POLICIES USING SUPERADMIN ROLE CHECK
-- ============================================================================
SELECT '=== SECTION 10: SUPERADMIN POLICIES ===' AS section;

SELECT 
    tablename,
    policyname,
    cmd,
    qual AS using_clause,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual::text ILIKE '%superadmin%' OR with_check::text ILIKE '%superadmin%')
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 11: CHECK ROLE COLUMN PROTECTION
-- ============================================================================
SELECT '=== SECTION 11: ROLE COLUMN PROTECTION CHECK ===' AS section;

SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual::text ILIKE '%role%' OR with_check::text ILIKE '%role%' 
        THEN '✅ Policy references role column'
        ELSE '❓ Policy does not reference role column'
    END AS role_check,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'users_profile'
  AND cmd IN ('UPDATE', 'INSERT')
ORDER BY cmd, policyname;

-- ============================================================================
-- SECTION 12: EXISTING INDEXES (FOR PERFORMANCE)
-- ============================================================================
SELECT '=== SECTION 12: EXISTING INDEXES ===' AS section;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 13: RECOMMENDED INDEXES CHECK
-- ============================================================================
SELECT '=== SECTION 13: RECOMMENDED INDEXES CHECK ===' AS section;

SELECT 
    'users_profile(id)' AS recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'users_profile' AND indexdef ILIKE '%id%'
    ) THEN '✅ Exists' ELSE '❌ Missing' END AS status
UNION ALL
SELECT 
    'bookings(user_id)' AS recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'bookings' AND indexdef ILIKE '%user_id%'
    ) THEN '✅ Exists' ELSE '❌ Missing' END AS status
UNION ALL
SELECT 
    'event_types(user_id)' AS recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'event_types' AND indexdef ILIKE '%user_id%'
    ) THEN '✅ Exists' ELSE '❌ Missing' END AS status
UNION ALL
SELECT 
    'reminders(booking_id)' AS recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'reminders' AND indexdef ILIKE '%booking_id%'
    ) THEN '✅ Exists' ELSE '❌ Missing' END AS status;

-- ============================================================================
-- SECTION 14: TRIGGERS ON TABLES
-- ============================================================================
SELECT '=== SECTION 14: TRIGGERS ===' AS section;

SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SECTION 15: TABLE COLUMN DETAILS (users_profile)
-- ============================================================================
SELECT '=== SECTION 15: USERS_PROFILE COLUMNS ===' AS section;

SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable,
    CASE 
        WHEN column_name IN ('role', 'subscription_plan', 'account_status') 
        THEN '⚠️ SENSITIVE - ensure protected by RLS'
        ELSE ''
    END AS security_note
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users_profile'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 16: GRANTS AND PERMISSIONS
-- ============================================================================
SELECT '=== SECTION 16: TABLE GRANTS ===' AS section;

SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================================
-- SECTION 17: ANON ROLE ACCESS CHECK
-- ============================================================================
SELECT '=== SECTION 17: ANON ROLE ACCESS ===' AS section;

SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    CASE 
        WHEN roles::text ILIKE '%anon%' THEN '⚠️ Allows anonymous access'
        ELSE '✅ Authenticated only'
    END AS anon_access
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 18: SUMMARY REPORT
-- ============================================================================
SELECT '=== SECTION 18: SECURITY SUMMARY ===' AS section;

SELECT 
    'Tables with RLS Enabled' AS metric,
    COUNT(*)::text AS value
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 
    'Tables WITHOUT RLS (DANGER!)' AS metric,
    COUNT(*)::text AS value
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false
UNION ALL
SELECT 
    'Total RLS Policies' AS metric,
    COUNT(*)::text AS value
FROM pg_policies 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'SECURITY DEFINER Functions' AS metric,
    COUNT(*)::text AS value
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prosecdef = true
UNION ALL
SELECT 
    'Policies with WITH CHECK = true (risky)' AS metric,
    COUNT(*)::text AS value
FROM pg_policies 
WHERE schemaname = 'public' AND with_check = 'true' AND cmd IN ('INSERT', 'UPDATE');

-- ============================================================================
-- END OF AUDIT
-- ============================================================================
SELECT '=== AUDIT COMPLETE ===' AS section;
SELECT 'Review the results above and apply fixes as needed.' AS next_steps;
SELECT 'See CTO_SECURITY_AUDIT_2024.md for recommendations.' AS documentation;
