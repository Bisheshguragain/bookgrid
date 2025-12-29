# 🔧 QUICK FIX: Get Dashboard Banner Working in 3 Minutes

## You're seeing: ⚠️ Subscription data not loaded. Check console for errors.

---

## ✅ SOLUTION: Run This SQL Script

### Step 1: Open Supabase
1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Copy & Paste
Open this file and copy ALL the content:
```
/Users/millionairemindset/Calendly/migrations/quick_fix_subscription.sql
```

### Step 3: Run It
1. Paste the SQL into the editor
2. Click **"RUN"** (or press Cmd/Ctrl + Enter)
3. Wait for completion (~2-3 seconds)

### Step 4: Verify Results
You should see at the bottom:

**Subscription Plans (3 rows):**
```
free     | Free     | 0.00  | 1  | 100
pro      | Pro      | 12.00 | 10 | 1,000
business | Business | 24.00 | -1 | -1
```

**Your User Profile:**
```
subscription_plan: free
event_types_count: 0
monthly_bookings_count: 0
```

✅ **If you see this, you're done!**

---

## ✅ STEP 5: Refresh Dashboard

1. Go back to `http://localhost:5173/app/dashboard`
2. **Hard refresh**: 
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`
3. **Check console** (F12) for:
   ```
   Subscription data loaded: {plan: 'free', ...}
   ```

4. **Banner should appear:**
   ```
   🆓 Free Plan
   📄 0/1 event types    📅 0/100 bookings
   [🚀 Upgrade Now]
   ```

---

## 🐛 Still Not Working?

### Console says: "relation 'subscription_plans' does not exist"
**Fix:** SQL didn't run. Try again in Supabase SQL Editor.

### Console says: "permission denied"
**Fix:** Run this:
```sql
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read" ON subscription_plans FOR SELECT TO authenticated USING (is_active = true);
```

### Console says: "null value"
**Fix:** Run this:
```sql
UPDATE users_profile SET subscription_plan = 'free' WHERE subscription_plan IS NULL;
```

---

## 📝 What the SQL Does

1. ✅ Creates `subscription_plans` table
2. ✅ Adds columns to `users_profile`
3. ✅ Inserts 3 plans (Free £0, Pro £12, Business £24)
4. ✅ Sets all users to 'free' plan
5. ✅ Enables security policies

**Total time: 3 minutes** ⏱️

---

**After running: Refresh dashboard → Banner appears! 🎉**
