-- =====================================================
-- CHECK FOR MISSING SUBSCRIPTION COLUMNS
-- =====================================================

-- Check which subscription-related columns exist in users_profile
SELECT 
  'Column exists: ' || column_name as status,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users_profile'
  AND (
    column_name = 'subscription_plan' OR
    column_name = 'subscription_status' OR
    column_name = 'bookings_this_month' OR
    column_name = 'subscription_start_date' OR
    column_name = 'subscription_end_date' OR
    column_name = 'last_booking_reset'
  )
ORDER BY column_name;

-- Show expected columns vs actual
SELECT 
  column_name,
  CASE 
    WHEN column_name IN (
      'subscription_plan',
      'subscription_status', 
      'bookings_this_month'
    ) THEN '✅ REQUIRED'
    ELSE '📋 OPTIONAL'
  END as importance
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users_profile'
  AND column_name LIKE '%subscription%' OR column_name = 'bookings_this_month'
ORDER BY importance DESC, column_name;
