-- Calendly Clone Database Schema

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create users_profile table
CREATE TABLE IF NOT EXISTS users_profile (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE,
    time_zone TEXT DEFAULT 'America/New_York',
    avatar_url TEXT,
    default_meeting_duration INTEGER DEFAULT 30,
    company_name TEXT, -- Optional company name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_types table
CREATE TABLE IF NOT EXISTS event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (length(title) <= 100),
    description TEXT CHECK (length(description) <= 500),
    duration INTEGER NOT NULL DEFAULT 30,
    location_type TEXT CHECK (location_type IN ('zoom', 'google_meet', 'microsoft_teams', 'phone', 'in_person', 'webex', 'skype', 'custom')) DEFAULT 'zoom',
    location_value TEXT,
    color TEXT DEFAULT '#3b82f6',
    max_attendees INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    reminder_offsets INTEGER[] DEFAULT '{1440, 60}', -- 24h, 1h in minutes
    date_range_start DATE,
    date_range_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (date_range_end IS NULL OR date_range_start IS NULL OR date_range_end >= date_range_start)
);

-- Create availability_rules table
CREATE TABLE IF NOT EXISTS availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    buffer_before INTEGER DEFAULT 0,
    buffer_after INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create event_type_overrides table for specific date availability
CREATE TABLE IF NOT EXISTS event_type_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type_id UUID REFERENCES event_types(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    is_available BOOLEAN NOT NULL,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
    event_type_id UUID REFERENCES event_types(id) ON DELETE CASCADE NOT NULL,
    guest_name TEXT NOT NULL CHECK (length(guest_name) >= 2 AND length(guest_name) <= 100),
    guest_email TEXT NOT NULL CHECK (guest_email ~ '^[^@]+@[^@]+\.[^@]+$'),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT CHECK (status IN ('confirmed', 'cancelled', 'rescheduled')) DEFAULT 'confirmed',
    notes TEXT CHECK (length(notes) <= 500),
    meeting_method TEXT, -- Optional meeting method (e.g., Zoom, Phone, etc.)
    reschedule_token UUID DEFAULT gen_random_uuid(),
    cancel_token UUID DEFAULT gen_random_uuid(),
    guest_time_zone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_booking_time CHECK (end_time > start_time)
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    reminder_offset_minutes INTEGER NOT NULL,
    status TEXT CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create global_settings table
CREATE TABLE IF NOT EXISTS global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL UNIQUE,
    minimum_notice_hours INTEGER DEFAULT 24,
    max_events_per_day INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_types_user_id ON event_types(user_id);
CREATE INDEX IF NOT EXISTS idx_event_types_active ON event_types(is_active);
CREATE INDEX IF NOT EXISTS idx_availability_rules_user_id ON availability_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_rules_day ON availability_rules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_type ON bookings(event_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_reminders_booking_id ON reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_at ON reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

-- Row Level Security Policies
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_type_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can read their own profile" ON users_profile
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users_profile
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users_profile
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Event types policies (granular for better control)
CREATE POLICY "Users can view their own event types" ON event_types
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event types" ON event_types
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event types" ON event_types
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event types" ON event_types
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active event types" ON event_types
    FOR SELECT USING (is_active = true);

-- Availability rules policies (granular for better control)
CREATE POLICY "Users can view their own availability" ON availability_rules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own availability" ON availability_rules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability" ON availability_rules
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability" ON availability_rules
    FOR DELETE USING (auth.uid() = user_id);

-- Event type overrides policies
CREATE POLICY "Users can manage their event overrides" ON event_type_overrides
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM event_types et 
            WHERE et.id = event_type_overrides.event_type_id 
            AND et.user_id = auth.uid()
        )
    );

-- Bookings policies
CREATE POLICY "Users can read their own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON bookings
    FOR INSERT WITH CHECK (true); -- Anyone can create bookings

CREATE POLICY "Users can update their own bookings" ON bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Reminders policies
CREATE POLICY "Users can read their reminders" ON reminders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.id = reminders.booking_id 
            AND b.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their reminders" ON reminders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.id = reminders.booking_id 
            AND b.user_id = auth.uid()
        )
    );

-- Global settings policies
CREATE POLICY "Users can manage their own settings" ON global_settings
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_profile_updated_at BEFORE UPDATE ON users_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_types_updated_at BEFORE UPDATE ON event_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_rules_updated_at BEFORE UPDATE ON availability_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_settings_updated_at BEFORE UPDATE ON global_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper functions for analytics
CREATE OR REPLACE FUNCTION get_booking_metrics(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
    total_bookings BIGINT,
    confirmed_count BIGINT,
    cancelled_count BIGINT,
    avg_bookings_per_day NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed')::BIGINT as confirmed_count,
        COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_count,
        ROUND(COUNT(*)::NUMERIC / GREATEST(EXTRACT(DAY FROM (p_end_date - p_start_date))::NUMERIC, 1), 2) as avg_bookings_per_day
    FROM bookings 
    WHERE user_id = p_user_id 
        AND start_time >= p_start_date 
        AND start_time <= p_end_date;
END;
$$;

CREATE OR REPLACE FUNCTION get_bookings_over_time(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(date_label TEXT, booking_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(start_time, 'YYYY-MM-DD') as date_label,
        COUNT(*)::BIGINT as booking_count
    FROM bookings 
    WHERE user_id = p_user_id 
        AND start_time >= p_start_date 
        AND start_time <= p_end_date
    GROUP BY TO_CHAR(start_time, 'YYYY-MM-DD')
    ORDER BY date_label;
END;
$$;

CREATE OR REPLACE FUNCTION get_bookings_by_event_type(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(event_type_title TEXT, booking_count BIGINT, percentage NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH event_stats AS (
        SELECT 
            et.title,
            COUNT(b.id) as count
        FROM event_types et
        LEFT JOIN bookings b ON et.id = b.event_type_id 
            AND b.user_id = p_user_id
            AND b.start_time >= p_start_date 
            AND b.start_time <= p_end_date
        WHERE et.user_id = p_user_id
        GROUP BY et.title
    ),
    total_bookings AS (
        SELECT SUM(count) as total FROM event_stats
    )
    SELECT 
        es.title as event_type_title,
        es.count::BIGINT as booking_count,
        CASE 
            WHEN tb.total > 0 THEN ROUND((es.count::NUMERIC / tb.total::NUMERIC) * 100, 2)
            ELSE 0
        END as percentage
    FROM event_stats es, total_bookings tb
    ORDER BY es.count DESC;
END;
$$;
