-- Sample data for Calendly Clone

-- Insert sample users (these would normally be created via Supabase Auth)
-- Note: In production, these would be created through the signup flow

-- Sample user profiles
INSERT INTO users_profile (id, email, full_name, username, time_zone, avatar_url, default_meeting_duration) VALUES
('11111111-1111-1111-1111-111111111111', 'john.doe@example.com', 'John Doe', 'johndoe', 'America/New_York', 'https://i.pravatar.cc/150?u=john', 30),
('22222222-2222-2222-2222-222222222222', 'jane.smith@example.com', 'Jane Smith', 'janesmith', 'America/Los_Angeles', 'https://i.pravatar.cc/150?u=jane', 30),
('33333333-3333-3333-3333-333333333333', 'mike.wilson@example.com', 'Mike Wilson', 'mikewilson', 'Europe/London', 'https://i.pravatar.cc/150?u=mike', 45)
ON CONFLICT (id) DO NOTHING;

-- Global settings for users
INSERT INTO global_settings (user_id, minimum_notice_hours, max_events_per_day) VALUES
('11111111-1111-1111-1111-111111111111', 24, 8),
('22222222-2222-2222-2222-222222222222', 12, 6),
('33333333-3333-3333-3333-333333333333', 48, 5)
ON CONFLICT (user_id) DO NOTHING;

-- Sample event types
INSERT INTO event_types (id, user_id, title, description, duration, location_type, location_value, color, max_attendees, is_active, reminder_offsets) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '30 Minute Meeting', 'Quick sync or consultation call', 30, 'zoom', 'https://zoom.us/j/123456789', '#3b82f6', 1, true, '{1440, 60}'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Strategy Session', 'Deep dive into strategy and planning', 60, 'google_meet', 'meet.google.com/abc-def-ghi', '#10b981', 3, true, '{2880, 1440, 60}'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Coffee Chat', 'Informal conversation over coffee', 30, 'custom', 'Starbucks on Main St', '#f59e0b', 1, true, '{1440}'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Product Demo', 'Live demonstration of our product', 45, 'zoom', 'https://zoom.us/j/987654321', '#8b5cf6', 10, true, '{1440, 60}'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'One-on-One', 'Personal consultation session', 60, 'phone', '+1-555-0123', '#ef4444', 1, true, '{1440, 60, 15}'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'Team Standup', 'Daily team synchronization', 15, 'google_meet', 'meet.google.com/xyz-abc-123', '#06b6d4', 8, true, '{60}'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', '33333333-3333-3333-3333-333333333333', 'Technical Interview', 'Coding interview for candidates', 90, 'zoom', 'https://zoom.us/j/456789123', '#7c3aed', 2, false, '{2880, 1440}')
ON CONFLICT (id) DO NOTHING;

