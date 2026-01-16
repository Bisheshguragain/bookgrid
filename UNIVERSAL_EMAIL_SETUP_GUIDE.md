# Universal Email Setup Guide - book@bookagreed.com

**Date:** January 16, 2026  
**Purpose:** Centralize all email sending through book@bookagreed.com  
**Status:** 📧 **CONFIGURATION GUIDE**

---

## Overview

Yes! You can absolutely use `book@bookagreed.com` as your **universal sender** for ALL emails:
- ✅ Booking confirmations
- ✅ Appointment reminders (24h, 1h before)
- ✅ Cancellation notifications
- ✅ Reschedule confirmations
- ✅ Password resets
- ✅ Welcome emails

This is **recommended** for:
- 🎯 Brand consistency (all emails from one address)
- 📧 Better deliverability (verified domain)
- 💬 Direct replies go to your inbox
- 🔍 Easier tracking and monitoring

---

## Current Email Provider Options

You have **2 main options** for sending emails:

### Option 1: Email Service Provider (Recommended) ⭐

Use a professional email service like:
- **Brevo (formerly Sendinblue)** - Currently configured ✅
- SendGrid
- Mailgun
- Amazon SES
- Postmark

**Pros:**
- ✅ High deliverability (99%+ inbox rate)
- ✅ Professional templates
- ✅ Analytics and tracking
- ✅ Free tier available (300 emails/day on Brevo)
- ✅ Handles bounce management
- ✅ Already integrated in your app

**Cons:**
- ⚠️ Requires API key setup
- ⚠️ Domain verification needed

---

### Option 2: Direct SMTP (book@bookagreed.com mailbox) 📮

Use `book@bookagreed.com` directly via SMTP settings from your email provider (Google Workspace, Microsoft 365, etc.)

**Pros:**
- ✅ No third-party service needed
- ✅ Replies go directly to your inbox
- ✅ Full control

**Cons:**
- ⚠️ Lower sending limits (usually 500-2000/day)
- ⚠️ Risk of being marked as spam if volume is high
- ⚠️ No professional analytics
- ⚠️ Requires SMTP credentials

---

## ⭐ Recommended Setup: Brevo with book@bookagreed.com

**Best of both worlds:** Use Brevo (professional service) but send FROM `book@bookagreed.com`

### Step 1: Verify book@bookagreed.com in Brevo

1. **Login to Brevo:**
   - Go to: https://app.brevo.com/

2. **Add Sender:**
   - Navigate to: **Senders, Domains & Dedicated IPs** → **Senders**
   - Click **"Add a Sender"**
   - Enter:
     - **Name:** BookAgreed
     - **Email:** book@bookagreed.com

3. **Verify Email:**
   - Brevo will send a verification email to `book@bookagreed.com`
   - Check your inbox and click the verification link
   - ✅ Done! `book@bookagreed.com` is now verified

---

### Step 2: Update .env Configuration

Update your `.env` file (or Vercel/Netlify environment variables):

```bash
# Email Service Configuration
VITE_BREVO_API_KEY=your-brevo-api-key-here

# Universal Sender Email - ALL emails will come from this address
VITE_EMAIL_FROM=book@bookagreed.com
VITE_EMAIL_FROM_NAME=BookAgreed

# Support/Reply-To Email (can be the same)
VITE_SUPPORT_EMAIL=book@bookagreed.com

# Application URLs
VITE_APP_URL=https://bookagreed.com
VITE_APP_NAME=BookAgreed
```

---

### Step 3: Verify the Configuration

Your `src/services/emailService.ts` is already set up to use these environment variables:

```typescript
// All emails will automatically use these settings:
const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM || 'noreply@bookagreed.com';
const EMAIL_FROM_NAME = import.meta.env.VITE_EMAIL_FROM_NAME || 'BookAgreed';
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@bookagreed.com';
```

✅ **No code changes needed!** Just update the environment variables.

---

### Step 4: Domain Authentication (Optional but Recommended)

For **maximum deliverability**, verify your domain in Brevo:

1. **Go to Brevo Dashboard:**
   - **Senders, Domains & Dedicated IPs** → **Domains**

2. **Add Domain:**
   - Enter: `bookagreed.com`

3. **Add DNS Records:**
   Brevo will give you DNS records to add to your domain registrar (e.g., Cloudflare, GoDaddy):
   - **SPF record** (TXT)
   - **DKIM record** (TXT)
   - **DMARC record** (TXT) - optional

4. **Example DNS Records:**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:spf.brevo.com ~all
   
   Type: TXT
   Name: mail._domainkey
   Value: [DKIM key from Brevo]
   ```

5. **Wait for Verification:**
   - Can take up to 48 hours
   - Brevo will show ✅ when verified

---

## Email Types and Sender

With this setup, **all** emails will come from `book@bookagreed.com`:

### 📧 Email Type Breakdown

| Email Type | Sender | Reply-To | Subject Example |
|------------|--------|----------|-----------------|
| **Booking Confirmation** | book@bookagreed.com | book@bookagreed.com | "Booking Confirmed: 30-Minute Consultation" |
| **24h Reminder** | book@bookagreed.com | book@bookagreed.com | "Reminder: Your appointment is tomorrow" |
| **1h Reminder** | book@bookagreed.com | book@bookagreed.com | "Reminder: Your appointment starts in 1 hour!" |
| **Cancellation Notice** | book@bookagreed.com | book@bookagreed.com | "Appointment Cancelled: 30-Minute Consultation" |
| **Reschedule Confirmation** | book@bookagreed.com | book@bookagreed.com | "Appointment Rescheduled Successfully" |
| **Welcome Email** | book@bookagreed.com | book@bookagreed.com | "Welcome to BookAgreed!" |

✅ **Result:** Clients see `book@bookagreed.com` for everything - clean and professional!

---

## Alternative: Direct SMTP Setup (No Brevo)

If you want to bypass third-party services and use `book@bookagreed.com` mailbox directly:

### Prerequisites:
- Google Workspace, Microsoft 365, or any email provider with SMTP access
- SMTP credentials for `book@bookagreed.com`

### Implementation:

You'll need to create a new email service using SMTP instead of Brevo API.

**Example with Nodemailer (if using server-side):**

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com', // or smtp.office365.com
  port: 587,
  secure: false,
  auth: {
    user: 'book@bookagreed.com',
    pass: 'your-app-password', // Use app password, not regular password
  },
});

// Send email
await transporter.sendMail({
  from: 'BookAgreed <book@bookagreed.com>',
  to: guestEmail,
  subject: 'Booking Confirmed',
  html: emailHtml,
});
```

