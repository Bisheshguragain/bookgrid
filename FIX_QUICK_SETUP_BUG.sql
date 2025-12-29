-- ╔════════════════════════════════════════════════════════════════╗
-- ║     FIX THE BUG IN quick_setup.sql POLICIES                    ║
-- ║                                                                ║
-- ║  The original quick_setup.sql had a bug in RLS policies:       ║
-- ║  It used "user_id = auth.uid()" instead of "id = auth.uid()"   ║
-- ║                                                                ║
-- ║  This fixes ONLY the bug, doesn't create new tables            ║
-- ╚════════════════════════════════════════════════════════════════╝

BEGIN;

-- =====================================================
-- FIX 1: RECREATE payment_history POLICIES (if table exists)
-- =====================================================

DO $$ 
BEGIN
  -- Only fix if payment_history table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'payment_history'
  ) THEN
    
    -- Drop the broken policy
    DROP POLICY IF EXISTS "Superadmins can view all payment history" ON payment_history;
    
    -- Create the FIXED policy
    CREATE POLICY "Superadmins can view all payment history"
      ON payment_history FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users_profile 
          WHERE id = auth.uid() AND role = 'superadmin'  -- ✅ FIXED: id instead of user_id
        )
      );
    
    RAISE NOTICE '✅ Fixed payment_history superadmin policy';
  ELSE
    RAISE NOTICE '⚠️ payment_history table does not exist - skipping';
  END IF;
END $$;

-- =====================================================
-- FIX 2: RECREATE account_deletion_notices POLICIES (if table exists)
-- =====================================================

DO $$ 
BEGIN
  -- Only fix if account_deletion_notices table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'account_deletion_notices'
  ) THEN
    
    -- Drop the broken policy
    DROP POLICY IF EXISTS "Superadmins can view all deletion notices" ON account_deletion_notices;
    
    -- Create the FIXED policy
    CREATE POLICY "Superadmins can view all deletion notices"
      ON account_deletion_notices FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users_profile 
          WHERE id = auth.uid() AND role = 'superadmin'  -- ✅ FIXED: id instead of user_id
        )
      );
    
    RAISE NOTICE '✅ Fixed account_deletion_notices superadmin policy';
  ELSE
    RAISE NOTICE '⚠️ account_deletion_notices table does not exist - skipping';
  END IF;
END $$;

COMMIT;

-- =============================================
-- VERIFICATION
-- =============================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                    ✅ BUG FIX COMPLETE                          ║
╚════════════════════════════════════════════════════════════════╝
' AS status;

-- Show which policies were fixed
SELECT 
  tablename,
  policyname,
  'Policy fixed (id = auth.uid())' AS status
FROM pg_policies
WHERE policyname IN (
  'Superadmins can view all payment history',
  'Superadmins can view all deletion notices'
)
ORDER BY tablename;

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                    🎯 WHAT WAS FIXED                            ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  The bug in quick_setup.sql was:                               ║
║                                                                ║
║  ❌ OLD (BROKEN):                                               ║
║     WHERE user_id = auth.uid() AND role = ''superadmin''        ║
║                                                                ║
║  ✅ NEW (FIXED):                                                ║
║     WHERE id = auth.uid() AND role = ''superadmin''             ║
║                                                                ║
║  This was preventing superadmins from viewing:                 ║
║  - payment_history (if table exists)                           ║
║  - account_deletion_notices (if table exists)                  ║
║                                                                ║
║  Next step: Refresh dashboard and test all tabs               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
' AS summary;
