# Calendar Integration & Currency Settings Implementation Guide

**Date:** January 7, 2026  
**Feature:** Calendar sync (Google/Outlook) and Currency preferences in Settings  
**Security Level:** HIGH - OAuth 2.0, encrypted tokens, secure API handling

---

## Overview

This feature adds calendar integration and currency settings to user profiles, allowing:
- Google Calendar synchronization
- Microsoft Outlook Calendar synchronization  
- Multi-currency support (USD, GBP, EUR, INR, CAD, etc.)
- Two-way calendar sync (blocks booking times when busy)
- Automatic event creation
- Client calendar invites (.ics files)

---

## Database Schema Changes

### New Columns in `users_profile` table:

```sql
-- Currency
currency TEXT DEFAULT 'GBP'

-- Google Calendar
google_calendar_connected BOOLEAN DEFAULT FALSE
google_calendar_email TEXT
google_calendar_refresh_token TEXT  -- Encrypted
google_calendar_access_token TEXT   -- Encrypted
google_calendar_token_expiry TIMESTAMP WITH TIME ZONE

-- Outlook Calendar  
outlook_calendar_connected BOOLEAN DEFAULT FALSE
outlook_calendar_email TEXT
outlook_calendar_refresh_token TEXT  -- Encrypted
outlook_calendar_access_token TEXT   -- Encrypted
outlook_calendar_token_expiry TIMESTAMP WITH TIME ZONE

-- Calendar Settings
calendar_auto_sync BOOLEAN DEFAULT TRUE
calendar_send_invites BOOLEAN DEFAULT TRUE
calendar_two_way_sync BOOLEAN DEFAULT FALSE
```

### New Table: `calendar_sync_log`

```sql
CREATE TABLE calendar_sync_log (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users_profile(id),
    booking_id UUID REFERENCES bookings(id),
    sync_type TEXT, -- 'google' or 'outlook'
    action TEXT,    -- 'create', 'update', 'delete'
    status TEXT,    -- 'success', 'failed', 'pending'
    error_message TEXT,
    synced_at TIMESTAMP WITH TIME ZONE
);
```

---

## Security Considerations

### 🔒 Critical Security Requirements

1. **OAuth 2.0 Flow**
   - Use official Google/Microsoft OAuth libraries
   - Never store passwords
   - Use authorization code flow (not implicit)
   - Validate redirect URIs strictly

2. **Token Encryption**
   ```typescript
   // Encrypt before storing
   const encrypted = encrypt(refreshToken, process.env.ENCRYPTION_KEY);
   
   // Decrypt when using
   const decrypted = decrypt(encryptedToken, process.env.ENCRYPTION_KEY);
   ```

3. **Token Security**
   - ❌ Never expose tokens in API responses
   - ❌ Never log tokens
   - ❌ Never send tokens to client-side
   - ✅ Store encrypted in database
   - ✅ Refresh tokens before expiry
   - ✅ Use service role for calendar operations

4. **Row Level Security (RLS)**
   - Users can only access their own calendar settings
   - Tokens are never returned in SELECT queries
   - Use PostgreSQL functions for token operations

5. **API Rate Limiting**
   - Implement rate limits for calendar sync operations
   - Handle Google/Microsoft API quota limits
   - Implement exponential backoff for retries

6. **Error Handling**
   - Never expose internal errors to users
   - Log errors securely (without tokens)
   - Gracefully handle API failures

---

## OAuth 2.0 Flow Implementation

### Google Calendar OAuth

```typescript
// 1. Initiate OAuth flow
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?
  client_id=${GOOGLE_CLIENT_ID}&
  redirect_uri=${REDIRECT_URI}&
  response_type=code&
  scope=https://www.googleapis.com/auth/calendar&
  access_type=offline&
  prompt=consent&
  state=${secureRandomState()}`;

// 2. Handle callback
async function handleGoogleCallback(code: string, state: string) {
  // Verify state (CSRF protection)
  if (!verifyState(state)) throw new Error('Invalid state');
  
  // Exchange code for tokens
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  
  const { access_token, refresh_token, expires_in } = await response.json();
  
  // Get user's calendar email
  const calendarResponse = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/settings/timezone',
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const { value: email } = await calendarResponse.json();
  
  // Encrypt tokens before storing
  const encryptedRefresh = encrypt(refresh_token);
  const encryptedAccess = encrypt(access_token);
  const expiry = new Date(Date.now() + expires_in * 1000);
  
  // Store in database (service role only)
  await supabase.rpc('store_google_calendar_tokens', {
    p_user_id: userId,
    p_email: email,
    p_refresh_token: encryptedRefresh,
    p_access_token: encryptedAccess,
    p_expiry: expiry
  });
}

// 3. Refresh access token when expired
async function refreshGoogleToken(userId: string) {
  // Get encrypted refresh token (service role)
  const { data } = await supabase.rpc('get_google_refresh_token', {
    p_user_id: userId
  });
  
  const refreshToken = decrypt(data.refresh_token);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token'
    })
  });
  
  const { access_token, expires_in } = await response.json();
  const encryptedAccess = encrypt(access_token);
  const expiry = new Date(Date.now() + expires_in * 1000);
  
  await supabase.rpc('update_google_access_token', {
    p_user_id: userId,
    p_access_token: encryptedAccess,
    p_expiry: expiry
  });
  
  return access_token;
}
```

### Microsoft Outlook OAuth

```typescript
// Similar flow using Microsoft Graph API
const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?
  client_id=${MICROSOFT_CLIENT_ID}&
  response_type=code&
  redirect_uri=${REDIRECT_URI}&
  response_mode=query&
  scope=Calendars.ReadWrite offline_access&
  state=${secureRandomState()}`;
```