**⚠️ Limitations:**
- Gmail: 500 emails/day
- Microsoft 365: 500-2000/day depending on plan
- Risk of being flagged as spam if sending bulk

---

## Testing Your Setup

### Test Email Sending:

1. **Create a test booking** on your app
2. **Check recipient email** (should receive from `book@bookagreed.com`)
3. **Check spam folder** (if email lands there, domain authentication needed)
4. **Reply to email** (should go to `book@bookagreed.com` inbox)

### Verify Sender:

```bash
# In your browser console or test script:
console.log('Email From:', import.meta.env.VITE_EMAIL_FROM);
console.log('Email From Name:', import.meta.env.VITE_EMAIL_FROM_NAME);
```

Expected output:
```
Email From: book@bookagreed.com
Email From Name: BookAgreed
```

---

## Brevo Free Tier Limits

- ✅ **300 emails/day** (free forever)
- ✅ Unlimited contacts
- ✅ Email analytics
- ✅ Transactional emails

**If you exceed:**
- Upgrade to paid plan (starting ~$25/month for 20,000 emails/month)
- Or combine with another service for overflow

---

## Benefits of Using book@bookagreed.com

✅ **Brand Consistency:** All emails from one recognizable address  
✅ **Customer Trust:** Professional, branded sender  
✅ **Reply Management:** All replies go to one inbox  
✅ **Easy Monitoring:** Track all emails in one account  
✅ **Better Deliverability:** Verified domain = better inbox rate  
✅ **Unified Analytics:** See all email stats in one place  

---

## Email Template Examples

With `book@bookagreed.com` as sender, here's what clients see:

### Booking Confirmation Email

```
From: BookAgreed <book@bookagreed.com>
To: john@example.com
Subject: ✅ Booking Confirmed: 30-Minute Consultation

Hi John,

Your appointment has been confirmed!

📅 Date: Monday, January 20, 2026
🕐 Time: 2:00 PM - 2:30 PM GMT
📍 Location: Zoom Meeting

[View Booking Details] [Add to Calendar]

Need to reschedule or cancel?
Click here: [Manage Booking]

Best regards,
The BookAgreed Team
book@bookagreed.com
```

### Reminder Email (24h before)

```
From: BookAgreed <book@bookagreed.com>
To: john@example.com
Subject: ⏰ Reminder: Your appointment is tomorrow

Hi John,

This is a friendly reminder about your upcoming appointment:

📅 Tomorrow at 2:00 PM GMT
🕐 30-Minute Consultation
📍 Zoom Meeting

Join link will be sent 1 hour before the meeting.

[View Booking Details] [Reschedule]

See you tomorrow!
BookAgreed
book@bookagreed.com
```

---

## Troubleshooting

### Emails Not Sending?

1. **Check Brevo API Key:** Make sure it's valid and not expired
2. **Verify Sender:** `book@bookagreed.com` must be verified in Brevo
3. **Check Console Errors:** Look for API errors in browser/server logs
4. **Test API Key:**
   ```bash
   curl -X GET "https://api.brevo.com/v3/account" \
     -H "api-key: YOUR_BREVO_API_KEY"
   ```

### Emails Going to Spam?

1. **Verify Domain:** Add SPF, DKIM, DMARC records
2. **Check Content:** Avoid spam trigger words ("free", "click here", too many caps)
3. **Warm Up:** Start with low volume, gradually increase
4. **Monitor Bounce Rate:** Keep under 5%

### Wrong Sender Showing?

1. **Check .env file:** Make sure `VITE_EMAIL_FROM=book@bookagreed.com`
2. **Rebuild app:** Run `npm run build` after changing .env
3. **Clear cache:** Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)

---

## Deployment Checklist

When deploying to production:

- [ ] Update environment variables in hosting platform (Vercel/Netlify/etc)
- [ ] Set `VITE_EMAIL_FROM=book@bookagreed.com`
- [ ] Set `VITE_EMAIL_FROM_NAME=BookAgreed`
- [ ] Set `VITE_SUPPORT_EMAIL=book@bookagreed.com`
- [ ] Verify `book@bookagreed.com` in Brevo
- [ ] Add domain verification DNS records
- [ ] Test sending emails in production
- [ ] Monitor inbox for replies
- [ ] Set up email forwarding rules (if needed)

---

## Summary

✅ **You can absolutely use `book@bookagreed.com` for all emails!**

**Recommended Setup:**
1. Use Brevo as the email service (free 300 emails/day)
2. Set sender to `book@bookagreed.com` (verified in Brevo)
3. Update `.env` file with correct settings
4. No code changes needed - already configured!
5. Test and deploy

**Result:** All booking confirmations, reminders, and cancellations come from `book@bookagreed.com` - professional, branded, and centralized! 📧✅

---

*Last Updated: January 16, 2026*
