-- ============================================
-- CRITICAL SECURITY FIXES FOR BOOKGRID
-- Execute these immediately before production
-- ============================================

-- =============================================
-- FIX 1: PREVENT ROLE SELF-ELEVATION (CRITICAL)
-- =============================================
-- This prevents users from promoting themselves to superadmin

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "prevent_role_self_elevation" ON users_profile;

-- Create new policy that blocks role changes unless done by superadmin
CREATE POLICY "prevent_role_self_elevation"
ON users_profile
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  -- Allow all changes EXCEPT role changes
  (COALESCE((SELECT role FROM users_profile WHERE id = auth.uid()), 'user') = 
   COALESCE(role, (SELECT role FROM users_profile WHERE id = auth.uid()), 'user'))
  OR
  -- OR if the user is already a superadmin, they can change roles
  (EXISTS (
    SELECT 1 FROM users_profile 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  ))
);

-- =============================================
-- FIX 2: ADD RATE LIMITING ON BOOKINGS (CRITICAL)
-- =============================================
-- Prevents spam bookings and slot reservation attacks

-- Create rate limiting function
CREATE OR REPLACE FUNCTION check_booking_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_bookings INTEGER;
BEGIN
  -- Count bookings from this email in last hour
  SELECT COUNT(*) INTO recent_bookings
  FROM bookings
  WHERE guest_email = NEW.guest_email
    AND created_at > NOW() - INTERVAL '1 hour'
    AND status != 'cancelled';
  
  -- Allow max 5 bookings per hour per email
  IF recent_bookings >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. You can only create 5 bookings per hour. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS booking_rate_limit ON bookings;

-- Create trigger for rate limiting
CREATE TRIGGER booking_rate_limit
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_rate_limit();

-- =============================================
-- FIX 3: ADD TOKEN EXPIRATION (HIGH PRIORITY)
-- =============================================
-- Reschedule/cancel tokens should expire

-- Add expiration column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'token_expires_at'
  ) THEN
    ALTER TABLE bookings 
    ADD COLUMN token_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Set expiration to 2 hours before event for existing bookings
UPDATE bookings 
SET token_expires_at = start_time - INTERVAL '2 hours'
WHERE token_expires_at IS NULL;

-- Create function to auto-set token expiration on new bookings
CREATE OR REPLACE FUNCTION set_token_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Set token to expire 2 hours before the event
  NEW.token_expires_at := NEW.start_time - INTERVAL '2 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS set_booking_token_expiration ON bookings;

-- Create trigger for auto-setting token expiration
CREATE TRIGGER set_booking_token_expiration
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_token_expiration();

-- =============================================
-- FIX 4: CREATE SUPERADMIN AUDIT LOG (HIGH PRIORITY)
-- =============================================
-- Track all superadmin actions for accountability

-- Create audit log table
CREATE TABLE IF NOT EXISTS superadmin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON superadmin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON superadmin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON superadmin_audit_log(action);

-- Enable RLS on audit log
ALTER TABLE superadmin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read audit logs
CREATE POLICY "superadmin_read_audit_log"
ON superadmin_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users_profile 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Create function to log superadmin actions on users_profile
CREATE OR REPLACE FUNCTION log_superadmin_action()
RETURNS TRIGGER AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if user is superadmin
  SELECT EXISTS (
    SELECT 1 FROM users_profile 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  ) INTO is_admin;
  
  -- Only log if action is by superadmin and not on their own record
  IF is_admin AND auth.uid() != COALESCE(NEW.id, OLD.id) THEN
    INSERT INTO superadmin_audit_log (
      admin_id,
      action,
      target_table,
      target_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS audit_users_profile_changes ON users_profile;

-- Create trigger for auditing users_profile changes
CREATE TRIGGER audit_users_profile_changes
  AFTER INSERT OR UPDATE OR DELETE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION log_superadmin_action();

-- =============================================
-- FIX 5: STRENGTHEN EMAIL VALIDATION (MEDIUM)
-- =============================================
-- Add stronger email validation regex

-- Update bookings email check constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_guest_email_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_guest_email_check 
  CHECK (guest_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- =============================================
-- FIX 6: ADD MAX LENGTH CONSTRAINTS (MEDIUM)
-- =============================================
-- Prevent abuse with overly long inputs

-- Add max length to notes if not already constrained
DO $$ 
BEGIN
  -- Notes in bookings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'bookings' 
    AND column_name = 'notes'
    AND constraint_name LIKE '%length%'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_notes_check;
    ALTER TABLE bookings ADD CONSTRAINT bookings_notes_check 
      CHECK (length(notes) <= 1000);
  END IF;
  
  -- Description in event_types
  ALTER TABLE event_types DROP CONSTRAINT IF EXISTS event_types_description_check;
  ALTER TABLE event_types ADD CONSTRAINT event_types_description_check 
    CHECK (length(description) <= 1000);
    
  -- Username length
  ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS users_profile_username_check;
  ALTER TABLE users_profile ADD CONSTRAINT users_profile_username_check 
    CHECK (username IS NULL OR (length(username) >= 3 AND length(username) <= 30));
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify all security fixes are in place
SELECT 
  '✅ Role elevation prevention policy' AS fix,
  COUNT(*) > 0 AS implemented
FROM pg_policies 
WHERE tablename = 'users_profile' 
  AND policyname = 'prevent_role_self_elevation'

UNION ALL

SELECT 
  '✅ Booking rate limiting trigger',
  COUNT(*) > 0
FROM pg_trigger 
WHERE tgname = 'booking_rate_limit'

UNION ALL

SELECT 
  '✅ Token expiration column',
  COUNT(*) > 0
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name = 'token_expires_at'

UNION ALL

SELECT 
  '✅ Audit log table',
  COUNT(*) > 0
FROM information_schema.tables 
WHERE table_name = 'superadmin_audit_log'

UNION ALL

SELECT 
  '✅ Audit log trigger',
  COUNT(*) > 0
FROM pg_trigger 
WHERE tgname = 'audit_users_profile_changes';

-- Show current RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('users_profile', 'bookings', 'superadmin_audit_log')
ORDER BY tablename, policyname;

-- Test queries (run as authenticated user)
-- These should work:
-- SELECT * FROM users_profile WHERE id = auth.uid();
-- INSERT INTO bookings (...) VALUES (...); -- max 5 per hour
-- SELECT * FROM superadmin_audit_log; -- only if superadmin

COMMIT;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$ 
BEGIN
  RAISE NOTICE '
  ╔════════════════════════════════════════════════════════╗
  ║  🔒 CRITICAL SECURITY FIXES APPLIED SUCCESSFULLY! 🔒   ║
  ╠════════════════════════════════════════════════════════╣
  ║  ✅ Role self-elevation prevention                     ║
  ║  ✅ Booking rate limiting (5 per hour)                 ║
  ║  ✅ Token expiration (2 hours before event)            ║
  ║  ✅ Superadmin audit logging                           ║
  ║  ✅ Strengthened input validation                      ║
  ╠════════════════════════════════════════════════════════╣
  ║  📋 Next Steps:                                        ║
  ║  1. Update frontend to check token_expires_at          ║
  ║  2. Add security headers in Vite config                ║
  ║  3. Remove console.log in production                   ║
  ║  4. Test rate limiting with multiple bookings          ║
  ║  5. Review audit logs periodically                     ║
  ╚════════════════════════════════════════════════════════╝
  ';
END $$;
