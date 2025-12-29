# 🚀 SuperAdmin Quick Reference Cheat Sheet

## ⚡ Quick Setup (First Time)

```bash
# If you get "column does not exist" errors:
# 1. Run in Supabase: add_missing_subscription_columns.sql
# 2. Run in Supabase: final_profile_update.sql
# 3. Clear browser cache (Cmd+Shift+Delete)
# 4. Sign in again
# 5. Check profile shows "Bishesh Guragain"
# 6. Click profile → Should see "SuperAdmin Dashboard"
```

## 📋 Files to Run (In Order)

**First time only:**
1. `add_missing_subscription_columns.sql` - Add missing DB columns
2. `final_profile_update.sql` - Update your profile
3. `verify_superadmin_setup.sql` - Verify everything works

## 🔧 Common Fixes

### Fix 1: Name Not Showing
```sql
UPDATE users_profile 
SET full_name = 'Bishesh Guragain'
WHERE email = 'bishesh.guragain@gmail.com';
```
Then: Clear cache + reload

### Fix 2: SuperAdmin Link Missing
```sql
UPDATE users_profile 
SET role = 'superadmin'
WHERE email = 'bishesh.guragain@gmail.com';
```
Then: Clear cache + reload

### Fix 3: 500 Errors
Run in Supabase: `fix_500_error_users_profile.sql`

### Fix 4: Users Not Showing
```sql
-- Check if you can see users
SELECT id, email, full_name FROM users_profile LIMIT 5;
```
If empty → Check RLS policies

## 📍 Quick Access

### Files to Run
1. **SQL (Supabase):** `final_profile_update.sql`
2. **SQL (Verify):** `verify_superadmin_setup.sql`
3. **Browser (Test):** `test_bookgrid_console.js`

### Docs to Read
1. **Start:** `QUICK_VERIFICATION_STEPS.md`
2. **Visual:** `WHAT_YOU_SHOULD_SEE.md`
3. **Help:** `SUPERADMIN_TROUBLESHOOTING.md`

## ✅ Success Checklist

- [ ] Profile shows "Bishesh Guragain" (not email)
- [ ] SuperAdmin badge visible in dropdown
- [ ] SuperAdmin Dashboard link in dropdown
- [ ] Dashboard loads without errors
- [ ] User table shows users
- [ ] All stat cards have numbers
- [ ] Console test passes (all ✅)
- [ ] No 500 errors in Network tab

## 🎯 Expected UI

**Profile Dropdown:**
```
Bishesh Guragain
🔐 SuperAdmin
──────────────────
🔐 SuperAdmin Dashboard  ← Click here
Settings
Reminders
Sign out
```

**Dashboard:**
```
Total Users    Active Subs    MRR         Bookings
42             15             $1,250      128
[User management table with search/filters]
```

## 🐛 Debug Commands

### Browser Console
```javascript
// Check profile
localStorage.getItem('auth-storage')

// Clear all
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### SQL Check
```sql
-- Your profile
SELECT * FROM users_profile 
WHERE email = 'bishesh.guragain@gmail.com';

-- All users (if superadmin)
SELECT count(*) FROM users_profile;
```

## 📞 Troubleshooting Flow

1. **Check:** Does profile show name?
   - NO → Run Fix 1
   
2. **Check:** SuperAdmin link visible?
   - NO → Run Fix 2
   
3. **Check:** Dashboard loads?
   - NO → Run Fix 3
   
4. **Check:** Users showing?
   - NO → Run Fix 4

## 🎉 All Good?

If all checks pass:
- ✅ Start using SuperAdmin features
- ✅ Manage users
- ✅ Track analytics
- ✅ Monitor subscriptions

---

**Need more help?** See `SUPERADMIN_README.md` for complete docs.

**Everything working?** You're ready to go! 🚀
