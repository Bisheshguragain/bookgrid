-- ============================================================================
-- 🔒 BOOKGRID RLS SECURITY AUDIT V2 - READ ONLY
-- ============================================================================
-- This script is 100% READ-ONLY and will not modify anything.
-- Run this in Supabase SQL Editor to audit your security configuration.
-- 
-- NOTE: Run each section SEPARATELY to see results (Supabase shows last query only)
-- Or run the COMBINED AUDIT at the end for a single comprehensive view.
-- ============================================================================

-- ============================================================================
-- OPTION 1: RUN SECTIONS INDIVIDUALLY (Copy one at a time)
-- ============================================================================

-- SECTION 1: ALL RLS POLICIES (copy and run this block alone)
/*
SELECT 
    tablename,
    policyname,
    permissive,
    roles::text,
    cmd,
    COALESCE(LEFT(qual::text, 100), 'N/A') AS using_expression,
    COALESCE(LEFT(with_check::text, 100), 'N/A') AS with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
*/

-- SECTION 2: RLS STATUS (copy and run this block alone)
/*
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END AS rls_status,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename AND p.schemaname = 'public') AS policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
*/

-- SECTION 3: SECURITY DEFINER FUNCTIONS (copy and run this block alone)
/*
SELECT 
    p.proname AS function_name,
    CASE WHEN p.prosecdef THEN '⚠️ SECURITY DEFINER' ELSE '✅ INVOKER' END AS security_mode
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.prosecdef DESC, p.proname;
*/

-- ============================================================================
-- OPTION 2: COMBINED COMPREHENSIVE AUDIT (Run this entire block)
-- ============================================================================

WITH 
-- Get all policies
policies AS (
    SELECT 
        tablename,
        policyname,
        cmd,
        permissive,
        roles::text as roles,
        qual::text as using_expr,
        with_check::text as check_expr
    FROM pg_policies 
    WHERE schemaname = 'public'
),
-- Get table RLS status
tables_rls AS (
    SELECT 
        tablename,
        rowsecurity
    FROM pg_tables 
    WHERE schemaname = 'public'
),
-- Get security definer functions
sec_def_funcs AS (
    SELECT 
        p.proname AS func_name,
        p.prosecdef
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
),
-- Get indexes
indexes AS (
    SELECT tablename, indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
)

-- MAIN OUTPUT: Everything in one view
SELECT * FROM (
    -- Header
    SELECT 1 as sort_order, '═══════════════════════════════════════════════════════════════' as info
    UNION ALL
    SELECT 2, '🔒 BOOKGRID RLS SECURITY AUDIT REPORT'
    UNION ALL
    SELECT 3, '═══════════════════════════════════════════════════════════════'
    UNION ALL
    SELECT 4, ''
    
    -- Summary Stats
    UNION ALL SELECT 10, '📊 SUMMARY STATISTICS'
    UNION ALL SELECT 11, '─────────────────────────────────────────'
    UNION ALL
    SELECT 12, '  Tables with RLS ENABLED: ' || (SELECT COUNT(*) FROM tables_rls WHERE rowsecurity = true)::text
    UNION ALL
    SELECT 13, '  Tables with RLS DISABLED: ' || (SELECT COUNT(*) FROM tables_rls WHERE rowsecurity = false)::text || 
        CASE WHEN (SELECT COUNT(*) FROM tables_rls WHERE rowsecurity = false) > 0 THEN ' ⚠️ SECURITY RISK!' ELSE '' END
    UNION ALL
    SELECT 14, '  Total RLS Policies: ' || (SELECT COUNT(*) FROM policies)::text
    UNION ALL
    SELECT 15, '  SECURITY DEFINER Functions: ' || (SELECT COUNT(*) FROM sec_def_funcs)::text ||
        CASE WHEN (SELECT COUNT(*) FROM sec_def_funcs) > 0 THEN ' (review these!)' ELSE '' END
    UNION ALL
    SELECT 16, '  Risky WITH CHECK=true policies: ' || (SELECT COUNT(*) FROM policies WHERE check_expr = 'true' AND cmd IN ('INSERT', 'UPDATE'))::text
    UNION ALL SELECT 17, ''
    
    -- Tables with RLS Status
    UNION ALL SELECT 20, '📋 TABLE RLS STATUS'
    UNION ALL SELECT 21, '─────────────────────────────────────────'
    UNION ALL
    SELECT 22 + row_number() OVER (), 
        '  ' || tablename || ': ' || 
        CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END ||
        ' (' || (SELECT COUNT(*) FROM policies p WHERE p.tablename = t.tablename)::text || ' policies)'
    FROM tables_rls t
    ORDER BY tablename
    
) combined
ORDER BY sort_order;

