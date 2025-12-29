# SuperAdmin Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Run the Migration

```bash
# Navigate to your project
cd /Users/millionairemindset/Calendly

# Run the migration in Supabase SQL Editor
# Copy and paste the contents of migrations/add_superadmin_system.sql
```

Or via command line:
```bash
psql -h your-supabase-host -U postgres -d postgres < migrations/add_superadmin_system.sql
```

### Step 2: Create Your First Superadmin

```sql
-- Replace with your email
UPDATE users_profile
SET role = 'superadmin'
WHERE email = 'your.email@example.com';

-- Verify it worked
SELECT user_id, email, full_name, role 
FROM users_profile 
WHERE role = 'superadmin';
```

### Step 3: Access the Dashboard

Navigate to:
```
http://localhost:5173/app/superadmin
```

Or in production:
```
https://your-domain.com/app/superadmin
```

## 📊 What You'll See

### Overview Tab
- **MRR (Monthly Recurring Revenue)**
  - Total MRR
  - Pro Plan MRR (£12/user/month)
  - Business Plan MRR (£24/user/month)

- **User Statistics**
  - Total users
  - Active/Inactive users
  - Free/Pro/Business breakdown
  - Signups (today, week, month)

- **Revenue Statistics**
  - Total revenue
  - Revenue by time period
  - Payment success/failure rates

### Users Tab
- View all users (paginated)
- Change subscription plans
- Activate/deactivate accounts
- See user activity metrics

### Payments Tab
- Payment history
- Stripe transaction details
- Filter by status/plan

### Inactive Users Tab
- Users inactive 90+ days
- Send deletion notices
- Bulk process option

### Deletions Tab
- Pending account deletions
- Cancel deletions
- View scheduled dates

## 🧪 Testing the System

### 1. Test Analytics

```sql
-- Add test data
INSERT INTO payment_history (user_id, amount, currency, payment_status, plan_type)
VALUES 
  ((SELECT user_id FROM users_profile LIMIT 1), 12.00, 'GBP', 'succeeded', 'pro'),
  ((SELECT user_id FROM users_profile LIMIT 1), 24.00, 'GBP', 'succeeded', 'business');

-- Check MRR
SELECT * FROM get_mrr();

-- Check user stats
SELECT * FROM get_user_statistics();

-- Check revenue stats
SELECT * FROM get_revenue_statistics();
```

### 2. Test Inactive User Detection

```sql
-- Mark a user as inactive (for testing)
UPDATE users_profile
SET last_active_at = NOW() - INTERVAL '95 days'
WHERE email = 'test.user@example.com';

-- Get inactive users
SELECT * FROM get_inactive_users(90);
```

### 3. Test Deletion Notice

```sql
-- Send a deletion notice (for testing)
SELECT send_deletion_notice(
  (SELECT user_id FROM users_profile WHERE email = 'test.user@example.com'),
  'inactivity',
  'Test deletion notice',
  95
);

-- Check deletion notices
SELECT * FROM account_deletion_notices;
```

### 4. Test Automated Processing

```sql
-- Run the automated process
SELECT * FROM process_inactive_accounts();

-- This will:
-- 1. Send notices to free users inactive 90+ days
-- 2. Delete accounts past their scheduled deletion date
```

## 🔄 Daily Automation Setup

### Option 1: PostgreSQL Cron (Recommended if available)

```sql
-- Install pg_cron extension (if not installed)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily processing at 2 AM
SELECT cron.schedule(
  'process-inactive-accounts',
  '0 2 * * *',
  $$SELECT process_inactive_accounts()$$
);

-- View scheduled jobs
SELECT * FROM cron.job;
```

### Option 2: Server-Side Cron Job

Create a script: `/scripts/process-inactive.sh`

```bash
#!/bin/bash
psql -h your-host -U postgres -d your-db -c "SELECT process_inactive_accounts();"
```

Add to crontab:
```bash
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /path/to/scripts/process-inactive.sh
```

### Option 3: Application-Level Cron

Use a service like:
- **Node-cron**: For Node.js apps
- **Cron Job Services**: EasyCron, cron-job.org
- **Cloud Functions**: Scheduled Firebase/AWS Lambda

Example with Node-cron:
```javascript
const cron = require('node-cron');

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  await processInactiveAccounts();
  console.log('Processed inactive accounts');
});
```

