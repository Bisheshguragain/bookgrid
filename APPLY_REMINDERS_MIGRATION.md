# Apply Auto Reminders Migration

**Date:** January 14, 2026  
**Status:** 🔴 **REQUIRED - Migration Not Applied Yet**

---

## Problem

When toggling the "Auto Reminders" setting, you see this error:
```
Failed to update setting. Please try again.
```

**Root Cause:** The `auto_reminders_enabled` column doesn't exist in the `users_profile` table yet.

---

## Solution: Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project dashboard
   - Navigate to: **SQL Editor** (left sidebar)

2. **Copy the Migration SQL:**
   - Open the file: `migrations/add_auto_reminders_settings.sql`
   - Copy ALL the contents

3. **Run the Migration:**
   - Paste the SQL into the Supabase SQL Editor
   - Click **"RUN"** button
   - Wait for success message

4. **Verify:**
   - You should see in the output:
     ```
     ✅ Auto reminders enabled column added successfully
     ✅ Default set to TRUE (auto reminders enabled by default)
     ```
   - Also check the verification query results showing the new column

---

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Make sure you're in the project directory
cd /Users/millionairemindset/Calendly

# Apply the migration
supabase db push --db-url "YOUR_SUPABASE_DATABASE_URL"
```

Or run it directly:

```bash
psql "YOUR_SUPABASE_DATABASE_URL" -f migrations/add_auto_reminders_settings.sql
```

---

### Option 3: Manual SQL Execution

Copy and paste this into your Supabase SQL Editor:

```sql
-- Add auto_reminders_enabled column
ALTER TABLE users_profile 
  ADD COLUMN IF NOT EXISTS auto_reminders_enabled BOOLEAN DEFAULT TRUE;

-- Add documentation
COMMENT ON COLUMN users_profile.auto_reminders_enabled 
  IS 'Whether automatic appointment reminders are enabled for this user';
```

---

## What This Migration Does

✅ Adds `auto_reminders_enabled` column to `users_profile` table  
✅ Sets default value to `TRUE` (auto reminders enabled by default)  
✅ Applies to all existing and new users  
✅ Non-destructive (won't delete any data)  

---

## After Migration

Once the migration is applied:

1. ✅ The toggle will work without errors
2. ✅ Users can enable/disable auto reminders
3. ✅ Setting will persist in the database
4. ✅ Default value is `TRUE` (enabled) for all users

---

## Testing After Migration

1. **Go to the Reminders page:**
   ```
   /dashboard/reminders
   ```

2. **Test the toggle:**
   - Click the toggle to disable auto reminders
   - Should see: "Auto reminders disabled successfully!"
   - Click again to enable
   - Should see: "Auto reminders enabled successfully!"

3. **Verify in database:**
   ```sql
   SELECT id, email, auto_reminders_enabled 
   FROM users_profile 
   WHERE id = 'YOUR_USER_ID';
   ```

---

## If You Still Get Errors

### Error: "column does not exist"
- **Solution:** The migration wasn't applied successfully. Try again.

### Error: "permission denied"
- **Solution:** Make sure you're using an admin/service role connection to Supabase.

### Error: "relation users_profile does not exist"
- **Solution:** Run the main database schema first (`src/lib/database-schema.sql`).

---

## Rollback (If Needed)

If you need to undo this migration:

```sql
-- Remove the column
ALTER TABLE users_profile 
  DROP COLUMN IF EXISTS auto_reminders_enabled;
```

⚠️ **Warning:** This will delete all user preferences for auto reminders!

---

## Files Involved

- ✅ `migrations/add_auto_reminders_settings.sql` - Migration file
- ✅ `src/pages/Reminders.tsx` - Uses the column
- ✅ `src/lib/database.types.ts` - TypeScript type definition

---

## Support

If you continue to have issues:

1. Check the browser console for detailed error messages
2. Check Supabase logs for SQL errors
3. Verify your database connection is working
4. Make sure RLS policies allow updates to `users_profile`

---

*Last Updated: January 14, 2026*
