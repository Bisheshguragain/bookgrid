# SuperAdmin Dashboard - SQL Scripts Guide

This guide explains all the SQL scripts needed to set up and verify the SuperAdmin Dashboard functionality.

## 📋 Scripts Overview

### 1. **verify_and_create_tables.sql**
Creates the required tables if they don't exist and verifies their RLS policies.

**Tables Created:**
- `payment_history` - Stores all payment transactions
- `account_deletion_notices` - Tracks account deletion notices

**Run this first** to ensure the database schema is correct.

### 2. **create_superadmin_functions.sql**
Creates all PostgreSQL functions needed for SuperAdmin analytics.

**Functions Created:**
- `get_mrr()` - Monthly Recurring Revenue statistics
- `get_user_statistics()` - User count breakdown by plan and status
- `get_revenue_statistics()` - Total and monthly revenue
- `get_inactive_users(days_threshold)` - Find inactive users
- `get_total_bookings()` - Booking statistics
- `get_subscription_breakdown()` - Detailed subscription analysis
- `send_deletion_notice()` - Send account deletion notice
- `cancel_deletion_notice()` - Cancel scheduled deletion
- `process_inactive_accounts()` - Automated cleanup
- `update_user_last_active()` - Track user activity

**Run this second** after tables are created.

### 3. **add_superadmin_columns.sql**
Adds required columns to the `users_profile` table.

**Columns Added:**
- `username` - User's unique username
- `account_status` - Active/inactive/suspended status
- `last_active_at` - Last activity timestamp
- `deletion_notice_sent_at` - When deletion notice was sent
- `scheduled_deletion_at` - When account is scheduled for deletion
- `bookings_this_month` - Current month booking count

**Run this third** to ensure all user profile columns exist.

### 4. **comprehensive_verification.sql**
Comprehensive verification script that checks:
- All required tables exist
- All required functions exist
- Users_profile has all required columns
- RLS policies are properly configured
- Database functions return correct results
- Data counts and statistics

**Run this last** to verify everything is set up correctly.

### 5. **add_sample_data.sql** (OPTIONAL)
Adds sample payment history data for testing/demo purposes.

**What it does:**
- Creates 6 months of sample payment records for the current user
- Helps visualize the Payments tab with real-looking data
- Safe to run multiple times (uses ON CONFLICT DO NOTHING)

**Run this only if** you want to test the dashboard with sample data.

## 🚀 Quick Start - Step by Step

### Step 1: Run in Supabase SQL Editor

1. Open your Supabase project
2. Go to **SQL Editor**
3. Run scripts in this order:

```sql
-- 1. Create tables and RLS policies
-- Copy and run: verify_and_create_tables.sql

-- 2. Create all database functions
-- Copy and run: create_superadmin_functions.sql

-- 3. Add required columns to users_profile
-- Copy and run: add_superadmin_columns.sql

-- 4. Verify everything is set up
-- Copy and run: comprehensive_verification.sql
```

### Step 2: Verify Setup

After running `comprehensive_verification.sql`, check the final result:
- ✅ **SUPERADMIN DASHBOARD READY** = Everything is working!
- ❌ **SETUP INCOMPLETE** = Check the output to see what's missing

### Step 3: Add Sample Data (Optional)

If you want to see the Payments tab with data:

```sql
-- Copy and run: add_sample_data.sql
```

## 🔍 Troubleshooting

### Issue: "Table does not exist"
**Solution:** Run `verify_and_create_tables.sql`

### Issue: "Function does not exist"
**Solution:** Run `create_superadmin_functions.sql`

### Issue: "Column does not exist"
**Solution:** Run `add_superadmin_columns.sql`

### Issue: "Payments tab shows empty"
**Options:**
1. Wait for real payments to come in
2. Run `add_sample_data.sql` for demo data
3. The empty state UI will show a helpful message

### Issue: "Inactive Users tab shows empty"
**This is normal!** It means:
- No users have been inactive for 90+ days
- The empty state UI shows a success message
- Once users are inactive, they'll appear here

### Issue: "Deletions tab shows empty"
**This is normal!** It means:
- No deletion notices have been sent
- The empty state UI explains this
- Notices appear when sent to inactive users