---

## Calendar Sync Implementation

### Creating Events

```typescript
async function syncBookingToGoogleCalendar(booking: Booking) {
  const accessToken = await getValidGoogleToken(booking.user_id);
  
  const event = {
    summary: booking.event_title,
    description: booking.notes,
    start: {
      dateTime: booking.start_time,
      timeZone: booking.host_time_zone
    },
    end: {
      dateTime: booking.end_time,
      timeZone: booking.host_time_zone
    },
    attendees: [
      { email: booking.guest_email, displayName: booking.guest_name }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 }
      ]
    }
  };
  
  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );
    
    const data = await response.json();
    
    // Log sync
    await logCalendarSync({
      user_id: booking.user_id,
      booking_id: booking.id,
      sync_type: 'google',
      action: 'create',
      status: 'success'
    });
    
    return data;
  } catch (error) {
    await logCalendarSync({
      user_id: booking.user_id,
      booking_id: booking.id,
      sync_type: 'google',
      action: 'create',
      status: 'failed',
      error_message: error.message
    });
    
    throw error;
  }
}
```

### Two-Way Sync (Check Busy Times)

```typescript
async function getGoogleBusyTimes(userId: string, startDate: Date, endDate: Date) {
  const accessToken = await getValidGoogleToken(userId);
  
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/freeBusy',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: 'primary' }]
      })
    }
  );
  
  const data = await response.json();
  return data.calendars.primary.busy; // Array of busy time ranges
}
```

---

## Encryption Implementation

### Using crypto library

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export function encrypt(text: string, secret: string = process.env.ENCRYPTION_KEY): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha512');
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decrypt(encryptedData: string, secret: string = process.env.ENCRYPTION_KEY): string {
  const buffer = Buffer.from(encryptedData, 'base64');
  
  const salt = buffer.slice(0, SALT_LENGTH);
  const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha512');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

---

## PostgreSQL Functions for Token Management

```sql
-- Store Google Calendar tokens (service role only)
CREATE OR REPLACE FUNCTION store_google_calendar_tokens(
  p_user_id UUID,
  p_email TEXT,
  p_refresh_token TEXT,
  p_access_token TEXT,
  p_expiry TIMESTAMP WITH TIME ZONE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users_profile
  SET
    google_calendar_connected = TRUE,
    google_calendar_email = p_email,
    google_calendar_refresh_token = p_refresh_token,
    google_calendar_access_token = p_access_token,
    google_calendar_token_expiry = p_expiry,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Get refresh token (service role only, never exposed to client)
CREATE OR REPLACE FUNCTION get_google_refresh_token(p_user_id UUID)
RETURNS TABLE(refresh_token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT google_calendar_refresh_token
  FROM users_profile
  WHERE id = p_user_id;
END;
$$;

-- Revoke: Only set ROLE, service role should never call this with an exposed service_role key
REVOKE EXECUTE ON FUNCTION get_google_refresh_token FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_google_refresh_token TO service_role;
```

---

## Currency Support

### Supported Currencies

```typescript
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound', default: true },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];
```

### Currency Formatting

```typescript
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(amount);
}
```

---

## Environment Variables Required

Add to `.env`:

```bash
# Google Calendar OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_OAUTH_REDIRECT_URI=https://bookagreed.com/auth/google/callback

# Microsoft Outlook OAuth
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
VITE_MICROSOFT_OAUTH_REDIRECT_URI=https://bookagreed.com/auth/microsoft/callback

# Server-side only (not VITE_ prefix)
GOOGLE_CLIENT_SECRET=your-google-secret
MICROSOFT_CLIENT_SECRET=your-microsoft-secret
ENCRYPTION_KEY=your-32-byte-encryption-key
```

---

## Testing Checklist

- [ ] OAuth flow redirects correctly
- [ ] Tokens are encrypted before storage
- [ ] Tokens are never exposed in API responses
- [ ] Calendar events sync successfully
- [ ] Two-way sync blocks booking times
- [ ] Calendar invites are sent to clients
- [ ] Currency formatting works for all supported currencies
- [ ] Settings save correctly
- [ ] Disconnecting calendar works
- [ ] RLS policies prevent unauthorized access
- [ ] Rate limiting prevents abuse
- [ ] Error handling is graceful

---

## Future Enhancements

1. **Apple Calendar Support** - iCloud integration
2. **Multiple Calendar Support** - Sync to multiple calendars
3. **Calendar Selection** - Choose which calendar to sync to
4. **Event Templates** - Customize calendar event details
5. **Webhook Support** - Real-time calendar updates
6. **Conflict Detection** - Warn before double-booking
7. **Sync History Dashboard** - View sync logs in UI

---

*Last Updated: January 7, 2026*