## 📧 Email Integration (Next Step)

To send actual deletion notices, integrate your email service:

```typescript
// In superadminService.ts, update sendDeletionNotice
import { sendEmail } from './emailService';

export async function sendDeletionNotice(...) {
  // ... existing code ...
  
  // Send email
  await sendEmail({
    to: userEmail,
    subject: 'Your BookGrid Account Will Be Deleted Soon',
    template: 'account-deletion-notice',
    data: {
      userName: fullName,
      deletionDate: deletionDate,
      loginLink: 'https://bookgrid.com/login'
    }
  });
  
  // ... rest of code ...
}
```

## 🎯 Common Tasks

### Make a User Superadmin

```sql
UPDATE users_profile
SET role = 'superadmin'
WHERE email = 'new.admin@example.com';
```

### Revoke Superadmin Access

```sql
UPDATE users_profile
SET role = 'user'
WHERE email = 'former.admin@example.com';
```

### Upgrade a User's Plan

```sql
UPDATE users_profile
SET 
  subscription_plan = 'pro',
  subscription_status = 'active'
WHERE email = 'user@example.com';
```

### Cancel Pending Deletion

```sql
SELECT cancel_deletion_notice(
  (SELECT user_id FROM users_profile WHERE email = 'user@example.com')
);
```

### View All Superadmins

```sql
SELECT user_id, email, full_name, created_at
FROM users_profile
WHERE role = 'superadmin'
ORDER BY created_at DESC;
```

## 📊 Sample Dashboard Queries

### Top Revenue Users This Month

```sql
SELECT 
  up.email,
  up.full_name,
  up.subscription_plan,
  SUM(ph.amount) as total_spent
FROM users_profile up
JOIN payment_history ph ON ph.user_id = up.user_id
WHERE ph.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY up.user_id, up.email, up.full_name, up.subscription_plan
ORDER BY total_spent DESC
LIMIT 10;
```

### Users Most Likely to Churn

```sql
SELECT 
  email,
  full_name,
  subscription_plan,
  last_active_at,
  EXTRACT(DAY FROM NOW() - last_active_at) as days_inactive
FROM users_profile
WHERE account_status = 'active'
  AND subscription_plan IN ('pro', 'business')
  AND last_active_at < NOW() - INTERVAL '30 days'
ORDER BY last_active_at ASC
LIMIT 20;
```

### Monthly Revenue Trend

```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  plan_type,
  COUNT(*) as payment_count,
  SUM(amount) as total_revenue
FROM payment_history
WHERE payment_status = 'succeeded'
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY month, plan_type
ORDER BY month DESC, plan_type;
```

## 🛡️ Security Checklist

- [ ] Only trusted admins have superadmin role
- [ ] Superadmin emails are monitored
- [ ] RLS policies are enabled on all tables
- [ ] Audit log is reviewed regularly
- [ ] Deletion process is documented
- [ ] Backup strategy is in place
- [ ] Rate limiting on admin endpoints

## ✅ Success Indicators

You'll know it's working when:
1. ✅ MRR calculates correctly
2. ✅ User statistics are accurate
3. ✅ Payment history shows up
4. ✅ Inactive users are detected
5. ✅ Deletion notices can be sent/cancelled
6. ✅ Automated process runs daily

## 🐛 Troubleshooting

### Can't access /app/superadmin

**Check:**
```sql
SELECT role FROM users_profile WHERE email = 'your@email.com';
```

Should return `superadmin`. If not:
```sql
UPDATE users_profile SET role = 'superadmin' WHERE email = 'your@email.com';
```

### MRR showing 0

**Check:**
```sql
SELECT 
  subscription_plan,
  account_status,
  COUNT(*)
FROM users_profile
GROUP BY subscription_plan, account_status;
```

Ensure users have active Pro/Business plans.

### Functions not found

**Re-run migration:**
```bash
psql < migrations/add_superadmin_system.sql
```

## 📞 Support

For issues, check:
1. Browser console for errors
2. Supabase logs
3. Database function execution
4. RLS policies

---

**Setup Time:** ~5 minutes  
**Difficulty:** Easy  
**Prerequisites:** Supabase access, Basic SQL knowledge  
**Support:** See SUPERADMIN_DASHBOARD.md for full documentation
