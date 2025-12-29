-- ============================================
-- ADD MISSING SUPERADMIN POLICIES
-- These allow superadmins to view all data
-- ============================================

-- Check if superadmin policies already exist
DO $$ 
BEGIN
  -- Add superadmin SELECT policy for users_profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users_profile' 
    AND policyname = 'superadmin_select_all'
  ) THEN
    CREATE POLICY "superadmin_select_all"
    ON users_profile
    FOR SELECT
    TO authenticated
    USING (
      -- Users can see their own profile OR they are superadmin
      (id = auth.uid())
      OR
      (EXISTS (
        SELECT 1 FROM users_profile 
        WHERE id = auth.uid() 
        AND role = 'superadmin'
      ))
    );
    RAISE NOTICE '✅ Created superadmin_select_all policy for users_profile';
  ELSE
    RAISE NOTICE '✅ superadmin_select_all policy already exists';
  END IF;

  -- Add superadmin UPDATE policy for users_profile (for updating other users)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users_profile' 
    AND policyname = 'superadmin_update_all'
  ) THEN
    CREATE POLICY "superadmin_update_all"
    ON users_profile
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users_profile 
        WHERE id = auth.uid() 
        AND role = 'superadmin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users_profile 
        WHERE id = auth.uid() 
        AND role = 'superadmin'
      )
    );
    RAISE NOTICE '✅ Created superadmin_update_all policy for users_profile';
  ELSE
    RAISE NOTICE '✅ superadmin_update_all policy already exists';
  END IF;

  -- Add superadmin SELECT policy for bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' 
    AND policyname = 'superadmin_select_all_bookings'
  ) THEN
    CREATE POLICY "superadmin_select_all_bookings"
    ON bookings
    FOR SELECT
    TO authenticated
    USING (
      (user_id = auth.uid())
      OR
      (EXISTS (
        SELECT 1 FROM users_profile 
        WHERE id = auth.uid() 
        AND role = 'superadmin'
      ))
    );
    RAISE NOTICE '✅ Created superadmin_select_all_bookings policy';
  ELSE
    RAISE NOTICE '✅ superadmin_select_all_bookings policy already exists';
  END IF;

  -- Add superadmin UPDATE policy for bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' 
    AND policyname = 'superadmin_update_all_bookings'
  ) THEN
    CREATE POLICY "superadmin_update_all_bookings"
    ON bookings
    FOR UPDATE
    TO authenticated
    USING (
      (user_id = auth.uid())
      OR
      (EXISTS (
        SELECT 1 FROM users_profile 
        WHERE id = auth.uid() 
        AND role = 'superadmin'
      ))
    );
    RAISE NOTICE '✅ Created superadmin_update_all_bookings policy';
  ELSE
    RAISE NOTICE '✅ superadmin_update_all_bookings policy already exists';
  END IF;

END $$;

-- Verify all policies
SELECT 
  '📋 All policies after adding superadmin policies:' AS info;

SELECT 
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies 
WHERE tablename IN ('users_profile', 'bookings', 'superadmin_audit_log')
ORDER BY tablename, policyname;
