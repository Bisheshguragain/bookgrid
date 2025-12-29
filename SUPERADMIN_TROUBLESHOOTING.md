# SuperAdmin Dashboard Troubleshooting Guide

## Issue: SuperAdmin Dashboard Not Showing

If you're not seeing the SuperAdmin dashboard link in the navigation, follow these steps:

---

## ✅ Step 1: Verify Database Setup

Run this query in Supabase SQL Editor:

```sql
SELECT 
  id,
  email,
  full_name,
  role,
  account_status,
  subscription_plan,
  last_active_at
FROM users_profile
WHERE email = 'bishesh.guragain@gmail.com';
```

**Expected Result:**
- `role`: `superadmin`
- `account_status`: `active`
- `subscription_plan`: `business` or `pro`

If the role is not 'superadmin', run:
```sql
UPDATE users_profile
SET role = 'superadmin',
    subscription_plan = 'business',
    account_status = 'active',
    subscription_status = 'active'
WHERE email = 'bishesh.guragain@gmail.com';
```

---

## ✅ Step 2: Clear Browser Cache and Reload

The profile data might be cached. Follow these steps:

### Option A: Hard Refresh
1. Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows/Linux)
2. This will clear the cache and reload the page

### Option B: Clear Storage Manually
1. Open Chrome DevTools (`Cmd + Option + I` or `F12`)
2. Go to **Application** tab
3. Under **Storage** → **Local Storage** → Find your app URL
4. Look for `auth-storage` or similar key
5. Delete it
6. Refresh the page

### Option C: Sign Out and Sign In Again
1. Click the profile dropdown in the header
2. Click "Sign Out"
3. Sign in again with `bishesh.guragain@gmail.com`
4. The profile should reload with the latest data

---

## ✅ Step 3: Check Browser Console

1. Open Chrome DevTools (`Cmd + Option + I` or `F12`)
2. Go to **Console** tab
3. Look for any errors related to:
   - Authentication
   - Profile loading
   - TypeScript errors
   - Network errors

Common issues:
- **"role is undefined"**: Profile hasn't loaded yet, try refreshing
- **Network errors**: Check Supabase connection
- **CORS errors**: Check Supabase URL configuration

---

## ✅ Step 4: Verify Profile is Loaded

In the browser console, run:

```javascript
// Check if profile is loaded
const profile = JSON.parse(localStorage.getItem('auth-storage') || '{}');
console.log('Profile:', profile.state?.profile);
console.log('Role:', profile.state?.profile?.role);
console.log('Is SuperAdmin:', profile.state?.profile?.role === 'superadmin');
```

**Expected Output:**
```
Profile: { id: '...', email: 'bishesh.guragain@gmail.com', role: 'superadmin', ... }
Role: superadmin
Is SuperAdmin: true
```

If role is missing or undefined, the profile needs to be reloaded.

---

## ✅ Step 5: Force Profile Reload

Run this in the browser console:

```javascript
// Get the auth store
const authStore = window.__ZUSTAND_DEVTOOLS_MIDDLEWARE__?.stores?.get('auth-storage');

// Or manually trigger a reload
window.location.reload();
```

---

## ✅ Step 6: Check Network Tab

1. Open Chrome DevTools → **Network** tab
2. Filter by "users_profile"
3. Sign in or refresh the page
4. Look for the API call to fetch profile
5. Click on the request and check the **Response** tab
6. Verify that `role: "superadmin"` is in the response

---

## ✅ Step 7: Verify TypeScript Types

Check that the types are correctly defined:

1. Open `/src/lib/database.types.ts`
2. Search for `UserProfileType`
3. Verify it includes:
   ```typescript
   export interface UserProfileType {
     // ...other fields
     role: UserRole
     account_status: AccountStatus
     last_active_at: string | null
   }
   ```

4. Search for `users_profile` in Database interface
5. Verify the Row type includes all fields

---

## ✅ Step 8: Check Navigation Logic

1. Open `/src/components/layout/Header.tsx`
2. Verify line ~21:
   ```typescript
   const isSuperAdmin = profile?.role === 'superadmin';
   ```

3. Verify line ~42-44:
   ```typescript
   const navigation = [
     { name: 'Dashboard', href: '/app/dashboard' },
     ...(isSuperAdmin ? [{ name: '🔐 SuperAdmin', href: '/app/superadmin' }] : []),
     // ...
   ];
   ```

---

## ✅ Step 9: Check Route Configuration

1. Open `/src/App.tsx`
2. Verify the route exists (around line 139):
   ```typescript
   <Route path="superadmin" element={<SuperAdminDashboard />} />
   ```

3. Verify the import at the top:
   ```typescript
   import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
   ```

---

## ✅ Step 10: Test Direct Access

Try accessing the SuperAdmin dashboard directly:

1. Navigate to: `http://localhost:5173/app/superadmin`
   (Replace with your actual domain and port)

2. What happens?
   - **Dashboard loads**: Navigation issue, check Header component
   - **404 error**: Route not configured, check App.tsx
   - **Permission denied**: Check if user has superadmin role
   - **Blank page**: Check browser console for errors

---

## 🔍 Quick Diagnostic Checklist

- [ ] Database: User has `role = 'superadmin'`
- [ ] Browser cache cleared or hard refresh done
- [ ] Signed out and back in
- [ ] Profile loaded in localStorage/Zustand
- [ ] Network request returns `role: "superadmin"`
- [ ] TypeScript types include `role` field
- [ ] Header component checks `profile?.role === 'superadmin'`
- [ ] Navigation array includes SuperAdmin link conditionally
- [ ] Route exists in App.tsx
- [ ] No console errors
- [ ] Direct URL access works

---

## 💡 Common Solutions

### Solution 1: Complete Sign Out/In Cycle
```
1. Sign out completely
2. Close all browser tabs with the app
3. Clear browser cache
4. Open new tab
5. Sign in with bishesh.guragain@gmail.com
```

### Solution 2: Database Column Check
```sql
-- Verify all columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users_profile'
  AND column_name IN ('role', 'account_status', 'last_active_at');

-- Should return 3 rows
```

### Solution 3: Manual Profile Update
```sql
-- Force update the profile
UPDATE users_profile
SET 
  role = 'superadmin',
  account_status = 'active',
  last_active_at = NOW(),
  subscription_plan = 'business',
  subscription_status = 'active'
WHERE email = 'bishesh.guragain@gmail.com'
RETURNING *;
```

---

## 🆘 Still Not Working?

1. **Check DevTools Console** for any errors
2. **Run the diagnostic SQL** (`superadmin_diagnostic.sql`)
3. **Verify all migrations ran** successfully
4. **Check Supabase logs** for any RLS policy issues
5. **Restart the dev server**: `npm run dev`

---

## 📞 Need Help?

If you're still experiencing issues:
1. Take a screenshot of the browser console
2. Run the diagnostic SQL and share results
3. Check what the Network tab shows for profile loading
4. Verify the localStorage contains the profile with role field

---

**Last Updated**: December 2025
**Status**: All fixes applied, types updated, ready to test
