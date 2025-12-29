# 🔒 Security Implementation Guide

This guide walks you through implementing all critical security fixes for BookGrid.

---

## 📋 Prerequisites

Before you begin, ensure you have:
- [ ] Access to Supabase SQL Editor
- [ ] Admin access to your Supabase project
- [ ] Latest code from the repository
- [ ] Backup of your database

---

## 🚀 Step-by-Step Implementation

### Step 1: Review the Security Audit Report

**File:** `SECURITY_AUDIT_REPORT.md`

Read through the complete audit report to understand all vulnerabilities and recommendations.

**Key Points:**
- Overall security rating: 4/5 (Good)
- 4 critical fixes required
- 5 high-priority improvements
- 4 medium-priority enhancements

---

### Step 2: Apply Critical Database Fixes

**File:** `CRITICAL_SECURITY_FIXES.sql`

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Execute the security fixes:**
   ```bash
   # Copy the contents of CRITICAL_SECURITY_FIXES.sql
   # Paste into SQL Editor
   # Click "Run" or press Cmd/Ctrl + Enter
   ```

3. **Verify fixes were applied:**
   The script will show a success message with checkmarks for each fix.

**What This Does:**
- ✅ Prevents role self-elevation (users can't make themselves superadmin)
- ✅ Adds rate limiting on bookings (max 5 per hour per email)
- ✅ Adds token expiration (tokens expire 2 hours before event)
- ✅ Creates audit log for superadmin actions
- ✅ Strengthens input validation

---

### Step 3: Update Frontend Code

#### A. Install Security Dependencies (Optional)

```bash
# Install DOMPurify for HTML sanitization (if needed in future)
npm install dompurify
npm install --save-dev @types/dompurify
```

#### B. Use Security Utils

The security utilities are already created in `src/utils/security.ts`.

**Example Usage:**

```typescript
// In your components
import { SecurityUtils } from '../utils/security';

// Rate limit login attempts
if (!SecurityUtils.checkLoginRateLimit(email)) {
  setError('Too many login attempts. Please try again in 15 minutes.');
  return;
}

// Sanitize user input
const cleanUsername = SecurityUtils.sanitizeUsername(username);
const cleanNotes = SecurityUtils.sanitizeText(notes, 500);

// Validate token expiration
if (SecurityUtils.isTokenExpired(booking.token_expires_at)) {
  setError('This link has expired.');
  return;
}

// Safe logging (auto-redacts sensitive data)
SecurityUtils.safeLog('User logged in', { userId, email });
```

#### C. Update Auth Components

**File:** `src/components/auth/LoginForm.tsx`

Add rate limiting:

```typescript
import { SecurityUtils } from '../../utils/security';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Check rate limit
  if (!SecurityUtils.checkLoginRateLimit(formData.email)) {
    setErrors({ 
      api: 'Too many login attempts. Please try again in 15 minutes.' 
    });
    return;
  }
  
  // ... rest of login logic
};
```

**File:** `src/components/auth/SignUpForm.tsx`

Add rate limiting:

```typescript
import { SecurityUtils } from '../../utils/security';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Check rate limit
  if (!SecurityUtils.checkSignupRateLimit(formData.email)) {
    setErrors({ 
      api: 'Too many signup attempts. Please try again later.' 
    });
    return;
  }
  
  // Sanitize username
  const cleanFullName = SecurityUtils.sanitizeText(formData.fullName, 100);
  
  // ... rest of signup logic
};
```

#### D. Update Booking Pages

**File:** `src/pages/Reschedule.tsx` and `src/pages/Cancel.tsx`

Add token expiration check:

```typescript
import { SecurityUtils } from '../utils/security';

useEffect(() => {
  const loadBooking = async () => {
    // ... fetch booking
    
    // Check token expiration
    if (SecurityUtils.isTokenExpired(booking.token_expires_at)) {
      setError('This reschedule link has expired.');
      return;
    }
    
    // ... rest of logic
  };
}, []);
```

#### E. Update authStore to Remove Sensitive Logging

**File:** `src/store/authStore.ts`

Replace console.log statements:

```typescript
import { SecurityUtils } from '../utils/security';

// Replace all console.log with safeLog
// Before:
console.log('🟢 loadProfile: Profile loaded successfully:', {
  email: data?.email,
  role: data?.role,
});

// After:
SecurityUtils.safeLog('Profile loaded successfully', {
  userId: data?.id,
  // Don't log sensitive fields in production
});
```

---

### Step 4: Add Security Headers

**File:** `vite.config.ts`

Add security headers:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.supabase.co",
        "font-src 'self' data:",
        "frame-ancestors 'none'",
      ].join('; '),
      
      // Other security headers
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    },
  },
});
```

**For Production (Add to your hosting platform):**

If deploying to Vercel, Netlify, or similar, add `vercel.json` or `netlify.toml`:

**vercel.json:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

---

### Step 5: Testing

#### A. Test Rate Limiting

1. **Test Login Rate Limit:**
   - Try logging in with wrong password 6 times
   - Should show error after 5 attempts
   - Wait 15 minutes or clear localStorage to reset

2. **Test Booking Rate Limit:**
   - Try creating 6 bookings with same email within 1 hour
   - Should fail after 5 bookings
   - Database-level protection active

#### B. Test Token Expiration

1. **Create a booking in the database manually:**
   ```sql
   -- Set token to expire in 1 hour
   UPDATE bookings 
   SET token_expires_at = NOW() + INTERVAL '1 hour'
   WHERE id = 'your-booking-id';
   ```

2. **Visit the reschedule link:**
   - Should work before expiration
   - Should show error after expiration

#### C. Test Role Elevation Prevention

1. **Try to change your own role:**
   ```sql
   -- This should FAIL for non-superadmins
   UPDATE users_profile 
   SET role = 'superadmin'
   WHERE id = auth.uid();
   ```

2. **Check audit log:**
   ```sql
   SELECT * FROM superadmin_audit_log 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