## 📊 Dashboard Features

### Overview Tab
- **MRR Cards** - Total, Pro, and Business MRR (clickable → Payments)
- **User Statistics** - Total, Active, Free, Pro, Business, Inactive counts
- **Revenue Statistics** - Total, This Month, Last Month revenue
- **Charts** - Subscription breakdown and revenue trends
- **Activity Stats** - Total bookings and monthly breakdown

### Users Tab
- **Real-time user list** with all user details
- **Search** by name or email
- **Filter** by plan (Free, Pro, Business) or status
- **Pagination** for large user lists
- **Stats** showing total event types and bookings per user

### Payments Tab
- **Payment history** from `payment_history` table
- **Filter** by user, status, or plan type
- **Pagination** for large payment lists
- **Empty state** with helpful message when no payments

### Inactive Users Tab
- **Lists users** inactive for 90+ days
- **Send deletion notices** to inactive users
- **Bulk process** all inactive users
- **Empty state** shows success message when all users active

### Deletions Tab
- **Pending deletions** from `account_deletion_notices` table
- **Cancel** scheduled deletions
- **Empty state** explains no pending deletions

## 🔒 Security Features

All tables use **Row Level Security (RLS)**:

### Users_profile
- Users can view their own profile
- Superadmins can view all profiles

### Payment_history
- Users can view their own payments
- Superadmins can view all payments
- System can insert payment records

### Account_deletion_notices
- Users can view their own notices
- Superadmins can view all notices
- System can insert notices

## 📝 Database Schema

### payment_history
```sql
id                      UUID PRIMARY KEY
user_id                 UUID (references auth.users)
stripe_payment_id       VARCHAR(255)
stripe_customer_id      VARCHAR(255)
stripe_subscription_id  VARCHAR(255)
amount                  DECIMAL(10, 2)
currency                VARCHAR(3) DEFAULT 'GBP'
payment_status          VARCHAR(50)
payment_method          VARCHAR(50)
plan_type               VARCHAR(20)
billing_period_start    TIMESTAMP WITH TIME ZONE
billing_period_end      TIMESTAMP WITH TIME ZONE
metadata                JSONB
created_at              TIMESTAMP WITH TIME ZONE
updated_at              TIMESTAMP WITH TIME ZONE
```

### account_deletion_notices
```sql
id                      UUID PRIMARY KEY
user_id                 UUID (references auth.users)
notice_type             VARCHAR(50)
reason                  TEXT
days_inactive           INTEGER
scheduled_deletion_date TIMESTAMP WITH TIME ZONE
notice_sent_at          TIMESTAMP WITH TIME ZONE
status                  VARCHAR(20) DEFAULT 'sent'
metadata                JSONB
created_at              TIMESTAMP WITH TIME ZONE
```

## 🎯 Next Steps

1. **Run all SQL scripts** in Supabase SQL Editor
2. **Verify setup** using `comprehensive_verification.sql`
3. **Test the dashboard** - Navigate to `/superadmin` in your app
4. **(Optional) Add sample data** using `add_sample_data.sql`
5. **Monitor real data** as users sign up and make payments

## ✅ Success Criteria

Your SuperAdmin Dashboard is ready when:
- ✅ All tabs load without errors
- ✅ Overview tab shows real MRR and user statistics
- ✅ Users tab displays all users with search/filter
- ✅ Payments tab handles empty state gracefully
- ✅ Inactive Users tab shows empty state (or inactive users if any)
- ✅ Deletions tab shows empty state (or notices if any)
- ✅ All analytics cards show real data from database functions

## 🛠️ Maintenance

### Regular Tasks
- Monitor inactive users (90+ days)
- Review deletion notices before execution
- Track MRR and revenue trends
- Analyze subscription breakdown
- Check payment success rates

### Automated Tasks
The `process_inactive_accounts()` function can be:
- Called manually from the dashboard
- Scheduled with Supabase Edge Functions
- Integrated with cron jobs

---

**Need Help?**
- Check the verification output for specific errors
- All functions include error handling and logging
- Empty states are intentional and show helpful messages
- Consult the code comments in each SQL file for details
