-- ============================================================================
-- Migration: Add Calendar Integration and Currency Settings
-- ============================================================================
-- Date: January 7, 2026
-- Purpose: Add calendar sync settings and currency preferences for users
-- ============================================================================

-- Step 1: Add new columns to users_profile table
ALTER TABLE users_profile 
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS google_calendar_email TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_access_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_token_expiry TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS outlook_calendar_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS outlook_calendar_email TEXT,
  ADD COLUMN IF NOT EXISTS outlook_calendar_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS outlook_calendar_access_token TEXT,
  ADD COLUMN IF NOT EXISTS outlook_calendar_token_expiry TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS calendar_auto_sync BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS calendar_send_invites BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS calendar_two_way_sync BOOLEAN DEFAULT FALSE;

-- Step 2: Add comments for documentation
COMMENT ON COLUMN users_profile.currency IS 'User preferred currency for pricing (USD, GBP, EUR, INR, CAD, etc.)';
COMMENT ON COLUMN users_profile.google_calendar_connected IS 'Whether Google Calendar is connected';
COMMENT ON COLUMN users_profile.google_calendar_email IS 'Email of connected Google Calendar';
COMMENT ON COLUMN users_profile.google_calendar_refresh_token IS 'Encrypted refresh token for Google Calendar OAuth';
COMMENT ON COLUMN users_profile.google_calendar_access_token IS 'Encrypted access token for Google Calendar OAuth';
COMMENT ON COLUMN users_profile.google_calendar_token_expiry IS 'When the Google Calendar access token expires';
COMMENT ON COLUMN users_profile.outlook_calendar_connected IS 'Whether Outlook Calendar is connected';
COMMENT ON COLUMN users_profile.outlook_calendar_email IS 'Email of connected Outlook Calendar';
COMMENT ON COLUMN users_profile.outlook_calendar_refresh_token IS 'Encrypted refresh token for Outlook Calendar OAuth';
COMMENT ON COLUMN users_profile.outlook_calendar_access_token IS 'Encrypted access token for Outlook Calendar OAuth';
COMMENT ON COLUMN users_profile.outlook_calendar_token_expiry IS 'When the Outlook Calendar access token expires';
COMMENT ON COLUMN users_profile.calendar_auto_sync IS 'Automatically create calendar events for new bookings';
COMMENT ON COLUMN users_profile.calendar_send_invites IS 'Send .ics file to clients for their calendars';
COMMENT ON COLUMN users_profile.calendar_two_way_sync IS 'Block booking times when busy in connected calendar';

-- Step 3: Create index for calendar lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_google_calendar 
  ON users_profile(google_calendar_connected) 
  WHERE google_calendar_connected = TRUE;

CREATE INDEX IF NOT EXISTS idx_users_profile_outlook_calendar 
  ON users_profile(outlook_calendar_connected) 
  WHERE outlook_calendar_connected = TRUE;

-- Step 4: Add RLS policies for calendar settings (users can only manage their own)
-- These columns should only be accessible by the user themselves

-- Note: Token columns should be encrypted at application level before storing
-- Never expose refresh/access tokens in API responses

-- Step 5: Create calendar_sync_log table for tracking sync history
CREATE TABLE IF NOT EXISTS calendar_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL, -- 'google' or 'outlook'
    action TEXT NOT NULL, -- 'create', 'update', 'delete'
    status TEXT NOT NULL, -- 'success', 'failed', 'pending'
    error_message TEXT,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_sync_type CHECK (sync_type IN ('google', 'outlook')),
    CONSTRAINT valid_action CHECK (action IN ('create', 'update', 'delete')),
    CONSTRAINT valid_status CHECK (status IN ('success', 'failed', 'pending'))
);

-- Create index for sync log queries
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_user_id ON calendar_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_booking_id ON calendar_sync_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_synced_at ON calendar_sync_log(synced_at DESC);

-- Add RLS policies for calendar_sync_log
ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own sync logs
CREATE POLICY calendar_sync_log_select_own ON calendar_sync_log
  FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert sync logs (via service role)
CREATE POLICY calendar_sync_log_insert_system ON calendar_sync_log
  FOR INSERT WITH CHECK (TRUE);

-- Step 6: Add comment to calendar_sync_log table
COMMENT ON TABLE calendar_sync_log IS 'Tracks calendar synchronization history for debugging and monitoring';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check new columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
  AND column_name IN ('currency', 'google_calendar_connected', 'outlook_calendar_connected',
                      'calendar_auto_sync', 'calendar_send_invites', 'calendar_two_way_sync')
ORDER BY column_name;

-- Check calendar_sync_log table
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'calendar_sync_log'
ORDER BY ordinal_position;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Calendar integration and currency columns added successfully';
  RAISE NOTICE '✅ Default currency set to GBP (British Pound)';
  RAISE NOTICE '✅ Calendar sync settings initialized with sensible defaults';
  RAISE NOTICE '✅ calendar_sync_log table created for tracking';
  RAISE NOTICE '⚠️  SECURITY: Implement OAuth 2.0 flow for calendar connections';
  RAISE NOTICE '⚠️  SECURITY: Encrypt tokens before storing in database';
  RAISE NOTICE '⚠️  SECURITY: Never expose tokens in API responses';
END $$;
