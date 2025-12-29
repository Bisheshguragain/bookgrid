# Dashboard Issues - Investigation & Fix Guide

## 🔴 Issues Reported

1. **Subscription plan not showing** in the dashboard
2. **SuperAdmin dashboard not accessible** - clicking profile doesn't open SuperAdmin dashboard, just shows normal dashboard

## 🔍 Root Cause Analysis

### Issue 1: Subscription Plan Not Showing

**Likely Causes:**
1. ❌ The `subscription_plans` table doesn't exist in the database
2. ❌ Your user profile has `NULL` for `subscription_plan` column
3. ❌ The subscription service is failing to fetch the plan data

**How to Verify:**
Run `CHECK_SUBSCRIPTION_PLANS.sql` in Supabase SQL Editor to check:
- Does the `subscription_plans` table exist?
- Does your profile have a `subscription_plan` value?

### Issue 2: SuperAdmin Dashboard Not Accessible

**Likely Causes:**
1. ❌ Profile data not loaded in the Header component
2. ❌ The `isSuperAdmin` check in Header is failing
3. ❌ The SuperAdmin link is hidden or not rendering
4. ❌ React Router navigation is failing
5. ❌ The SuperAdminDashboard authorization check is redirecting you back

**How to Verify:**
1. Open browser console (F12)
2. Navigate to dashboard
3. Look for Header logs showing your profile and role
4. Click profile dropdown
5. Check if "🔐 SuperAdmin Dashboard" link appears
6. Try clicking it and watch console for errors

## 🛠️ Step-by-Step Fix

### Step 1: Check Current Database State

Run this in **Supabase SQL Editor**:

```sql
-- File: CHECK_SUBSCRIPTION_PLANS.sql
```

**Expected Output:**
- `subscription_plans_exists: true`
- 3 rows showing Free, Pro, Business plans
- Your profile showing role='superadmin' and subscription_plan='free'

**If subscription_plans_exists is FALSE:**
→ Run `CREATE_SUBSCRIPTION_PLANS_TABLE.sql`

**If your profile shows subscription_plan=NULL:**
→ Run:
```sql
UPDATE users_profile 
SET 
  subscription_plan = 'free',
  subscription_status = 'active'
WHERE email = 'bishesh.guragain@gmail.com';
```

### Step 2: Check Frontend Console Logs

1. **Open your app in the browser**
2. **Open Developer Console** (F12 or Cmd+Option+I on Mac)
3. **Navigate to Dashboard** (`/app/dashboard`)
4. **Look for these logs:**

```
📊 HEADER - Profile State:
User: bishesh.guragain@gmail.com
Profile exists: true
Profile data: { role: 'superadmin', subscription_plan: 'free', ... }

getUserSubscription called for userId: [your-id]
User profile data: { subscription_plan: 'free', ... }
Subscription plan data: { name: 'free', ... }
Dashboard subscription state: { plan: 'free', ... }
```

**If you see:**
- ❌ "Error fetching subscription plan" → subscription_plans table is missing
- ❌ "Profile is NULL" → Auth store not loading
- ❌ "subscription is null" → Subscription service failing

### Step 3: Test SuperAdmin Access

1. **On the dashboard, click your profile picture/name** in the top right
2. **Look for "🔐 SuperAdmin Dashboard"** in the dropdown
3. **If you DON'T see it:**
   - Check console for "Profile data: { role: ... }"
   - If role is not 'superadmin', run:
     ```sql
     SELECT role FROM users_profile WHERE email = 'bishesh.guragain@gmail.com';
     ```
   - Should show 'superadmin'

4. **If you DO see it, click it**
5. **Watch the console for:**
   ```
   🔐 SUPERADMIN - Authorization Check
   User ID found: [your-id]
   🔍 isSuperAdmin result: true
   ✅ User is authorized as superadmin
   ```

6. **If you see:**
   - ❌ "isSuperAdmin result: false" → Role check failing
   - ❌ "Redirecting to dashboard" → Not authorized
   - ❌ Network errors → RLS policies blocking

### Step 4: Run Browser Diagnostic

Copy and paste the contents of `BROWSER_DIAGNOSTIC.js` into your browser console while on the dashboard. This will:
- Check auth store state
- Check if profile is loaded
- Check if SuperAdmin link exists
- Check current route

### Step 5: Apply Fixes

**If subscription_plans table is missing:**
```bash
# Run this in Supabase SQL Editor:
# File: CREATE_SUBSCRIPTION_PLANS_TABLE.sql
```

**If profile has no subscription_plan:**
```sql
UPDATE users_profile 
SET 
  subscription_plan = 'free',
  subscription_status = 'active'
WHERE id = '[your-user-id]';
```

**If SuperAdmin link not showing but role is correct:**
- Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
- Clear browser cache
- Log out and log back in

**If SuperAdmin dashboard redirects you back:**
- Check if the `isSuperAdmin` function is working:
  ```sql
  SELECT id, role FROM users_profile WHERE role = 'superadmin';
  ```
- Check RLS policies on users_profile:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'users_profile';
  ```

## 📋 Quick Checklist

- [ ] Run `CHECK_SUBSCRIPTION_PLANS.sql` in Supabase
- [ ] Verify subscription_plans table exists
- [ ] Verify your profile has subscription_plan='free'
- [ ] Open browser console and navigate to dashboard
- [ ] Check for subscription banner on dashboard
- [ ] Click profile dropdown and look for SuperAdmin link
- [ ] Click SuperAdmin link and check console for errors
- [ ] Run `BROWSER_DIAGNOSTIC.js` in console
- [ ] Copy all console output and share

## 🚀 Expected Working State

**Dashboard:**
- ✅ Subscription banner showing "🆓 Free Plan"
- ✅ Stats showing event types and bookings
- ✅ Profile loaded in header

**Profile Dropdown:**
- ✅ Shows your name
- ✅ Shows "🔐 SuperAdmin" badge
- ✅ Shows "🔐 SuperAdmin Dashboard" link
- ✅ Clicking link navigates to `/app/superadmin`

**SuperAdmin Dashboard:**
- ✅ Authorization check passes
- ✅ Shows analytics, users, payments tabs
- ✅ Can see user list and statistics

## 📞 Next Steps

Please run:
1. `CHECK_SUBSCRIPTION_PLANS.sql` in Supabase → share results
2. Open browser console on dashboard → share logs
3. `BROWSER_DIAGNOSTIC.js` in browser console → share output
4. Try clicking profile → SuperAdmin → share what happens

Then I can provide targeted fixes! 🎯
