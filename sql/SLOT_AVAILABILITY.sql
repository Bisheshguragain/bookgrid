-- ============================================
-- SLOT AVAILABILITY MANAGEMENT
-- BookGrid - Prevent Double Booking System
-- ============================================

-- ============================================
-- 1. FUNCTION: Check if a time slot is available
-- This function checks existing bookings to prevent double-booking
-- ============================================
CREATE OR REPLACE FUNCTION check_slot_availability(
  p_user_id UUID,
  p_event_type_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  -- Check for overlapping confirmed bookings
  -- A slot is unavailable if there's any overlap with existing confirmed bookings
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings b
  WHERE b.user_id = p_user_id
    AND b.status = 'confirmed'
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id)
    -- Check for time overlap: (StartA < EndB) AND (EndA > StartB)
    AND b.start_time < p_end_time
    AND b.end_time > p_start_time;
  
  -- Return TRUE if no conflicts (slot is available)
  RETURN v_conflict_count = 0;
END;
$$;

-- ============================================
-- 2. FUNCTION: Get available slots for a date
-- Returns all available time slots for a specific date based on:
-- - User's availability rules for that day of week
-- - Existing confirmed bookings (excluded from available slots)
-- ============================================
CREATE OR REPLACE FUNCTION get_available_slots(
  p_user_id UUID,
  p_event_type_id UUID,
  p_date DATE,
  p_duration_minutes INTEGER DEFAULT 30,
  p_slot_interval_minutes INTEGER DEFAULT 30,
  p_timezone TEXT DEFAULT 'America/New_York'
)
RETURNS TABLE (
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day_of_week INTEGER;
  v_rule RECORD;
  v_slot_time TIMESTAMPTZ;
  v_slot_end TIMESTAMPTZ;
  v_date_start TIMESTAMPTZ;
  v_buffer_before INTEGER;
  v_buffer_after INTEGER;
BEGIN
  -- Get the day of week (0=Sunday, 6=Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Loop through each availability rule for this day
  FOR v_rule IN
    SELECT ar.start_time, ar.end_time, ar.buffer_before, ar.buffer_after
    FROM availability_rules ar
    WHERE ar.user_id = p_user_id
      AND ar.day_of_week = v_day_of_week
    ORDER BY ar.start_time
  LOOP
    -- Calculate the starting timestamp for this rule
    v_date_start := (p_date::TEXT || ' ' || v_rule.start_time::TEXT)::TIMESTAMPTZ AT TIME ZONE p_timezone;
    v_buffer_before := COALESCE(v_rule.buffer_before, 0);
    v_buffer_after := COALESCE(v_rule.buffer_after, 0);
    
    -- Generate slots within this availability window
    v_slot_time := v_date_start;
    
    WHILE v_slot_time + (p_duration_minutes || ' minutes')::INTERVAL <= 
          (p_date::TEXT || ' ' || v_rule.end_time::TEXT)::TIMESTAMPTZ AT TIME ZONE p_timezone
    LOOP
      v_slot_end := v_slot_time + (p_duration_minutes || ' minutes')::INTERVAL;
      
      -- Check if this slot is in the future (with buffer)
      IF v_slot_time > (NOW() + (v_buffer_before || ' minutes')::INTERVAL) THEN
        -- Check if slot is available (no overlapping bookings)
        RETURN QUERY
        SELECT 
          v_slot_time,
          v_slot_end,
          check_slot_availability(p_user_id, p_event_type_id, v_slot_time, v_slot_end);
      END IF;
      
      -- Move to next slot
      v_slot_time := v_slot_time + (p_slot_interval_minutes || ' minutes')::INTERVAL;
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$;

-- ============================================
-- 3. FUNCTION: Book a slot with availability check
-- Attempts to book a slot, returns success/failure
-- Uses advisory lock to prevent race conditions
-- ============================================
CREATE OR REPLACE FUNCTION book_slot(
  p_user_id UUID,
  p_event_type_id UUID,
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL,
  p_guest_time_zone TEXT DEFAULT 'America/New_York'
)
RETURNS TABLE (
  success BOOLEAN,
  booking_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_available BOOLEAN;
  v_booking_id UUID;
  v_lock_key BIGINT;
BEGIN
  -- Generate a lock key based on user_id and time slot
  -- This prevents race conditions when multiple users try to book the same slot
  v_lock_key := hashtext(p_user_id::TEXT || p_start_time::TEXT);
  
  -- Acquire advisory lock (will wait if another transaction has it)
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Check slot availability
  v_is_available := check_slot_availability(p_user_id, p_event_type_id, p_start_time, p_end_time);
  
  IF NOT v_is_available THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'This time slot is no longer available. Please select another time.';
    RETURN;
  END IF;
  
  -- Create the booking
  INSERT INTO bookings (
    user_id,
    event_type_id,
    guest_name,
    guest_email,
    start_time,
    end_time,
    notes,
    guest_time_zone,
    status
  ) VALUES (
    p_user_id,
    p_event_type_id,
    p_guest_name,
    p_guest_email,
    p_start_time,
    p_end_time,
    p_notes,
    p_guest_time_zone,
    'confirmed'
  )
  RETURNING id INTO v_booking_id;
  
  RETURN QUERY SELECT TRUE, v_booking_id, NULL::TEXT;
END;
$$;

-- ============================================
-- 4. TRIGGER: Validate booking doesn't conflict
-- Additional safety layer - prevents INSERT/UPDATE if slot is taken
-- ============================================
CREATE OR REPLACE FUNCTION validate_booking_no_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  -- Only check for confirmed bookings
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;
  
  -- Check for conflicts
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings b
  WHERE b.user_id = NEW.user_id
    AND b.status = 'confirmed'
    AND b.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND b.start_time < NEW.end_time
    AND b.end_time > NEW.start_time;
  
  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Booking conflict: This time slot overlaps with an existing booking';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS booking_conflict_check ON bookings;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER booking_conflict_check
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_no_conflict();

-- ============================================
-- 5. INDEX: Improve booking conflict query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bookings_slot_lookup 
ON bookings (user_id, status, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_bookings_confirmed_time
ON bookings (user_id, start_time, end_time)
WHERE status = 'confirmed';

-- ============================================
-- 6. VIEW: Active bookings for slot checking
-- Provides a clean interface for checking booked slots
-- ============================================
CREATE OR REPLACE VIEW active_bookings_slots AS
SELECT 
  b.user_id,
  b.event_type_id,
  b.start_time,
  b.end_time,
  b.guest_name,
  b.id as booking_id
FROM bookings b
WHERE b.status = 'confirmed'
  AND b.end_time > NOW();

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION check_slot_availability TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_available_slots TO authenticated, anon;
GRANT EXECUTE ON FUNCTION book_slot TO anon;
GRANT SELECT ON active_bookings_slots TO authenticated, anon;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test: Check slot availability
-- SELECT check_slot_availability(
--   'user-uuid-here',
--   'event-type-uuid-here',
--   '2025-01-15 10:00:00+00',
--   '2025-01-15 10:30:00+00'
-- );

-- Test: Get available slots for a date
-- SELECT * FROM get_available_slots(
--   'user-uuid-here',
--   'event-type-uuid-here',
--   '2025-01-15',
--   30,  -- duration
--   30,  -- interval
--   'America/New_York'
-- );

COMMENT ON FUNCTION check_slot_availability IS 'Checks if a time slot is available for booking (no conflicts with existing confirmed bookings)';
COMMENT ON FUNCTION get_available_slots IS 'Returns all available time slots for a given date based on availability rules and existing bookings';
COMMENT ON FUNCTION book_slot IS 'Atomically books a slot with conflict prevention using advisory locks';
COMMENT ON TRIGGER booking_conflict_check ON bookings IS 'Prevents booking conflicts at the database level';
