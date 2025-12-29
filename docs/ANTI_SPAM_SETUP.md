# Anti-Spam Protection Setup Guide

## Overview

This document explains how to set up the multi-layer anti-spam protection for BookGrid's public booking pages.

## Protection Layers

| Layer | Protection | How It Works |
|-------|------------|--------------|
| 1 | Email Rate Limiting | 10/hour, 20/day per email |
| 2 | Fingerprint Limiting | 15/hour per browser |
| 3 | Host Protection | 20 bookings/hour per host |
| 4 | Honeypot Field | Hidden field that bots fill |
| 5 | Time-Based Detection | Forms submitted < 2s = bot |
| 6 | Disposable Email Block | 35+ throwaway domains blocked |
| 7 | IP Rate Limiting | 15/hour via Edge Function |
| 8 | CAPTCHA Integration | Turnstile for high-risk scenarios |
| 9 | Auto-Block Repeat Offenders | 10+ failures = temp block |

## Setup Steps

### 1. Apply Database Migrations

Run the SQL in `sql/ANTI_SPAM_PROTECTION.sql` in your Supabase SQL Editor:

```bash
# Or use the Supabase CLI
supabase db push
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Optional: Cloudflare Turnstile CAPTCHA
# Get keys from: https://dash.cloudflare.com/?to=/:account/turnstile
VITE_TURNSTILE_SITE_KEY=your_site_key_here
```

### 3. Deploy Edge Function (for IP-based rate limiting)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set the Turnstile secret key
supabase secrets set TURNSTILE_SECRET_KEY=your_secret_key_here

# Deploy the edge function
supabase functions deploy check-booking-limit
```

### 4. Set Up Cron Jobs

In Supabase Dashboard → Database → Extensions, enable `pg_cron`.

Then run these SQL commands to set up automated tasks:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Auto-block repeat offenders every hour
SELECT cron.schedule(
    'auto-block-offenders',
    '0 * * * *',  -- Every hour
    $$SELECT public.auto_block_repeat_offenders()$$
);

-- Cleanup old logs daily at 3 AM
SELECT cron.schedule(
    'cleanup-booking-logs',
    '0 3 * * *',  -- Daily at 3 AM
    $$SELECT public.cleanup_booking_attempts_log()$$
);

-- Cleanup rate limit records daily at 3:30 AM
SELECT cron.schedule(
    'cleanup-rate-limits',
    '30 3 * * *',  -- Daily at 3:30 AM
    $$SELECT public.cleanup_booking_rate_limits()$$
);
```

### 5. Optional: Use Edge Function for Better IP Detection

To use the Edge Function instead of direct RPC calls, update the `useAntiSpam` hook:

```typescript
// In your booking flow, call the edge function:
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-booking-limit`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      guestEmail: formData.email,
      fingerprint: browserFingerprint,
      hostUserId: eventType.user_id,
      eventTypeId: eventType.id,
      formLoadTime: formLoadTimestamp,
      honeypotValue: formData.website,
      userAgent: navigator.userAgent,
      turnstileToken: captchaToken, // If CAPTCHA was solved
    }),
  }
);
```

## Monitoring

### View Suspicious Activity

```sql
SELECT * FROM spam_monitoring_24h;
```

### View Block Statistics

```sql
SELECT * FROM spam_block_stats;
```

### View Top Blocked Fingerprints

```sql
SELECT * FROM top_blocked_fingerprints;
```

### Manually Block an Email/Domain

```sql
-- Block a specific email
INSERT INTO blocked_identifiers (identifier, identifier_type, reason)
VALUES ('spam@example.com', 'email', 'Manual block - spam');

-- Block an email domain
INSERT INTO blocked_identifiers (identifier, identifier_type, reason)
VALUES ('spamdomain.com', 'email_domain', 'Manual block - spam domain');
```

### Unblock an Identifier

```sql
DELETE FROM blocked_identifiers 
WHERE identifier = 'example@email.com' AND identifier_type = 'email';
```

## Testing

### Test Honeypot Detection

Fill the hidden `website` field in the booking form - should be blocked.

### Test Rate Limiting

Make more than 10 bookings in an hour with the same email - should be rate limited.

### Test Fast Submission Detection

Submit the form within 2 seconds of loading - should be blocked.

## Troubleshooting

### Legitimate users being blocked

1. Check `booking_attempts_log` to see why they were blocked
2. Adjust rate limits in `check_booking_rate_limit_v2` function
3. Manually unblock their email/fingerprint if needed

### CAPTCHA not loading

1. Verify `VITE_TURNSTILE_SITE_KEY` is set correctly
2. Check browser console for errors
3. Ensure the domain is added to Turnstile allowed domains

### Edge Function errors

```bash
# View function logs
supabase functions logs check-booking-limit
```
