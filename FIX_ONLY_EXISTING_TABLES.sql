-- ╔════════════════════════════════════════════════════════════════╗
-- ║          ACTUAL FIX - ONLY FOR EXISTING TABLES                 ║
-- ║                                                                ║
-- ║  This only adds policies for tables that EXIST                 ║
-- ║  Run CHECK_WHAT_EXISTS.sql first to see what you have          ║
-- ╚════════════════════════════════════════════════════════════════╝

BEGIN;

-- =============================================
-- FIX 1: ADD SUPERADMIN POLICIES FOR users_profile
-- (Only if they don't already exist)
-- =============================================

DO $$ 
BEGIN
  -- Check if users_profile table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'users_profile'
  ) THEN
    
    -- Add superadmin SELECT policy if missing
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'users_profile' 
      AND policyname = 'superadmin_select_all'
    ) THEN
      CREATE POLICY "superadmin_select_all"
      ON users_profile FOR SELECT TO authenticated
      USING (
        (id = auth.uid())
        OR
        (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'superadmin'))
      );
      RAISE NOTICE '✅ Created superadmin_select_all on users_profile';
    ELSE
      RAISE NOTICE '⚠️ superadmin_select_all already exists on users_profile';
    END IF;

    -- Add superadmin UPDATE policy if missing
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'users_profile' 
      AND policyname = 'superadmin_update_all'
    ) THEN
      CREATE POLICY "superadmin_update_all"
      ON users_profile FOR UPDATE TO authenticated
      USING (
        EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'superadmin')
      );
      RAISE NOTICE '✅ Created superadmin_update_all on users_profile';
    ELSE
      RAISE NOTICE '⚠️ superadmin_update_all already exists on users_profile';
    END IF;
    
  ELSE
    RAISE NOTICE '⚠️ users_profile table does not exist - skipping';
  END IF;
END $$;

-- =============================================
-- FIX 2: ADD SUPERADMIN POLICIES FOR bookings
-- (Only if table exists)
-- =============================================

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'bookings'
  ) THEN
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'bookings' 
      AND policyname = 'superadmin_select_all_bookings'
    ) THEN
      CREATE POLICY "superadmin_select_all_bookings"
      ON bookings FOR SELECT TO authenticated
      USING (
        (user_id = auth.uid())
        OR
        (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'superadmin'))
      );
      RAISE NOTICE '✅ Created superadmin_select_all_bookings';
    ELSE
      RAISE NOTICE '⚠️ superadmin_select_all_bookings already exists';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'bookings' 
      AND policyname = 'superadmin_update_all_bookings'
    ) THEN
      CREATE POLICY "superadmin_update_all_bookings"
      ON bookings FOR UPDATE TO authenticated
      USING (
        EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'superadmin')
      );
      RAISE NOTICE '✅ Created superadmin_update_all_bookings';
    ELSE
      RAISE NOTICE '⚠️ superadmin_update_all_bookings already exists';
    END IF;
    
  ELSE
    RAISE NOTICE '⚠️ bookings table does not exist - skipping';
  END IF;
END $$;

-- =============================================
-- FIX 3: ADD SUPERADMIN POLICIES FOR event_types
-- (Only if table exists)
-- =============================================

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'event_types'
  ) THEN
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'event_types' 
      AND policyname = 'superadmin_select_all_event_types'
    ) THEN
      CREATE POLICY "superadmin_select_all_event_types"
      ON event_types FOR SELECT TO authenticated
      USING (
        (user_id = auth.uid())
        OR
        (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'superadmin'))
      );
      RAISE NOTICE '✅ Created superadmin_select_all_event_types';
    ELSE
      RAISE NOTICE '⚠️ superadmin_select_all_event_types already exists';
    END IF;
    
  ELSE
    RAISE NOTICE '⚠️ event_types table does not exist - skipping';
  END IF;
END $$;

COMMIT;

-- =============================================
-- VERIFICATION
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                    VERIFICATION REPORT                         ║
╚════════════════════════════════════════════════════════════════╝
' AS status;

-- Show what tables exist
SELECT 
  'users_profile' AS table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_profile') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status
UNION ALL
SELECT 
  'bookings' AS table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status
UNION ALL
SELECT 
  'event_types' AS table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_types') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status
UNION ALL
SELECT 
  'payment_history' AS table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_history') 
    THEN '✅ EXISTS' ELSE '❌ MISSING (not needed for basic dashboard)' END AS status
UNION ALL
SELECT 
  'account_deletion_notices' AS table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_deletion_notices') 
    THEN '✅ EXISTS' ELSE '❌ MISSING (not needed for basic dashboard)' END AS status;

-- Show superadmin policies
SELECT '
Superadmin policies created:
' AS info;

SELECT 
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE policyname LIKE '%superadmin%'
ORDER BY tablename, cmd;

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                         NEXT STEPS                             ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  1. Refresh your SuperAdmin Dashboard                          ║
║  2. Check which tabs work now                                  ║
║                                                                ║
║  NOTE: If payment_history or account_deletion_notices          ║
║  tables don''t exist, those tabs won''t work.                   ║
║                                                                ║
║  To create missing tables, you need to run:                    ║
║  migrations/add_superadmin_system.sql                          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
' AS final_message;