-- ============================================================================
-- DETAILED POLICIES BY TABLE (Run separately for each table you want to inspect)
-- ============================================================================

-- Run this to see users_profile policies in detail:
SELECT 
    '👤 USERS_PROFILE POLICIES' as table_info,
    policyname,
    cmd as operation,
    permissive,
    roles::text,
    LEFT(COALESCE(qual::text, 'N/A'), 80) AS using_clause,
    LEFT(COALESCE(with_check::text, 'N/A'), 80) AS with_check_clause,
    CASE 
        WHEN with_check::text = 'true' THEN '⚠️ RISKY'
        WHEN qual::text ILIKE '%role%' OR with_check::text ILIKE '%role%' THEN '🔐 Role-aware'
        ELSE ''
    END as security_note
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users_profile'
ORDER BY cmd, policyname;

-- ============================================================================
-- BOOKINGS POLICIES
-- ============================================================================
SELECT 
    '📅 BOOKINGS POLICIES' as table_info,
    policyname,
    cmd as operation,
    permissive,
    roles::text,
    LEFT(COALESCE(qual::text, 'N/A'), 80) AS using_clause,
    LEFT(COALESCE(with_check::text, 'N/A'), 80) AS with_check_clause,
    CASE 
        WHEN with_check::text = 'true' THEN '⚠️ RISKY - allows any user_id'
        WHEN qual::text ILIKE '%auth.uid()%' THEN '✅ User-scoped'
        ELSE ''
    END as security_note
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'bookings'
ORDER BY cmd, policyname;

-- ============================================================================
-- EVENT_TYPES POLICIES
-- ============================================================================
SELECT 
    '📌 EVENT_TYPES POLICIES' as table_info,
    policyname,
    cmd as operation,
    permissive,
    roles::text,
    LEFT(COALESCE(qual::text, 'N/A'), 80) AS using_clause,
    LEFT(COALESCE(with_check::text, 'N/A'), 80) AS with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'event_types'
ORDER BY cmd, policyname;

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS (ELEVATED PRIVILEGES)
-- ============================================================================
SELECT 
    '⚡ SECURITY DEFINER FUNCTIONS' as category,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    '⚠️ Runs with OWNER privileges - audit carefully!' as warning
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prosecdef = true
ORDER BY p.proname;

-- ============================================================================
-- DANGEROUS POLICIES CHECK
-- ============================================================================
SELECT 
    '🚨 POTENTIALLY DANGEROUS POLICIES' as category,
    tablename,
    policyname,
    cmd as operation,
    'WITH CHECK = true allows inserting/updating ANY value!' as risk
FROM pg_policies 
WHERE schemaname = 'public'
  AND with_check::text = 'true'
  AND cmd IN ('INSERT', 'UPDATE');

-- ============================================================================
-- MISSING RECOMMENDED INDEXES
-- ============================================================================
SELECT 
    '📈 INDEX CHECK' as category,
    check_name,
    status
FROM (
    SELECT 'users_profile(id)' as check_name,
        CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='users_profile' AND indexdef ILIKE '%id%') 
        THEN '✅ OK' ELSE '❌ Missing' END as status
    UNION ALL
    SELECT 'bookings(user_id)',
        CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='bookings' AND indexdef ILIKE '%user_id%') 
        THEN '✅ OK' ELSE '❌ Missing' END
    UNION ALL
    SELECT 'event_types(user_id)',
        CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='event_types' AND indexdef ILIKE '%user_id%') 
        THEN '✅ OK' ELSE '❌ Missing' END
    UNION ALL
    SELECT 'reminders(booking_id)',
        CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='reminders' AND indexdef ILIKE '%booking_id%') 
        THEN '✅ OK' ELSE '❌ Missing' END
) checks;

-- ============================================================================
-- ANON ACCESS CHECK
-- ============================================================================
SELECT 
    '👻 ANON (PUBLIC) ACCESS POLICIES' as category,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN roles::text ILIKE '%anon%' THEN '⚠️ Anonymous can access'
        ELSE '✅ Authenticated only'
    END as access_type
FROM pg_policies 
WHERE schemaname = 'public'
  AND roles::text ILIKE '%anon%'
ORDER BY tablename, cmd;

-- ============================================================================
-- SUPERADMIN POLICIES
-- ============================================================================
SELECT 
    '👑 SUPERADMIN POLICIES' as category,
    tablename,
    policyname,
    cmd,
    LEFT(COALESCE(qual::text, ''), 60) as using_preview
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual::text ILIKE '%superadmin%' OR with_check::text ILIKE '%superadmin%')
ORDER BY tablename, policyname;
