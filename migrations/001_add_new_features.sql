-- Migration to add new features
-- Run this in Supabase SQL Editor

-- Step 1: Add new location types to event_types table
-- First, drop the constraint if it exists
ALTER TABLE event_types DROP CONSTRAINT IF EXISTS event_types_location_type_check;

-- Add the new constraint with all location types
ALTER TABLE event_types ADD CONSTRAINT event_types_location_type_check 
CHECK (location_type IN ('zoom', 'google_meet', 'microsoft_teams', 'phone', 'in_person', 'webex', 'skype', 'custom'));

-- Step 2: Add date range columns to event_types table
ALTER TABLE event_types 
ADD COLUMN IF NOT EXISTS date_range_start DATE,
ADD COLUMN IF NOT EXISTS date_range_end DATE;

-- Step 3: Add constraint to ensure end date is after start date
ALTER TABLE event_types 
ADD CONSTRAINT valid_date_range 
CHECK (date_range_end IS NULL OR date_range_start IS NULL OR date_range_end >= date_range_start);

-- Step 4: Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'event_types'
ORDER BY ordinal_position;

-- Step 5: Test query to ensure everything works
SELECT id, title, location_type, date_range_start, date_range_end
FROM event_types
LIMIT 5;
