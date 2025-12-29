# 🚀 QUICK FIX GUIDE - Event Type & Availability Creation Issues

## ⚡ TL;DR - Do This Now

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy and paste** the content of `fix-rls-policies.sql`
3. **Click "Run"**
4. **Done!** Test creating event types and availability rules

---

## 📋 What Was Wrong?

- ❌ RLS policies blocking INSERT operations
- ❌ `FOR ALL` policy doesn't properly handle WITH CHECK clauses
- ✅ Fixed by creating granular policies for each operation

---

## 🔧 Files to Use

| File | Purpose | When to Use |
|------|---------|-------------|
| `fix-rls-policies.sql` | **Fix RLS policies** | **USE THIS FIRST** - Required to fix creation issues |
| `debug-database.sql` | Verify database structure | If you want to check table structure |
| `test-database.sql` | Test all database operations | After applying fix, to verify it worked |
| `migrations/001_add_new_features.sql` | Add new columns | Only if date_range columns missing |
| `DATABASE_FIX_GUIDE.md` | Detailed troubleshooting | If you need more help |

---

## ✅ How to Verify Fix Worked

### Method 1: Use the App (Easiest)
1. Login to your app
2. Go to **Event Types** → **Create Event Type**
3. Fill in the form
4. Click **Create**
5. ✅ Should work without errors!

### Method 2: Use DatabaseTest Component
1. Navigate to `/app/database-test`
2. Click **Run Tests**
3. All tests should show ✅

### Method 3: Run SQL Tests
1. Open `test-database.sql`
2. Replace `YOUR_USER_ID_HERE` with your user ID
3. Run in Supabase SQL Editor
4. All tests should show ✅

---

## 🐛 Common Errors & Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| "row-level security policy violated" | Run `fix-rls-policies.sql` |
| "column 'date_range_start' does not exist" | Run `migrations/001_add_new_features.sql` |
| "check constraint 'event_types_location_type_check'" | Use valid location type |
| "null value in column 'user_id'" | Make sure you're logged in |

---

## 📊 Success Checklist

After running the fix:

- [ ] Event types can be created ✅
- [ ] Availability rules can be created ✅
- [ ] Date range fields work ✅
- [ ] All 8 location types selectable ✅
- [ ] No errors in console ✅
- [ ] No errors in Supabase logs ✅

---

## 🆘 Still Not Working?

1. Check browser console (F12) for error details
2. Check Supabase Dashboard → Logs
3. Read `DATABASE_FIX_GUIDE.md` for detailed help
4. Use `/app/database-test` to identify specific issue

---

## 🎯 The One Command to Rule Them All

If you just want to copy-paste the fix directly:

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Users can manage their own event types" ON event_types;
DROP POLICY IF EXISTS "Users can read their own event types" ON event_types;
DROP POLICY IF EXISTS "Users can manage their own availability" ON availability_rules;

-- Event Types: Create granular policies
CREATE POLICY "Users can view their own event types" ON event_types
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event types" ON event_types
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event types" ON event_types
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event types" ON event_types
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active event types" ON event_types
    FOR SELECT USING (is_active = true);

-- Availability Rules: Create granular policies
CREATE POLICY "Users can view their own availability" ON availability_rules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own availability" ON availability_rules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability" ON availability_rules
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability" ON availability_rules
    FOR DELETE USING (auth.uid() = user_id);
```

**Run this in Supabase SQL Editor and you're done!** 🎉

---

## 💡 Why This Fix Works

The old `FOR ALL` policy didn't include explicit `WITH CHECK` clauses, which are required for INSERT operations. By creating separate policies for SELECT, INSERT, UPDATE, and DELETE with explicit `WITH CHECK` clauses, we ensure Supabase knows exactly what to check during each operation.

**Before:** One policy trying to do everything (confusing for Supabase)  
**After:** Four policies, each doing one thing well (clear for Supabase)

---

**Created:** 2024  
**Status:** ✅ Ready to Apply  
**Estimated Time:** 2 minutes
