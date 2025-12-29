# ⚡ Quick Start - Subscription Tiers

## 🚀 Setup in 5 Minutes

### 1. Run Database Migration

```bash
# Connect to your Supabase database
psql -h your-database-url -U postgres

# Run the migration
\i migrations/add_subscription_tiers.sql
```

**Or via Supabase Dashboard**:
1. Go to SQL Editor
2. Paste contents of `migrations/add_subscription_tiers.sql`
3. Click "Run"

✅ Done! Plans created automatically.

---

### 2. Verify Installation

**Check Plans Table**:
```sql
SELECT name, display_name, price_monthly, max_event_types 
FROM subscription_plans 
WHERE is_active = true;
```

**Expected Output**:
```
 name     | display_name | price_monthly | max_event_types
----------|--------------|---------------|----------------
 free     | Free         |          0.00 |               1
 pro      | Pro          |         12.00 |              10
 business | Business     |         24.00 |              -1
```

---

### 3. Test the Features

#### Visit Pricing Page
```
http://localhost:5173/app/pricing
```

You should see 3 plan cards with:
- ✅ Free, Pro, Business plans
- ✅ Pricing toggle (Monthly/Yearly)
- ✅ Feature lists
- ✅ Upgrade buttons

#### Test Rate Limiting

**Event Type Limit (Free Plan)**:
1. Go to Event Types
2. Create 1 event type ✅
3. Try to create 2nd event type
4. See upgrade prompt ✅

**Upgrade Test**:
1. Click "View Pricing Plans"
2. Click "Upgrade Now" on Pro plan
3. See success message
4. Can now create more event types ✅

---

## 📊 Default Plans

### Free (£0/month)
- 1 event type
- 100 bookings/month
- Basic features

### Pro (£12/month)
- 10 event types
- 1,000 bookings/month
- All features + analytics

### Business (£24/month)
- Unlimited event types
- Unlimited bookings
- All features + priority support

---

## 🔧 Configuration

### Change Plan Limits

```sql
-- Update Pro plan to allow 20 event types
UPDATE subscription_plans 
SET max_event_types = 20 
WHERE name = 'pro';

-- Update Pro plan booking limit
UPDATE subscription_plans 
SET max_bookings_per_month = 2000 
WHERE name = 'pro';
```

### Change Pricing

```sql
-- Update Pro pricing
UPDATE subscription_plans 
SET 
  price_monthly = 15.00,
  price_yearly = 150.00
WHERE name = 'pro';
```

### Add Custom Plan

```sql
INSERT INTO subscription_plans (
  name, 
  display_name, 
  price_monthly, 
  price_yearly,
  max_event_types,
  max_bookings_per_month,
  features
) VALUES (
  'enterprise',
  'Enterprise',
  99.00,
  990.00,
  -1,
  -1,
  '{"availability": "advanced", "reminders": true, "public_link": true, "analytics": true, "integrations": true, "custom_branding": true, "priority_support": true, "api_access": true}'::jsonb
);
```

---

## ✅ Verification Checklist

- [ ] Migration ran successfully
- [ ] 3 plans exist in database
- [ ] Pricing page loads
- [ ] Can toggle Monthly/Yearly
- [ ] Upgrade button works
- [ ] Rate limiting works for event types
- [ ] Upgrade prompt appears when hitting limits
- [ ] Can successfully upgrade plans

---

## 🆘 Troubleshooting

### Migration Fails

**Error**: Table already exists
```sql
-- Drop tables and retry
DROP TABLE IF EXISTS subscription_plans CASCADE;
-- Then run migration again
```

**Error**: Column already exists
```sql
-- Check if columns exist
\d users_profile
-- Drop duplicate columns if needed
```

### Plans Not Showing

Check if plans are active:
```sql
SELECT * FROM subscription_plans WHERE is_active = false;
```

Enable inactive plans:
```sql
UPDATE subscription_plans SET is_active = true;
```

### Rate Limiting Not Working

Check user's subscription:
```sql
SELECT subscription_plan, bookings_this_month 
FROM users_profile 
WHERE email = 'user@example.com';
```

Reset user's booking count:
```sql
UPDATE users_profile 
SET bookings_this_month = 0 
WHERE email = 'user@example.com';
```

---

## 📚 Next Steps

1. **Read Full Documentation**: `SUBSCRIPTION_TIERS_IMPLEMENTATION.md`
2. **Integrate Payment**: Add Stripe for real payments
3. **Customize Plans**: Adjust limits and pricing
4. **Add Analytics**: Track conversions and usage
5. **Test Thoroughly**: Test all upgrade paths

---

## 🎯 Quick Reference

### Routes
- Pricing Page: `/app/pricing`
- Upgrade Prompt: Automatic when hitting limits

### Services
```typescript
import { 
  getUserSubscription,
  canCreateEventType,
  canCreateBooking,
  upgradeSubscription
} from '../services/subscriptionService';
```

### Database Functions
```sql
-- Check if can create event type
SELECT can_create_event_type('user-uuid');

-- Check if can create booking
SELECT can_create_booking('user-uuid');

-- Increment booking count
SELECT increment_booking_count('user-uuid');

-- Reset monthly bookings
SELECT reset_monthly_bookings();
```

---

**Setup Time**: ~5 minutes  
**Status**: ✅ Ready to use  
**Support**: See full documentation for details

Happy billing! 💰
