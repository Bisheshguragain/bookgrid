# Dashboard Upgrade CTA - Troubleshooting Guide

## 🔍 Issue: Banner Not Showing

If the subscription upgrade banner is not appearing on your dashboard, follow these steps to diagnose and fix the issue.

---

## ✅ Step 1: Check Browser Console

1. Open your dashboard: `http://localhost:5173/app/dashboard`
2. Open browser developer tools (F12 or Right-click → Inspect)
3. Go to the **Console** tab
4. Look for these log messages:

### Expected Logs:
```
Subscription data loaded: {plan: 'free', status: 'active', features: {...}, limits: {...}}
Dashboard subscription state: {plan: 'free', status: 'active', ...}
```

### Problem Indicators:
```
❌ Subscription data loaded: null
❌ Dashboard subscription state: null
❌ Error loading subscription data: [error message]
```

---

## ✅ Step 2: Check Database Migration

The subscription system requires database tables to be set up. Verify:

### Check if tables exist:
```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscription_plans', 'users_profile');
```

### Expected Result:
```
table_name
-----------------
subscription_plans
users_profile
```

### If Missing:
Run the migration:
```sql
-- Execute: migrations/add_subscription_tiers.sql
```

---

## ✅ Step 3: Check Subscription Plans Data

Verify subscription plans are seeded:

```sql
SELECT * FROM subscription_plans WHERE is_active = true;
```

### Expected Result:
```
 name     | display_name | price_monthly | max_event_types
----------|--------------|---------------|----------------
 free     | Free         |          0.00 |               1
 pro      | Pro          |         12.00 |              10
 business | Business     |         24.00 |              -1
```

### If Empty:
The migration should have inserted these. Re-run:
```sql
-- From migrations/add_subscription_tiers.sql
INSERT INTO subscription_plans (name, display_name, price_monthly, ...)
```

---

## ✅ Step 4: Check User Profile

Verify your user has subscription plan set:

```sql
-- Replace with your actual user ID
SELECT id, subscription_plan, event_types_count, monthly_bookings_count 
FROM users_profile 
WHERE id = 'your-user-id';
```

### Expected Result:
```
subscription_plan | event_types_count | monthly_bookings_count
------------------|-------------------|----------------------
free              | 0                 | 0
```

### If NULL or Missing:
Update the user profile:
```sql
UPDATE users_profile 
SET subscription_plan = 'free',
    event_types_count = 0,
    monthly_bookings_count = 0,
    bookings_reset_date = CURRENT_DATE
WHERE id = 'your-user-id';
```

---

## ✅ Step 5: Check Service Function

Test the `getUserSubscription` function directly:

### In Browser Console:
```javascript
// Import the service
import { getUserSubscription } from './services/subscriptionService';

// Get current user ID (check authStore)
const userId = 'your-user-id'; // Get from auth state

// Test the function
const result = await getUserSubscription(userId);
console.log('Subscription result:', result);
```

### Expected Result:
```javascript
{
  plan: 'free',
  status: 'active',
  features: {
    availability: 'basic',
    reminders: true,
    public_link: true,
    analytics: false,
    // ...
  },
  limits: {
    max_event_types: 1,
    max_bookings_per_month: 100,
    current_event_types: 0,
    current_bookings_this_month: 0
  },
  can_create_event_type: true,
  can_create_booking: true
}
```

---

## ✅ Step 6: Verify Component State

The banner only shows if `subscription` state is not null:

### Current Code Logic:
```tsx
{subscription ? (
  <div>... banner ...</div>
) : (
  <div>⚠️ Subscription data not loaded</div>
)}
```

### What You Should See:
- **Banner shows**: Subscription data loaded successfully
- **Warning shows**: Subscription data is null/undefined

---

## 🔧 Common Issues & Fixes

### Issue 1: Database Migration Not Run
**Symptom**: Console shows "relation 'subscription_plans' does not exist"

**Fix**:
```bash
# Go to Supabase Dashboard → SQL Editor
# Paste and run: migrations/add_subscription_tiers.sql
```

---

### Issue 2: User Profile Missing Fields
**Symptom**: Console shows null or missing subscription_plan

**Fix**:
```sql
-- Add missing columns to users_profile
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS event_types_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_bookings_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bookings_reset_date DATE DEFAULT CURRENT_DATE;

-- Update existing users
UPDATE users_profile 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;
```

---

### Issue 3: RLS Policies Blocking Access
**Symptom**: Console shows "permission denied" or empty results

**Fix**:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('subscription_plans', 'users_profile');

-- Ensure SELECT policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'subscription_plans';

-- If missing, add policy
CREATE POLICY "Allow public read access to subscription plans"
ON subscription_plans FOR SELECT
TO authenticated
USING (is_active = true);
```

---

### Issue 4: Service Import Error
**Symptom**: Console shows "Cannot find module"

**Fix**:
Check the import path in Dashboard.tsx:
```tsx
import { getUserSubscription, type SubscriptionInfo } from '../services/subscriptionService';
```

Verify file exists:
```bash
ls -la src/services/subscriptionService.ts
```

---

## 🐛 Debug Mode

I've added debug logging to the Dashboard. Check console for:

```
Subscription data loaded: {...}  // After data fetch
Dashboard subscription state: {...}  // Before render
```

If you see these logs with actual data but no banner, the issue is in the rendering logic.

---

## 🆘 Quick Fix: Force Show Banner

If you want to see the banner regardless (for testing), temporarily change:

```tsx
// In Dashboard.tsx, change:
{subscription ? (

// To:
{subscription || true ? (
```

This will always show the banner, but use mock/undefined data. Only for debugging!

---

## ✅ Verification Checklist

After fixes, verify:

- [ ] Database migration completed
- [ ] subscription_plans table has 3 rows
- [ ] users_profile has subscription_plan column
- [ ] Your user has subscription_plan = 'free'
- [ ] Console shows subscription data loaded
- [ ] Console shows dashboard subscription state
- [ ] No errors in console
- [ ] Banner appears on dashboard
- [ ] Usage stats show correctly

---

## 📞 Still Not Working?

### Collect Debug Info:

1. **Console Logs**: Copy all logs from console
2. **Database Check**:
   ```sql
   SELECT * FROM subscription_plans;
   SELECT id, subscription_plan FROM users_profile WHERE id = 'your-id';
   ```
3. **Network Tab**: Check if API calls are failing
4. **Browser**: Try incognito mode / clear cache

### Expected File Structure:
```
src/
├── pages/
│   └── Dashboard.tsx          ← Banner implemented here
├── services/
│   └── subscriptionService.ts ← Data fetch logic
migrations/
└── add_subscription_tiers.sql ← Database setup
```

---

## 🎯 Success Criteria

When everything works, you should see:

1. ✅ No errors in console
2. ✅ Subscription data logs show proper object
3. ✅ Banner appears with correct plan (🆓 Free Plan)
4. ✅ Usage stats: "0/1 event types, 0/100 bookings this month"
5. ✅ Upgrade button: "🚀 Upgrade Now"
6. ✅ Clicking button navigates to /app/pricing

---

**Last Updated**: 28 December 2025
**Status**: Debugging Guide
