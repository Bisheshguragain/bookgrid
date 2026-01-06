# Default Timezone Change Documentation

**Date:** January 6, 2026  
**Change:** Default timezone for new users changed from `America/New_York (Eastern Time)` to `Europe/London (GMT/BST)`

---

## Summary

All new user signups will now default to **Europe/London** timezone instead of **America/New_York**. This ensures a better user experience for users in the UK and Europe.

---

## What Changed

### 1. Database Schema
- **File:** `src/lib/database-schema.sql`
- **Change:** Updated `users_profile.time_zone` default value
```sql
-- Before
time_zone TEXT DEFAULT 'America/New_York',

-- After
time_zone TEXT DEFAULT 'Europe/London',
```

### 2. User Profile Creation Trigger
- **File:** `fix-user-profiles.sql`
- **Function:** `handle_new_user()`
- **Change:** New users are created with London timezone
```sql
-- Before
'America/New_York'

-- After
'Europe/London'
```

### 3. Settings Page Default
- **File:** `src/pages/Settings.tsx`
- **Change:** Form initialization uses London timezone
```tsx
// Before
time_zone: 'America/New_York',

// After
time_zone: 'Europe/London',
```

### 4. Database Migration
- **File:** `migrations/set_default_timezone_london.sql`
- **Purpose:** SQL migration to apply changes to production database

---

## Impact

### ✅ New Users
- All new signups after this change will have `Europe/London` as default timezone
- Users see meeting times in GMT/BST format
- Better experience for UK and European users

### ℹ️ Existing Users
- **No automatic changes** to existing user profiles
- Current timezone preferences are preserved
- Users can manually update timezone in Settings if desired

### 🔧 Timezone Options Available
Users can still select from all supported timezones in Settings:
- Europe/London (GMT/BST) - **NEW DEFAULT**
- America/New_York (Eastern Time)
- America/Chicago (Central Time)
- America/Los_Angeles (Pacific Time)
- America/Denver (Mountain Time)
- Europe/Paris (Central European Time)
- Asia/Tokyo (Japan Standard Time)
- Asia/Dubai (Gulf Standard Time)
- Australia/Sydney (Australian Eastern Time)
- Pacific/Auckland (New Zealand Time)
- And more...

---

## How to Apply This Change

### Step 1: Run Database Migration
Execute the migration file in your Supabase SQL Editor:

```bash
# File: migrations/set_default_timezone_london.sql
```

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire content from `migrations/set_default_timezone_london.sql`
3. Paste and run the SQL
4. Verify the success messages

### Step 2: Verify the Change
Run this query to confirm:

```sql
-- Check default timezone setting
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
  AND column_name = 'time_zone';

-- Should return: 'Europe/London'
```

### Step 3: Test with New User
1. Sign up a new test user
2. After email confirmation and first login
3. Go to Settings → Profile
4. Verify timezone shows "Europe/London (GMT/BST)"

---

## Optional: Update Existing Users

If you want to change existing users from Eastern Time to London time, run this query:

```sql
UPDATE users_profile 
SET time_zone = 'Europe/London' 
WHERE time_zone = 'America/New_York';
```

⚠️ **Warning:** This will affect all existing users. Consider:
- Notifying users before making bulk changes
- Allowing users to opt-in instead
- Only updating users who haven't customized their timezone

---

## Technical Details

### Database Function
The `handle_new_user()` trigger function runs automatically when a new user is created in `auth.users`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name, username, time_zone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1)),
    'Europe/London'  -- ← Changed from 'America/New_York'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Trigger Setup
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## User Experience

### Before (Eastern Time)
```
New user signs up → Default timezone: America/New_York (ET)
Meeting at 10:00 AM shown as: 10:00 AM ET
User in London sees: 10:00 AM ET (needs to convert to 3:00 PM GMT)
```

### After (London Time)
```
New user signs up → Default timezone: Europe/London (GMT)
Meeting at 10:00 AM shown as: 10:00 AM GMT
User in London sees: 10:00 AM GMT (their local time)
```

---

## Files Modified

1. ✅ `src/lib/database-schema.sql` - Schema default value
2. ✅ `fix-user-profiles.sql` - Trigger function
3. ✅ `src/pages/Settings.tsx` - Form default
4. ✅ `migrations/set_default_timezone_london.sql` - Migration script (NEW)
5. ✅ `TIMEZONE_CHANGE.md` - This documentation (NEW)

---

## Testing Checklist

- [ ] Run migration in Supabase SQL Editor
- [ ] Verify default timezone in database schema
- [ ] Create new test user account
- [ ] Confirm new user has Europe/London timezone
- [ ] Verify user can change timezone in Settings
- [ ] Test booking flow shows times in GMT/BST
- [ ] Confirm existing users unaffected

---

## Rollback Plan

If you need to revert to Eastern Time:

```sql
-- Revert database default
ALTER TABLE users_profile 
  ALTER COLUMN time_zone SET DEFAULT 'America/New_York';

-- Revert trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name, username, time_zone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1)),
    'America/New_York'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Support

### Common Questions

**Q: Will this affect my existing users?**  
A: No, existing users keep their current timezone settings.

**Q: Can users change their timezone?**  
A: Yes, users can change timezone anytime in Settings → Profile.

**Q: What timezone format is used?**  
A: IANA timezone database format (e.g., `Europe/London`, `America/New_York`).

**Q: Does this affect bookings?**  
A: Bookings store both host and guest timezones. Each party sees times in their own timezone.

**Q: Will existing bookings be affected?**  
A: No, existing bookings retain their original timezone data.

---

## Conclusion

✅ **Default timezone successfully changed to Europe/London**  
✅ **All new users will use London timezone by default**  
✅ **Existing users remain unchanged**  
✅ **Users can customize timezone in Settings**

This change improves the user experience for UK and European users while maintaining flexibility for global users.

---

*Last Updated: January 6, 2026*