-- Sample availability rules
INSERT INTO availability_rules (id, user_id, day_of_week, start_time, end_time, buffer_before, buffer_after) VALUES
-- John Doe (Monday-Friday, 9 AM - 5 PM EST)
('r1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, '09:00', '17:00', 15, 15),
('r1111112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 2, '09:00', '17:00', 15, 15),
('r1111113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 3, '09:00', '17:00', 15, 15),
('r1111114-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 4, '09:00', '17:00', 15, 15),
('r1111115-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 5, '09:00', '17:00', 15, 15),

-- Jane Smith (Monday-Friday, 8 AM - 4 PM PST, Wednesday afternoons off)
('r2222221-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 1, '08:00', '16:00', 10, 10),
('r2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 2, '08:00', '16:00', 10, 10),
('r2222223-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 3, '08:00', '12:00', 10, 10),
('r2222224-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 4, '08:00', '16:00', 10, 10),
('r2222225-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 5, '08:00', '16:00', 10, 10),

-- Mike Wilson (Monday-Thursday, 9 AM - 6 PM GMT, Friday mornings only)
('r3333331-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 1, '09:00', '18:00', 5, 5),
('r3333332-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 2, '09:00', '18:00', 5, 5),
('r3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 3, '09:00', '18:00', 5, 5),
('r3333334-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 4, '09:00', '18:00', 5, 5),
('r3333335-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 5, '09:00', '12:00', 5, 5)
ON CONFLICT (id) DO NOTHING;

-- Sample bookings (mix of past, current, and future)
INSERT INTO bookings (id, user_id, event_type_id, guest_name, guest_email, start_time, end_time, status, notes, guest_time_zone) VALUES
-- Past bookings
('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Johnson', 'alice.johnson@email.com', '2024-12-20 14:00:00+00:00', '2024-12-20 14:30:00+00:00', 'confirmed', 'Looking forward to discussing the project requirements.', 'America/New_York'),
('b1111112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bob Smith', 'bob.smith@company.com', '2024-12-21 15:00:00+00:00', '2024-12-21 16:00:00+00:00', 'confirmed', 'Strategy planning for Q1 2024', 'America/Chicago'),
('b1111113-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Carol Davis', 'carol.davis@startup.io', '2024-12-22 10:00:00+00:00', '2024-12-22 10:45:00+00:00', 'cancelled', 'Product demo - rescheduled', 'America/Los_Angeles'),

-- Current/Recent bookings
('b2222221-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'David Wilson', 'david.wilson@techcorp.com', '2024-12-26 09:00:00+00:00', '2024-12-26 09:15:00+00:00', 'confirmed', 'Daily standup', 'Europe/London'),
('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Emma Brown', 'emma.brown@freelancer.com', '2024-12-26 16:00:00+00:00', '2024-12-26 16:30:00+00:00', 'confirmed', 'Networking coffee chat', 'America/New_York'),

-- Future bookings
('b3333331-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Frank Miller', 'frank.miller@client.org', '2024-12-28 11:00:00+00:00', '2024-12-28 12:00:00+00:00', 'confirmed', 'Consultation about digital transformation', 'America/Denver'),
('b3333332-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Grace Lee', 'grace.lee@agency.com', '2024-12-30 14:30:00+00:00', '2024-12-30 15:00:00+00:00', 'confirmed', 'Quick sync on project status', 'America/New_York'),
('b3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'Henry Zhang', 'henry.zhang@candidate.dev', '2025-01-02 14:00:00+00:00', '2025-01-02 15:30:00+00:00', 'confirmed', 'Senior Frontend Developer interview', 'Asia/Shanghai'),
('b3333334-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Isabel Rodriguez', 'isabel.rodriguez@enterprise.com', '2025-01-03 13:00:00+00:00', '2025-01-03 13:45:00+00:00', 'confirmed', 'Product demo for enterprise features', 'America/Los_Angeles'),
('b3333335-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jack Thompson', 'jack.thompson@consulting.com', '2025-01-05 10:00:00+00:00', '2025-01-05 11:00:00+00:00', 'confirmed', 'Strategic planning workshop', 'Europe/Paris'),

-- Some cancelled bookings
('b4444441-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kate Wilson', 'kate.wilson@email.com', '2024-12-25 15:00:00+00:00', '2024-12-25 15:30:00+00:00', 'cancelled', 'Cancelled due to holiday', 'America/New_York'),
('b4444442-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Luke Johnson', 'luke.johnson@startup.tech', '2024-12-24 12:00:00+00:00', '2024-12-24 13:00:00+00:00', 'cancelled', 'Client cancelled last minute', 'America/Los_Angeles'),

-- Some rescheduled bookings
('b5555551-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Maria Garcia', 'maria.garcia@team.co', '2025-01-06 09:00:00+00:00', '2025-01-06 09:15:00+00:00', 'rescheduled', 'Moved from earlier time slot', 'Europe/Madrid')
ON CONFLICT (id) DO NOTHING;

-- Sample reminders
INSERT INTO reminders (booking_id, reminder_offset_minutes, status, scheduled_at) VALUES
-- Pending reminders for future bookings
('b3333331-3333-3333-3333-333333333333', 1440, 'pending', '2024-12-27 11:00:00+00:00'), -- 24h before Frank Miller
('b3333331-3333-3333-3333-333333333333', 60, 'pending', '2024-12-28 10:00:00+00:00'), -- 1h before Frank Miller
('b3333332-3333-3333-3333-333333333333', 1440, 'pending', '2024-12-29 14:30:00+00:00'), -- 24h before Grace Lee
('b3333332-3333-3333-3333-333333333333', 60, 'pending', '2024-12-30 13:30:00+00:00'), -- 1h before Grace Lee
('b3333333-3333-3333-3333-333333333333', 2880, 'pending', '2025-01-01 14:00:00+00:00'), -- 48h before Henry Zhang
('b3333333-3333-3333-3333-333333333333', 1440, 'pending', '2025-01-01 14:00:00+00:00'), -- 24h before Henry Zhang
('b3333334-3333-3333-3333-333333333333', 1440, 'pending', '2025-01-02 13:00:00+00:00'), -- 24h before Isabel Rodriguez
('b3333334-3333-3333-3333-333333333333', 60, 'pending', '2025-01-03 12:00:00+00:00'), -- 1h before Isabel Rodriguez
('b3333335-3333-3333-3333-333333333333', 2880, 'pending', '2025-01-03 10:00:00+00:00'), -- 48h before Jack Thompson
('b3333335-3333-3333-3333-333333333333', 1440, 'pending', '2025-01-04 10:00:00+00:00'), -- 24h before Jack Thompson
('b3333335-3333-3333-3333-333333333333', 60, 'pending', '2025-01-05 09:00:00+00:00'), -- 1h before Jack Thompson

-- Some sent reminders for past bookings
('b1111111-1111-1111-1111-111111111111', 1440, 'sent', '2024-12-19 14:00:00+00:00'),
('b1111111-1111-1111-1111-111111111111', 60, 'sent', '2024-12-20 13:00:00+00:00'),
('b1111112-1111-1111-1111-111111111111', 2880, 'sent', '2024-12-19 15:00:00+00:00'),
('b1111112-1111-1111-1111-111111111111', 1440, 'sent', '2024-12-20 15:00:00+00:00'),
('b1111112-1111-1111-1111-111111111111', 60, 'sent', '2024-12-21 14:00:00+00:00'),
('b2222221-2222-2222-2222-222222222222', 60, 'sent', '2024-12-26 08:00:00+00:00'),
('b2222222-2222-2222-2222-222222222222', 1440, 'sent', '2024-12-25 16:00:00+00:00')
ON CONFLICT DO NOTHING;
