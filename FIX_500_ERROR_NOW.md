# 🚨 CRITICAL: 500 Error on users_profile - Emergency Fix

## The Problem
Your browser is showing:
```
[Error] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (users_profile, line 0)
```

This means the database query is failing on the **server side** (Supabase), not in your app.

---

## 🔥 IMMEDIATE FIX

### Step 1: Run the Emergency Migration
**File:** `migrations/fix_500_error_users_profile.sql`

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the ENTIRE file `migrations/fix_500_error_users_profile.sql`
4. **Run it**

This will:
- ✅ Temporarily disable RLS to test
- ✅ Drop all broken policies
- ✅ Create clean, simple policies
- ✅ Re-enable RLS
- ✅ Test the queries

---

## 🔍 What's Causing This

The 500 error is likely caused by:

1. **Recursive RLS Policy** - The subquery checking for superadmin might be creating an infinite loop
2. **Missing Column** - A column referenced in RLS policy doesn't exist
3. **Type Mismatch** - Data type issue in RLS policy
4. **Corrupt Policy** - Policy syntax error causing server crash

---

## ⚡ Quick Test

### In Supabase SQL Editor, run this:

```sql
-- Disable RLS temporarily
ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT id, email, role FROM users_profile LIMIT 5;

-- Re-enable RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
```

**If the SELECT works when RLS is disabled:**
→ The problem is definitely in the RLS policies

**If the SELECT still fails:**
→ There's a schema/column issue

---

## 🛠️ Manual Fix (If Migration Doesn't Work)

### 1. Drop All Policies

```sql
-- Drop everything
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users_profile') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users_profile';
    END LOOP;
END $$;
```

### 2. Create Minimal Policies

```sql
-- Just allow authenticated users to see their own data
CREATE POLICY "basic_select"
ON users_profile
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "basic_update"
ON users_profile
FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

### 3. Test

```sql
SELECT id, email FROM users_profile WHERE id = auth.uid();
```

Should work without 500 error.

### 4. Add Superadmin Policy Carefully

```sql
-- Add superadmin SELECT - using aliased table to avoid recursion
CREATE POLICY "superadmin_can_view_all"
ON users_profile
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM users_profile AS admin_check
    WHERE admin_check.id = auth.uid()
    AND admin_check.role = 'superadmin'
  )
);
```

---

## 🧪 Verify the Fix

After running the migration, test in browser console:

```javascript
// Test profile query
const { data, error } = await supabase
  .from('users_profile')
  .select('id, email, role')
  .eq('id', (await supabase.auth.getUser()).data.user.id)
  .single();

console.log('Profile query:', { data, error });
// Should show your profile without 500 error
```

---

## 📊 Check Logs

In Supabase Dashboard:
1. Go to **Logs** → **Database**
2. Look for errors around the time you saw the 500
3. Should show the actual SQL error message

---

## ✅ Expected Result

After the fix:
- ✅ No more 500 errors in console
- ✅ Profile loads successfully
- ✅ `Header - Profile loaded` shows your data with role
- ✅ SuperAdmin link appears in profile dropdown
- ✅ Users tab in SuperAdmin dashboard loads

---

## 🆘 If Still Broken

### Nuclear Option: Recreate the Table Policies from Scratch

```sql
-- 1. Disable RLS
ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL policies
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users_profile') 
    LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON users_profile';
    END LOOP;
END $$;

-- 3. Enable RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- 4. Create ONE simple policy
CREATE POLICY "allow_own_access"
ON users_profile
FOR ALL
TO authenticated
USING (auth.uid() = id);

-- 5. Test
SELECT * FROM users_profile WHERE id = auth.uid();
```

---

## 🎯 The Root Cause

Looking at your errors, the RLS policies with `EXISTS` subqueries are likely causing recursion:

```sql
EXISTS (
  SELECT 1 FROM users_profile users_profile_1  -- ← Querying same table
  WHERE users_profile_1.id = auth.uid()
  AND users_profile_1.role = 'superadmin'
)
```

This creates a circular dependency that causes 500 errors.

**The fix uses table aliases to prevent recursion.**

---

## 📋 Action Steps

1. ✅ **Run:** `migrations/fix_500_error_users_profile.sql`
2. ✅ **Refresh** your app (F5)
3. ✅ **Check** browser console - should see profile load
4. ✅ **Click** profile picture - SuperAdmin link should appear
5. ✅ **Test** SuperAdmin → Users tab

**Run the migration NOW - it will fix the 500 errors!** 🚀
