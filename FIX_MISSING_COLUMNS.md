# 🚨 FIX: Missing Subscription Columns

## Problem
The `users_profile` table is missing subscription-related columns:
- `subscription_plan`
- `subscription_status`
- `subscription_start_date`
- `subscription_end_date`
- `role`
- `last_active`

## Solution - Run These Scripts in Order

### Step 1: Add Missing Columns (1 minute)

1. Open Supabase Dashboard → SQL Editor
2. Run this file: **`add_missing_subscription_columns.sql`**
3. You should see output like:
   ```
   NOTICE: Added subscription_plan column
   NOTICE: Added subscription_status column
   NOTICE: Added subscription_start_date column
   NOTICE: Added subscription_end_date column
   NOTICE: Added role column
   NOTICE: Added last_active column
   ```
4. The final SELECT should show all 6 columns

### Step 2: Update Your Profile (30 seconds)

1. Still in Supabase SQL Editor
2. Run this file: **`final_profile_update.sql`**
3. You should see output like:
   ```
   NOTICE: Updated role to superadmin
   NOTICE: Updated subscription to business plan
   NOTICE: Complete Profile:
   NOTICE:   Email: bishesh.guragain@gmail.com
   NOTICE:   Name: Bishesh Guragain
   NOTICE:   Role: superadmin
   NOTICE:   Plan: business
   NOTICE:   Status: active
   ```

### Step 3: Verify Everything Works (30 seconds)

1. Run this file: **`verify_superadmin_setup.sql`**
2. Check that your profile shows:
   - `role = 'superadmin'`
   - `subscription_plan = 'business'`
   - `subscription_status = 'active'`
   - `full_name = 'Bishesh Guragain'`

### Step 4: Test in Browser (2 minutes)

1. **Clear browser cache completely**
   - Chrome: Cmd+Shift+Delete
   - Select "Cached images and files"
   - Click "Clear data"

2. **Sign out and sign in again** to BookGrid

3. **Check profile dropdown:**
   - Should show "Bishesh Guragain" (not email)
   - Should show "🔐 SuperAdmin" badge
   - Should have "🔐 SuperAdmin Dashboard" link

4. **Test SuperAdmin dashboard:**
   - Click "SuperAdmin Dashboard"
   - Should load without errors
   - Should show stats and user list

## Quick Verification

Run this in Supabase to check if columns exist:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users_profile'
AND column_name IN (
    'subscription_plan', 
    'subscription_status', 
    'role', 
    'full_name'
)
ORDER BY column_name;
```

**Expected output:** All 4 column names should be listed

## If You Still Get Errors

### Error: "column does not exist"
→ Make sure you ran `add_missing_subscription_columns.sql` first

### Error: "permission denied"
→ Check that you're using the Supabase service role key

### No output from final_profile_update.sql
→ That's OK! Check the Messages tab for NOTICE outputs

## Files to Run (in order)

1. ✅ `add_missing_subscription_columns.sql` - Adds missing columns
2. ✅ `final_profile_update.sql` - Updates your profile
3. ✅ `verify_superadmin_setup.sql` - Verifies everything

## After Fixing

Once all scripts run successfully:
- Clear browser cache
- Sign in again
- Profile should show your name
- SuperAdmin features should work

---

**Time to complete:** ~5 minutes total

**Success indicator:** All scripts run without errors, profile shows correct data
