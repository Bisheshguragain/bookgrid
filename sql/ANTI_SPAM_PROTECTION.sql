-- ============================================================================
-- 🛡️ ANTI-SPAM BOOKING PROTECTION
-- ============================================================================
-- Multiple layers of protection against spam/bot bookings
-- ============================================================================

-- ============================================================================
-- LAYER 1: DATABASE RATE LIMITING
-- ============================================================================

-- Create a table to track booking attempts (by email, IP-like fingerprint)
CREATE TABLE IF NOT EXISTS public.booking_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- email or fingerprint
    identifier_type TEXT NOT NULL CHECK (identifier_type IN ('email', 'fingerprint', 'ip_hash')),
    host_user_id UUID REFERENCES users_profile(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_booking_rate_limits_identifier 
    ON public.booking_rate_limits(identifier, identifier_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_rate_limits_created 
    ON public.booking_rate_limits(created_at);

-- Enable RLS
ALTER TABLE public.booking_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage this table (not accessible to users)
CREATE POLICY "service_role_only" ON public.booking_rate_limits
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- LAYER 2: ENHANCED RATE LIMIT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_booking_rate_limit_v2(
    p_guest_email TEXT,
    p_fingerprint TEXT DEFAULT NULL,
    p_host_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_email_count_1h INTEGER;
    v_email_count_24h INTEGER;
    v_fingerprint_count_1h INTEGER;
    v_host_count_1h INTEGER;
    v_result JSONB;
BEGIN
    -- Count bookings by this email in last hour
    SELECT COUNT(*) INTO v_email_count_1h
    FROM booking_rate_limits
    WHERE identifier = LOWER(p_guest_email)
      AND identifier_type = 'email'
      AND created_at > NOW() - INTERVAL '1 hour';

    -- Count bookings by this email in last 24 hours
    SELECT COUNT(*) INTO v_email_count_24h
    FROM booking_rate_limits
    WHERE identifier = LOWER(p_guest_email)
      AND identifier_type = 'email'
      AND created_at > NOW() - INTERVAL '24 hours';

    -- Count bookings by fingerprint in last hour (if provided)
    IF p_fingerprint IS NOT NULL THEN
        SELECT COUNT(*) INTO v_fingerprint_count_1h
        FROM booking_rate_limits
        WHERE identifier = p_fingerprint
          AND identifier_type = 'fingerprint'
          AND created_at > NOW() - INTERVAL '1 hour';
    ELSE
        v_fingerprint_count_1h := 0;
    END IF;

    -- Count bookings to this host in last hour (if provided)
    IF p_host_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_host_count_1h
        FROM booking_rate_limits
        WHERE host_user_id = p_host_user_id
          AND created_at > NOW() - INTERVAL '1 hour';
    ELSE
        v_host_count_1h := 0;
    END IF;

    -- Build result
    v_result := jsonb_build_object(
        'allowed', TRUE,
        'email_1h', v_email_count_1h,
        'email_24h', v_email_count_24h,
        'fingerprint_1h', v_fingerprint_count_1h,
        'host_1h', v_host_count_1h,
        'reason', NULL
    );

    -- Check limits
    -- Limit 1: Max 10 bookings per email per hour
    IF v_email_count_1h >= 10 THEN
        v_result := jsonb_set(v_result, '{allowed}', 'false');
        v_result := jsonb_set(v_result, '{reason}', '"Too many bookings from this email. Please try again later."');
        RETURN v_result;
    END IF;

    -- Limit 2: Max 20 bookings per email per 24 hours
    IF v_email_count_24h >= 20 THEN
        v_result := jsonb_set(v_result, '{allowed}', 'false');
        v_result := jsonb_set(v_result, '{reason}', '"Daily booking limit reached. Please try again tomorrow."');
        RETURN v_result;
    END IF;

    -- Limit 3: Max 15 bookings per fingerprint per hour (bot detection)
    IF v_fingerprint_count_1h >= 15 THEN
        v_result := jsonb_set(v_result, '{allowed}', 'false');
        v_result := jsonb_set(v_result, '{reason}', '"Too many booking attempts. Please try again later."');
        RETURN v_result;
    END IF;

    -- Limit 4: Max 20 bookings to same host per hour (protects individual hosts)
    IF v_host_count_1h >= 20 THEN
        v_result := jsonb_set(v_result, '{allowed}', 'false');
        v_result := jsonb_set(v_result, '{reason}', '"This host has received too many bookings. Please try again later."');
        RETURN v_result;
    END IF;

    RETURN v_result;
END;
$$;

-- ============================================================================
-- LAYER 3: RECORD BOOKING ATTEMPT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_booking_attempt(
    p_guest_email TEXT,
    p_fingerprint TEXT DEFAULT NULL,
    p_host_user_id UUID DEFAULT NULL,
    p_booking_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Record email-based attempt
    INSERT INTO booking_rate_limits (identifier, identifier_type, host_user_id, booking_id)
    VALUES (LOWER(p_guest_email), 'email', p_host_user_id, p_booking_id);

    -- Record fingerprint-based attempt (if provided)
    IF p_fingerprint IS NOT NULL THEN
        INSERT INTO booking_rate_limits (identifier, identifier_type, host_user_id, booking_id)
        VALUES (p_fingerprint, 'fingerprint', p_host_user_id, p_booking_id);
    END IF;
END;
$$;

-- ============================================================================
-- LAYER 4: CLEANUP OLD RECORDS (Run periodically)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_booking_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    -- Delete records older than 7 days
    DELETE FROM booking_rate_limits
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- ============================================================================
-- LAYER 5: HONEYPOT DETECTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blocked_identifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    identifier_type TEXT NOT NULL CHECK (identifier_type IN ('email', 'fingerprint', 'email_domain')),
    reason TEXT,
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    blocked_until TIMESTAMPTZ, -- NULL = permanent
    created_by UUID REFERENCES users_profile(id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_identifiers 
    ON public.blocked_identifiers(identifier, identifier_type);

-- Add unique constraint for ON CONFLICT to work
ALTER TABLE public.blocked_identifiers 
    ADD CONSTRAINT blocked_identifiers_unique 
    UNIQUE (identifier, identifier_type);

-- Enable RLS - only superadmin can manage
ALTER TABLE public.blocked_identifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_manage_blocked" ON public.blocked_identifiers
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'superadmin')
    );

-- ============================================================================
-- LAYER 6: CHECK IF BLOCKED FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_identifier_blocked(
    p_email TEXT,
    p_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_blocked RECORD;
    v_email_domain TEXT;
BEGIN
    -- Extract email domain
    v_email_domain := SPLIT_PART(LOWER(p_email), '@', 2);

    -- Check if email is blocked
    SELECT * INTO v_blocked
    FROM blocked_identifiers
    WHERE identifier = LOWER(p_email)
      AND identifier_type = 'email'
      AND (blocked_until IS NULL OR blocked_until > NOW())
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object('blocked', TRUE, 'reason', v_blocked.reason);
    END IF;

    -- Check if email domain is blocked (disposable email protection)
    SELECT * INTO v_blocked
    FROM blocked_identifiers
    WHERE identifier = v_email_domain
      AND identifier_type = 'email_domain'
      AND (blocked_until IS NULL OR blocked_until > NOW())
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object('blocked', TRUE, 'reason', 'This email domain is not allowed.');
    END IF;

    -- Check if fingerprint is blocked
    IF p_fingerprint IS NOT NULL THEN
        SELECT * INTO v_blocked
        FROM blocked_identifiers
        WHERE identifier = p_fingerprint
          AND identifier_type = 'fingerprint'
          AND (blocked_until IS NULL OR blocked_until > NOW())
        LIMIT 1;

        IF FOUND THEN
            RETURN jsonb_build_object('blocked', TRUE, 'reason', v_blocked.reason);
        END IF;
    END IF;

    RETURN jsonb_build_object('blocked', FALSE);
END;
$$;

-- ============================================================================
-- SEED: BLOCK COMMON DISPOSABLE EMAIL DOMAINS
-- ============================================================================

INSERT INTO blocked_identifiers (identifier, identifier_type, reason) VALUES
    ('tempmail.com', 'email_domain', 'Disposable email not allowed'),
    ('throwaway.email', 'email_domain', 'Disposable email not allowed'),
    ('guerrillamail.com', 'email_domain', 'Disposable email not allowed'),
    ('mailinator.com', 'email_domain', 'Disposable email not allowed'),
    ('10minutemail.com', 'email_domain', 'Disposable email not allowed'),
    ('fakeinbox.com', 'email_domain', 'Disposable email not allowed'),
    ('trashmail.com', 'email_domain', 'Disposable email not allowed'),
    ('yopmail.com', 'email_domain', 'Disposable email not allowed')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

-- Allow public to check rate limits (needed for booking flow)
GRANT EXECUTE ON FUNCTION public.check_booking_rate_limit_v2 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_booking_attempt TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_identifier_blocked TO anon, authenticated;

-- Only service_role can cleanup
GRANT EXECUTE ON FUNCTION public.cleanup_booking_rate_limits TO service_role;

-- ============================================================================
-- LAYER 7: ENHANCED BOOKING ATTEMPTS TRACKING
-- ============================================================================
-- Track detailed booking attempts for pattern analysis and honeypot detection

CREATE TABLE IF NOT EXISTS public.booking_attempts_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifiers
    guest_email TEXT,
    fingerprint TEXT,
    ip_hash TEXT,  -- Store hashed IP, not raw IP
    
    -- What they tried to book
    event_type_id UUID REFERENCES public.event_types(id) ON DELETE SET NULL,
    host_user_id UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    
    -- Attempt result
    was_allowed BOOLEAN DEFAULT true,
    was_successful BOOLEAN DEFAULT false,  -- Did they complete the booking?
    block_reason TEXT,
    
    -- Bot detection signals
    form_load_time TIMESTAMPTZ,
    submit_time TIMESTAMPTZ DEFAULT NOW(),
    time_on_form_ms INTEGER,  -- Milliseconds spent on form
    honeypot_triggered BOOLEAN DEFAULT false,
    javascript_enabled BOOLEAN DEFAULT true,
    
    -- Request metadata
    user_agent TEXT,
    referrer TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analysis
CREATE INDEX IF NOT EXISTS idx_booking_attempts_log_email_time 
    ON public.booking_attempts_log(guest_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_attempts_log_fingerprint_time 
    ON public.booking_attempts_log(fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_attempts_log_honeypot 
    ON public.booking_attempts_log(honeypot_triggered) WHERE honeypot_triggered = true;
CREATE INDEX IF NOT EXISTS idx_booking_attempts_log_blocked 
    ON public.booking_attempts_log(was_allowed, created_at DESC) WHERE was_allowed = false;

-- RLS - service role only
ALTER TABLE public.booking_attempts_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_booking_attempts_log" ON public.booking_attempts_log
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Admins can view (but not modify)
CREATE POLICY "admin_view_booking_attempts_log" ON public.booking_attempts_log
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- ============================================================================
-- LAYER 8: COMPREHENSIVE SPAM CHECK FUNCTION
-- ============================================================================
-- Single function that checks ALL anti-spam layers

CREATE OR REPLACE FUNCTION public.check_booking_allowed(
    p_guest_email TEXT,
    p_fingerprint TEXT DEFAULT NULL,
    p_host_user_id UUID DEFAULT NULL,
    p_event_type_id UUID DEFAULT NULL,
    p_form_load_time TIMESTAMPTZ DEFAULT NULL,
    p_honeypot_value TEXT DEFAULT NULL,
    p_ip_hash TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_blocked JSONB;
    v_rate_limit JSONB;
    v_time_on_form_ms INTEGER;
    v_log_id UUID;
    v_block_reason TEXT := NULL;
    v_allowed BOOLEAN := true;
BEGIN
    -- ==========================================
    -- CHECK 1: Honeypot Detection (instant fail)
    -- ==========================================
    -- Bots often fill hidden form fields
    IF p_honeypot_value IS NOT NULL AND TRIM(p_honeypot_value) != '' THEN
        v_allowed := false;
        v_block_reason := 'honeypot_triggered';
        
        -- Log and return immediately (don't reveal why)
        INSERT INTO booking_attempts_log (
            guest_email, fingerprint, ip_hash, event_type_id, host_user_id,
            was_allowed, block_reason, honeypot_triggered, user_agent
        ) VALUES (
            LOWER(p_guest_email), p_fingerprint, p_ip_hash, p_event_type_id, p_host_user_id,
            false, v_block_reason, true, p_user_agent
        );
        
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'Unable to process your request. Please try again.'
        );
    END IF;

    -- ==========================================
    -- CHECK 2: Time-Based Bot Detection
    -- ==========================================
    -- Real humans take at least 3-5 seconds to fill a form
    IF p_form_load_time IS NOT NULL THEN
        v_time_on_form_ms := EXTRACT(MILLISECONDS FROM (NOW() - p_form_load_time))::INTEGER +
                            EXTRACT(SECONDS FROM (NOW() - p_form_load_time))::INTEGER * 1000;
        
        -- Less than 2 seconds = very likely a bot
        IF v_time_on_form_ms < 2000 THEN
            v_allowed := false;
            v_block_reason := 'submitted_too_fast';
            
            INSERT INTO booking_attempts_log (
                guest_email, fingerprint, ip_hash, event_type_id, host_user_id,
                form_load_time, time_on_form_ms, was_allowed, block_reason, user_agent
            ) VALUES (
                LOWER(p_guest_email), p_fingerprint, p_ip_hash, p_event_type_id, p_host_user_id,
                p_form_load_time, v_time_on_form_ms, false, v_block_reason, p_user_agent
            );
            
            RETURN jsonb_build_object(
                'allowed', false,
                'reason', 'Please take a moment to fill out the form completely.'
            );
        END IF;
    END IF;

    -- ==========================================
    -- CHECK 3: Blocked Identifiers
    -- ==========================================
    v_blocked := public.is_identifier_blocked(p_guest_email, p_fingerprint);
    
    IF (v_blocked->>'blocked')::BOOLEAN THEN
        INSERT INTO booking_attempts_log (
            guest_email, fingerprint, ip_hash, event_type_id, host_user_id,
            form_load_time, time_on_form_ms, was_allowed, block_reason, user_agent
        ) VALUES (
            LOWER(p_guest_email), p_fingerprint, p_ip_hash, p_event_type_id, p_host_user_id,
            p_form_load_time, v_time_on_form_ms, false, 'blocked_identifier', p_user_agent
        );
        
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', COALESCE(v_blocked->>'reason', 'Unable to process your request.')
        );
    END IF;

    -- ==========================================
    -- CHECK 4: Rate Limits
    -- ==========================================
    v_rate_limit := public.check_booking_rate_limit_v2(p_guest_email, p_fingerprint, p_host_user_id);
    
    IF NOT (v_rate_limit->>'allowed')::BOOLEAN THEN
        INSERT INTO booking_attempts_log (
            guest_email, fingerprint, ip_hash, event_type_id, host_user_id,
            form_load_time, time_on_form_ms, was_allowed, block_reason, user_agent
        ) VALUES (
            LOWER(p_guest_email), p_fingerprint, p_ip_hash, p_event_type_id, p_host_user_id,
            p_form_load_time, v_time_on_form_ms, false, 'rate_limited', p_user_agent
        );
        
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', v_rate_limit->>'reason'
        );
    END IF;

    -- ==========================================
    -- ALL CHECKS PASSED - Log and allow
    -- ==========================================
    INSERT INTO booking_attempts_log (
        guest_email, fingerprint, ip_hash, event_type_id, host_user_id,
        form_load_time, time_on_form_ms, was_allowed, user_agent
    ) VALUES (
        LOWER(p_guest_email), p_fingerprint, p_ip_hash, p_event_type_id, p_host_user_id,
        p_form_load_time, v_time_on_form_ms, true, p_user_agent
    ) RETURNING id INTO v_log_id;
    
    RETURN jsonb_build_object(
        'allowed', true,
        'attempt_id', v_log_id
    );
END;
$$;

-- ============================================================================
-- LAYER 9: MARK BOOKING SUCCESS
-- ============================================================================
-- Call this after a booking is successfully created to update tracking

CREATE OR REPLACE FUNCTION public.mark_booking_success(
    p_attempt_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE booking_attempts_log
    SET was_successful = true
    WHERE id = p_attempt_id;
END;
$$;

-- ============================================================================
-- LAYER 10: EXPANDED DISPOSABLE EMAIL DOMAINS
-- ============================================================================

INSERT INTO blocked_identifiers (identifier, identifier_type, reason) VALUES
    ('sharklasers.com', 'email_domain', 'Disposable email not allowed'),
    ('getnada.com', 'email_domain', 'Disposable email not allowed'),
    ('maildrop.cc', 'email_domain', 'Disposable email not allowed'),
    ('temp-mail.org', 'email_domain', 'Disposable email not allowed'),
    ('discard.email', 'email_domain', 'Disposable email not allowed'),
    ('emailondeck.com', 'email_domain', 'Disposable email not allowed'),
    ('mohmal.com', 'email_domain', 'Disposable email not allowed'),
    ('tempail.com', 'email_domain', 'Disposable email not allowed'),
    ('burnermail.io', 'email_domain', 'Disposable email not allowed'),
    ('spamgourmet.com', 'email_domain', 'Disposable email not allowed'),
    ('guerrillamail.info', 'email_domain', 'Disposable email not allowed'),
    ('guerrillamail.net', 'email_domain', 'Disposable email not allowed'),
    ('grr.la', 'email_domain', 'Disposable email not allowed'),
    ('pokemail.net', 'email_domain', 'Disposable email not allowed'),
    ('spam4.me', 'email_domain', 'Disposable email not allowed'),
    ('mytemp.email', 'email_domain', 'Disposable email not allowed'),
    ('throwawaymail.com', 'email_domain', 'Disposable email not allowed'),
    ('getairmail.com', 'email_domain', 'Disposable email not allowed'),
    ('mailnesia.com', 'email_domain', 'Disposable email not allowed'),
    ('tempmailaddress.com', 'email_domain', 'Disposable email not allowed'),
    ('tmpmail.org', 'email_domain', 'Disposable email not allowed'),
    ('tmpmail.net', 'email_domain', 'Disposable email not allowed'),
    ('emailfake.com', 'email_domain', 'Disposable email not allowed'),
    ('crazymailing.com', 'email_domain', 'Disposable email not allowed'),
    ('mintemail.com', 'email_domain', 'Disposable email not allowed'),
    ('inboxkitten.com', 'email_domain', 'Disposable email not allowed'),
    ('mailsac.com', 'email_domain', 'Disposable email not allowed')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LAYER 11: MONITORING & ANALYTICS VIEWS
-- ============================================================================

-- View: Suspicious activity in the last 24 hours
CREATE OR REPLACE VIEW public.spam_monitoring_24h AS
SELECT 
    guest_email,
    fingerprint,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE was_allowed = false) as blocked_attempts,
    COUNT(*) FILTER (WHERE honeypot_triggered) as honeypot_triggers,
    COUNT(*) FILTER (WHERE time_on_form_ms IS NOT NULL AND time_on_form_ms < 3000) as fast_submissions,
    COUNT(*) FILTER (WHERE was_successful) as successful_bookings,
    MIN(created_at) as first_attempt,
    MAX(created_at) as last_attempt
FROM booking_attempts_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY guest_email, fingerprint
HAVING COUNT(*) > 3 OR COUNT(*) FILTER (WHERE was_allowed = false) > 0
ORDER BY total_attempts DESC;

-- View: Block statistics
CREATE OR REPLACE VIEW public.spam_block_stats AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE was_allowed = false) as blocked,
    COUNT(*) FILTER (WHERE block_reason = 'honeypot_triggered') as honeypot_blocks,
    COUNT(*) FILTER (WHERE block_reason = 'submitted_too_fast') as timing_blocks,
    COUNT(*) FILTER (WHERE block_reason = 'blocked_identifier') as identifier_blocks,
    COUNT(*) FILTER (WHERE block_reason = 'rate_limited') as rate_limit_blocks,
    ROUND(100.0 * COUNT(*) FILTER (WHERE was_allowed = false) / NULLIF(COUNT(*), 0), 2) as block_percentage
FROM booking_attempts_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- View: Top blocked fingerprints (likely bots)
CREATE OR REPLACE VIEW public.top_blocked_fingerprints AS
SELECT 
    fingerprint,
    COUNT(*) as block_count,
    COUNT(DISTINCT guest_email) as unique_emails_used,
    ARRAY_AGG(DISTINCT block_reason) as block_reasons,
    MAX(created_at) as last_attempt
FROM booking_attempts_log
WHERE was_allowed = false
  AND fingerprint IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY fingerprint
HAVING COUNT(*) >= 3
ORDER BY block_count DESC
LIMIT 50;

-- ============================================================================
-- LAYER 12: AUTO-BLOCK REPEAT OFFENDERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_block_repeat_offenders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_blocked_count INTEGER := 0;
    v_record RECORD;
BEGIN
    -- Auto-block fingerprints with 10+ blocked attempts in 24 hours
    FOR v_record IN 
        SELECT fingerprint, COUNT(*) as block_count
        FROM booking_attempts_log
        WHERE was_allowed = false
          AND fingerprint IS NOT NULL
          AND created_at > NOW() - INTERVAL '24 hours'
        GROUP BY fingerprint
        HAVING COUNT(*) >= 10
    LOOP
        INSERT INTO blocked_identifiers (identifier, identifier_type, reason, blocked_until)
        VALUES (v_record.fingerprint, 'fingerprint', 
                'Auto-blocked: ' || v_record.block_count || ' blocked attempts in 24h',
                NOW() + INTERVAL '7 days')
        ON CONFLICT (identifier, identifier_type) DO UPDATE
        SET blocked_until = GREATEST(blocked_identifiers.blocked_until, NOW() + INTERVAL '7 days'),
            reason = 'Auto-blocked: repeat offender';
        
        v_blocked_count := v_blocked_count + 1;
    END LOOP;

    -- Auto-block emails with 5+ honeypot triggers (definitely a bot)
    FOR v_record IN 
        SELECT guest_email, COUNT(*) as trigger_count
        FROM booking_attempts_log
        WHERE honeypot_triggered = true
          AND guest_email IS NOT NULL
          AND created_at > NOW() - INTERVAL '7 days'
        GROUP BY guest_email
        HAVING COUNT(*) >= 5
    LOOP
        INSERT INTO blocked_identifiers (identifier, identifier_type, reason)
        VALUES (LOWER(v_record.guest_email), 'email', 
                'Auto-blocked: honeypot triggered ' || v_record.trigger_count || ' times')
        ON CONFLICT (identifier, identifier_type) DO NOTHING;
        
        v_blocked_count := v_blocked_count + 1;
    END LOOP;

    RETURN v_blocked_count;
END;
$$;

-- ============================================================================
-- LAYER 13: CLEANUP OLD LOGS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_booking_attempts_log()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    -- Keep 30 days of logs
    DELETE FROM booking_attempts_log
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    -- Also cleanup expired blocks
    DELETE FROM blocked_identifiers
    WHERE blocked_until IS NOT NULL AND blocked_until < NOW();
    
    RETURN v_deleted;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS FOR NEW FUNCTIONS
-- ============================================================================

-- Public booking check
GRANT EXECUTE ON FUNCTION public.check_booking_allowed TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_booking_success TO anon, authenticated;

-- Admin/service functions
GRANT EXECUTE ON FUNCTION public.auto_block_repeat_offenders TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_booking_attempts_log TO service_role;

-- Monitoring views for admins
GRANT SELECT ON public.spam_monitoring_24h TO authenticated;
GRANT SELECT ON public.spam_block_stats TO authenticated;
GRANT SELECT ON public.top_blocked_fingerprints TO authenticated;

-- ============================================================================
-- USAGE EXAMPLE FOR FRONTEND
-- ============================================================================
/*
Frontend Implementation Guide:

1. HONEYPOT FIELD (Hidden from real users, bots fill it):
   
   <input 
     type="text" 
     name="website" 
     style="opacity: 0; position: absolute; top: 0; left: 0; height: 0; width: 0; z-index: -1;"
     tabindex="-1"
     autocomplete="off"
   />

2. TRACK FORM LOAD TIME:
   
   const formLoadTime = new Date().toISOString();

3. GENERATE BROWSER FINGERPRINT:
   
   // Using FingerprintJS (recommended)
   import FingerprintJS from '@fingerprintjs/fingerprintjs';
   const fp = await FingerprintJS.load();
   const result = await fp.get();
   const fingerprint = result.visitorId;

4. BEFORE SUBMITTING BOOKING, CHECK IF ALLOWED:
   
   const { data, error } = await supabase.rpc('check_booking_allowed', {
     p_guest_email: formData.email,
     p_fingerprint: fingerprint,
     p_host_user_id: eventType.user_id,
     p_event_type_id: eventType.id,
     p_form_load_time: formLoadTime,
     p_honeypot_value: formData.website,  // honeypot field
     p_user_agent: navigator.userAgent
   });

   if (!data.allowed) {
     showError(data.reason);
     return;
   }

5. AFTER SUCCESSFUL BOOKING:
   
   await supabase.rpc('mark_booking_success', {
     p_attempt_id: data.attempt_id
   });
   
   await supabase.rpc('record_booking_attempt', {
     p_guest_email: formData.email,
     p_fingerprint: fingerprint,
     p_host_user_id: eventType.user_id,
     p_booking_id: newBooking.id
   });

6. CRON JOBS (Set up in Supabase):
   
   -- Run every hour: Auto-block repeat offenders
   SELECT public.auto_block_repeat_offenders();
   
   -- Run daily: Cleanup old logs
   SELECT public.cleanup_booking_attempts_log();
   SELECT public.cleanup_booking_rate_limits();
*/
