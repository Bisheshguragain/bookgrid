# Debug Dashboard Issues

## Issues Reported
1. **Subscription plan not showing** in the dashboard
2. **SuperAdmin dashboard not opening** when clicking profile dropdown

## How to Debug

### Issue 1: Subscription Plan Not Showing

**Open Browser Console (F12 or Cmd+Option+I)** and look for these logs:

1. When you load the dashboard, look for:
   ```
   getUserSubscription called for userId: [your-user-id]
   User profile data: [profile object]
   Subscription plan data: [plan object]
   Dashboard subscription state: [subscription object]
   ```

2. **Check for errors:**
   - "Error fetching subscription plan" → The `subscription_plans` table might be missing
   - "No profile found" → The profile isn't loading correctly
   - "subscription is null" → The subscription data isn't being set

3. **Expected behavior:**
   - You should see a subscription banner at the top of the dashboard
   - It should show "🆓 Free Plan" or whatever plan you're on
   - It should show your event types and bookings count

### Issue 2: SuperAdmin Dashboard Not Opening

**Steps to debug:**

1. **Check the Header component logs:**
   ```
   📊 HEADER - Profile State:
   User: bishesh.guragain@gmail.com
   Profile exists: true
   Profile data: { role: 'superadmin', ... }
   ```

2. **When you click the profile dropdown:**
   - Do you see the "🔐 SuperAdmin Dashboard" link?
   - What happens when you click it?
   - Check the console for navigation errors

3. **Check the SuperAdminDashboard authorization logs:**
   ```
   🔐 SUPERADMIN - Authorization Check
   User ID found: [your-id]
   🔍 isSuperAdmin result: true
   ✅ User is authorized as superadmin
   ```

4. **Common issues:**
   - Profile not loaded → Check authStore
   - Role not 'superadmin' → Check database
   - Navigation blocked → Check routing

## Quick Fixes to Try

### Fix 1: Check if subscription_plans table exists

Run this in Supabase SQL Editor:
```sql
-- Check if subscription_plans exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'subscription_plans'
);

-- If it doesn't exist, create it
-- (See CREATE_SUBSCRIPTION_PLANS_TABLE.sql)
```

### Fix 2: Check your profile data

Run this in Supabase SQL Editor:
```sql
-- Check your profile
SELECT 
  id, 
  email, 
  full_name, 
  role, 
  subscription_plan, 
  subscription_status,
  bookings_this_month
FROM users_profile 
WHERE email = 'bishesh.guragain@gmail.com';
```

### Fix 3: Force refresh the auth store

In the browser console, run:
```javascript
// Force reload profile
window.location.reload();
```

## Next Steps

1. **Open browser console (F12)**
2. **Navigate to Dashboard**
3. **Copy all console logs** (especially errors in red)
4. **Try clicking profile → SuperAdmin Dashboard**
5. **Copy any navigation/routing errors**
6. **Share the logs with me**

Then I can create targeted fixes!
