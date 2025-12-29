# 🔍 SuperAdmin Users Not Showing - Troubleshooting Guide

## Issue
The Users tab in the SuperAdmin dashboard is empty or not showing any users.

## Most Likely Causes

### 1. Row Level Security (RLS) Blocking the Query ⚠️ (Most Common)
**Symptoms:**
- Users tab is empty
- No errors in console
- Query returns 0 results

**Fix:** Run the RLS policy migration

---

## 🚀 Quick Fix Steps

### Step 1: Run the RLS Policy Migration

**File:** `migrations/fix_superadmin_rls_policies.sql`

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire contents of `migrations/fix_superadmin_rls_policies.sql`
4. Click **Run**

**What this does:**
- Adds a policy to allow superadmins to view ALL users
- Adds a policy to allow regular users to view their own profile
- Adds a policy to allow superadmins to update any user

### Step 2: Check Browser Console

1. Open SuperAdmin Dashboard
2. Press `F12` to open Developer Tools
3. Click the **Console** tab
4. Click on **Users** tab in the dashboard
5. Look for log messages:
   ```
   Loading users tab...
   getAllUsers - Raw response: { data: [...], error: null, count: X }
   getAllUsers - Found X users, fetching stats...
   Users loaded: { count: X, total: X }
   ```

**If you see errors:**
- Screenshot the error
- Check the error message
- See troubleshooting sections below

### Step 3: Verify Database Has Users

Run this in Supabase SQL Editor:

```sql
SELECT id, email, full_name, role, account_status
FROM users_profile
LIMIT 10;
```

**Expected:** Should show at least one user (bishesh.guragain@gmail.com)

**If empty:** You need to create a user first!

---

## 🔧 Detailed Diagnostics

### Run the Debug Script

**File:** `debug_users_not_showing.sql`

1. Open Supabase SQL Editor
2. Copy the entire debug script
3. Run each query one by one
4. Check the results

**Key checks:**
1. ✅ Users exist in database
2. ✅ Superadmin user has `role = 'superadmin'`
3. ✅ RLS policies exist and are correct
4. ✅ All required columns exist

---

## 🐛 Common Issues and Solutions

### Issue 1: RLS is Blocking Queries

**Symptoms:**
- Query returns empty array
- No error in console
- Users exist in database but don't show

**Solution:**
Run `migrations/fix_superadmin_rls_policies.sql`

**Verify the fix:**
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users_profile';
```

Should see:
- "Users can view own profile"
- "Superadmin can view all users"
- "Superadmin can update all users"

---

### Issue 2: User Doesn't Have Superadmin Role

**Symptoms:**
- Authorization check passes (dashboard loads)
- But query returns no users

**Check:**
```sql
SELECT id, email, role FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';
```

**If role is not 'superadmin':**
```sql
UPDATE users_profile
SET role = 'superadmin'
WHERE email = 'bishesh.guragain@gmail.com';
```

---

### Issue 3: Missing Columns in Database

**Symptoms:**
- Error in console: "column does not exist"

**Check:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users_profile'
AND column_name IN (
  'id', 'email', 'full_name', 'username',
  'subscription_plan', 'subscription_status',
  'role', 'account_status', 'last_active_at',
  'deletion_notice_sent_at', 'scheduled_deletion_at',
  'created_at', 'bookings_this_month'
);
```

**If any columns are missing:**
Run the full superadmin migration: `migrations/add_superadmin_system.sql`

---

### Issue 4: TypeScript / Frontend Error

**Symptoms:**
- Error in browser console
- React component error

**Check browser console for:**
- Network errors (check Network tab in DevTools)
- TypeScript errors
- React errors

**Common fixes:**
- Clear browser cache: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Restart dev server: Stop and run `npm run dev` again
- Check if Supabase is connected

---

### Issue 5: No Users in Database

**Symptoms:**
- Query succeeds but returns empty array
- Total count is 0

**Solution:**
You need to create users! Sign up through your app or manually insert:

```sql
INSERT INTO users_profile (
  id,
  email,
  full_name,
  username,
  subscription_plan,
  subscription_status,
  role,
  account_status,
  last_active_at,
  created_at
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  'Test User',
  'testuser',
  'free',
  'active',
  'user',
  'active',
  NOW(),
  NOW()
);
```

---

## 📊 Expected Console Output

When working correctly, you should see:

```javascript
// When clicking Users tab:
Loading users tab...

getAllUsers - Raw response: {
  data: [
    {
      id: "uuid-here",
      email: "bishesh.guragain@gmail.com",
      full_name: "Bishesh Guragain",
      // ... more fields
    },
    // ... more users
  ],
  error: null,
  count: 5
}

getAllUsers - Found 5 users, fetching stats...
getAllUsers - Returning users with stats: [...]
Users loaded: { count: 5, total: 5 }
```

---

## 🔍 Step-by-Step Debugging

### 1. Open Browser Console
Press `F12` and go to Console tab

### 2. Click Users Tab
Watch for console logs

### 3. Check for Errors
Look for red error messages

### 4. Check Network Tab
- Go to Network tab in DevTools
- Filter by "users_profile"
- Click on the request
- Check **Response** tab
- Should see array of users

### 5. Check if Data is Reaching React
Add this temporarily to `SuperAdminDashboard.tsx`:

```typescript
useEffect(() => {
  console.log('Users state:', users);
  console.log('Users total:', usersTotal);
}, [users, usersTotal]);
```

---

## 🔐 RLS Policy Details

The correct RLS policies should be:

### Policy 1: Users View Own Profile
```sql
CREATE POLICY "Users can view own profile"
ON users_profile
FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

### Policy 2: Superadmin Views All Users
```sql
CREATE POLICY "Superadmin can view all users"
ON users_profile
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role = 'superadmin'
  )
);
```

### Policy 3: Superadmin Updates All Users
```sql
CREATE POLICY "Superadmin can update all users"
ON users_profile
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role = 'superadmin'
  )
);
```

---

## ✅ Checklist

Before asking for help, verify:

- [ ] Ran `migrations/fix_superadmin_rls_policies.sql`
- [ ] User has `role = 'superadmin'` in database
- [ ] Users exist in database (checked with SQL)
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API call
- [ ] Cleared browser cache and refreshed
- [ ] Dev server restarted
- [ ] Checked all required columns exist
- [ ] RLS policies are correctly set

---

## 🆘 Still Not Working?

### Share This Information:

1. **Browser Console Output:**
   - Copy all logs when clicking Users tab
   - Include any errors (red text)

2. **Database Check:**
   ```sql
   SELECT COUNT(*) FROM users_profile;
   SELECT role FROM users_profile WHERE email = 'bishesh.guragain@gmail.com';
   ```

3. **RLS Policies:**
   ```sql
   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users_profile';
   ```

4. **Network Response:**
   - Open Network tab in DevTools
   - Click Users tab
   - Find the `users_profile` request
   - Copy the Response

---

## 🎯 The Fix (99% of Cases)

**Run this migration:** `migrations/fix_superadmin_rls_policies.sql`

**Then:**
1. Sign out of the app
2. Clear browser cache (`Cmd+Shift+R`)
3. Sign back in
4. Open SuperAdmin Dashboard
5. Click Users tab
6. Users should now appear!

---

**Last Updated:** December 28, 2025
**Status:** Debugging tools and fixes ready
