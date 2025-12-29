# Database Issues Fix Guide

## Issues Identified

Based on the conversation summary, the following issues need to be addressed:

1. **Event Type Creation** - Forms are not saving to database
2. **Availability Rule Creation** - Forms are not saving to database
3. **Possible RLS Policy Issues** - Policies may be blocking inserts
4. **Database Migration** - New features migration may not be applied

## Root Causes

### 1. RLS Policies for Event Types
The current RLS policy for event_types uses:
```sql
CREATE POLICY "Users can manage their own event types" ON event_types
    FOR ALL USING (auth.uid() = user_id);
```

**Problem**: This policy only applies to SELECT, UPDATE, DELETE. For INSERT operations, we need `WITH CHECK` clause.

### 2. Missing INSERT Policy
The `FOR ALL` clause should handle inserts, but we need to ensure the `WITH CHECK` condition is properly defined.

### 3. Date Range Fields
The migration adds `date_range_start` and `date_range_end` columns, but they need to be properly nullable.

## Solutions

### Solution 1: Fix RLS Policies for Event Types

Run this in Supabase SQL Editor:

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own event types" ON event_types;

-- Create separate policies for better control
CREATE POLICY "Users can view their own event types" ON event_types
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event types" ON event_types
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event types" ON event_types
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event types" ON event_types
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Also allow public to read active event types (for booking page)
CREATE POLICY "Anyone can view active event types" ON event_types
    FOR SELECT 
    USING (is_active = true);
```

### Solution 2: Fix RLS Policies for Availability Rules

Run this in Supabase SQL Editor:

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own availability" ON availability_rules;

-- Create separate policies for better control
CREATE POLICY "Users can view their own availability" ON availability_rules
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own availability" ON availability_rules
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability" ON availability_rules
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability" ON availability_rules
    FOR DELETE 
    USING (auth.uid() = user_id);
```

### Solution 3: Ensure Migration is Applied

Run the migration script at `/migrations/001_add_new_features.sql` in Supabase SQL Editor.

### Solution 4: Verify Table Structure

Run the debug script at `/debug-database.sql` to verify:
- Tables exist
- Columns are correct
- Constraints are in place
- RLS policies are active

## Step-by-Step Fix Process

### Step 1: Apply RLS Policy Fixes
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run Solution 1 (Event Types RLS Policies)
4. Run Solution 2 (Availability Rules RLS Policies)

### Step 2: Verify Migration
1. In SQL Editor, run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'event_types' AND column_name IN ('date_range_start', 'date_range_end');`
2. If empty, run the migration: `/migrations/001_add_new_features.sql`

### Step 3: Test Database Setup
1. Run the debug script: `/debug-database.sql`
2. Verify all checks pass

### Step 4: Test in Application
1. Login to the app
2. Try creating an event type
3. Try creating an availability rule
4. Check browser console for any errors
5. Check Supabase logs for policy violations

## Additional Debugging

### Check Supabase Logs
1. Go to Supabase Dashboard > Logs
2. Look for "permission denied" or "policy violation" errors
3. Check the timestamp when you tried to create event/availability

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Try creating event type again
4. Look for error messages from Supabase client

### Test RLS Policies Directly
Run this test query in Supabase SQL Editor (replace USER_ID with actual user ID):

```sql
-- Test insert (as user)
SET request.jwt.claim.sub = 'USER_ID_HERE';

INSERT INTO event_types (user_id, title, duration, location_type)
VALUES ('USER_ID_HERE', 'Test Event', 30, 'zoom')
RETURNING *;
```

## Expected Results

After applying all fixes:
1. ✅ Event types can be created without errors
2. ✅ Availability rules can be created without errors
3. ✅ Date range fields save properly
4. ✅ All location types are supported
5. ✅ RLS policies protect user data correctly

## Common Errors and Solutions

### Error: "new row violates row-level security policy"
**Solution**: Apply Solution 1 and Solution 2 above

### Error: "column 'date_range_start' does not exist"
**Solution**: Apply the migration script

### Error: "new row for relation violates check constraint"
**Solution**: Check that location_type is one of the allowed values

### Error: "null value in column 'user_id' violates not-null constraint"
**Solution**: Ensure user is logged in and `auth.uid()` is available

## Verification Checklist

- [ ] Migration applied (date range columns exist)
- [ ] RLS policies updated for event_types
- [ ] RLS policies updated for availability_rules
- [ ] Debug script shows all tables exist
- [ ] Debug script shows RLS enabled on all tables
- [ ] Can create event type in UI
- [ ] Can create availability rule in UI
- [ ] Can edit event type in UI
- [ ] Can delete event type in UI
- [ ] Can delete availability rule in UI
- [ ] Date range selection works
- [ ] All location types selectable
- [ ] Calendar view displays bookings