---

### Step 6: Production Checklist

Before deploying to production:

- [ ] ✅ All critical SQL fixes applied
- [ ] ✅ Security utils integrated in frontend
- [ ] ✅ Rate limiting added to auth forms
- [ ] ✅ Token expiration checks added
- [ ] ✅ Sensitive logging removed/sanitized
- [ ] ✅ Security headers configured
- [ ] ✅ All tests passing
- [ ] ✅ Audit log reviewed and working
- [ ] ✅ Rate limits tested
- [ ] ✅ Backup of database created

---

## 📊 Monitoring

### Set Up Monitoring

1. **Supabase Dashboard:**
   - Monitor failed RLS policy checks
   - Check for rate limit violations
   - Review audit logs weekly

2. **Error Tracking (Recommended):**
   ```bash
   # Install Sentry
   npm install @sentry/react
   ```

3. **Custom Alerts:**
   Set up email alerts for:
   - Multiple failed login attempts
   - Suspicious superadmin actions
   - High booking rate from single email

---

## 🔄 Regular Maintenance

### Weekly Tasks:
- [ ] Review superadmin audit logs
- [ ] Check for unusual booking patterns
- [ ] Monitor failed authentication attempts

### Monthly Tasks:
- [ ] Review and update security policies
- [ ] Check for Supabase security updates
- [ ] Rotate superadmin access if needed
- [ ] Review rate limit thresholds

### Quarterly Tasks:
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Update dependencies
- [ ] Review and update security headers

---

## 🆘 Troubleshooting

### Issue: Rate limiting not working

**Solution:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'booking_rate_limit';

-- Recreate if missing
-- Run CRITICAL_SECURITY_FIXES.sql again
```

### Issue: Tokens not expiring

**Solution:**
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'token_expires_at';

-- Check trigger
SELECT * FROM pg_trigger WHERE tgname = 'set_booking_token_expiration';
```

### Issue: Audit log not recording

**Solution:**
```sql
-- Check if table exists
SELECT * FROM information_schema.tables WHERE table_name = 'superadmin_audit_log';

-- Check trigger
SELECT * FROM pg_trigger WHERE tgname = 'audit_users_profile_changes';
```

---

## 📚 Additional Resources

- [Supabase Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10 Web Application Security Risks](https://owasp.org/www-project-top-ten/)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Sentry Error Tracking](https://sentry.io/welcome/)

---

## 🎉 Success Criteria

You've successfully implemented all security fixes when:

1. ✅ All database fixes show as "implemented" in verification query
2. ✅ Rate limiting prevents rapid repeated actions
3. ✅ Expired tokens are rejected
4. ✅ Non-superadmins cannot elevate their role
5. ✅ Audit log captures all superadmin actions
6. ✅ Security headers are present in HTTP responses
7. ✅ No sensitive data in console logs (production)

---

**Questions or Issues?**  
Contact: security@bookgrid.com

**Last Updated:** December 29, 2025
