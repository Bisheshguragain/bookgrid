# Supabase Email Template Setup Guide

This guide walks you through configuring the custom email templates for BookAgreed in your Supabase project.

---

## Prerequisites

- Supabase project created: `https://[your-project-id].supabase.co`
- Admin access to the Supabase dashboard
- Email template file: `supabase-email-templates/confirm-signup.html`

---

## Step 1: Access Supabase Email Templates

1. Go to your Supabase project dashboard:
   ```
   https://[your-project-id].supabase.co/project/[your-project-id]/auth/templates
   ```

2. You'll see a list of email templates:
   - ✉️ **Confirm signup** - Sent when users sign up
   - 🔑 **Magic Link** - Sent for passwordless login
   - 🔄 **Change Email Address** - Sent when users change email
   - 🔐 **Reset Password** - Sent for password reset

---

## Step 2: Configure "Confirm signup" Template

### 2.1 Select the Template

1. Click on **"Confirm signup"** in the templates list
2. You'll see the default Supabase template

### 2.2 Replace with Custom Template

1. Open the file: `/Users/millionairemindset/Calendly/supabase-email-templates/confirm-signup.html`

2. Copy the entire contents of the file

3. In the Supabase dashboard:
   - Clear the existing template
   - Paste the BookAgreed custom template
   - Click **"Save"**

### 2.3 Verify Template Variables

The template uses these Supabase variables (automatically populated):

- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .UserMetadata.full_name }}` - User's full name (from signup)
- `{{ .UserMetadata.name }}` - Alternative name field

These are automatically injected by Supabase when sending emails.

---

## Step 3: Test Email Delivery

### 3.1 Test Signup Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:5173/signup`

3. Create a new account:
   - Full Name: Test User
   - Email: your-test-email@example.com
   - Password: Test1234!

4. Check your email inbox for the confirmation email

### 3.2 Verify Email Contents

The email should contain:
- ✅ BookAgreed branding
- ✅ Personalized greeting with your name
- ✅ "Confirm Email Address" button
- ✅ Fallback text link
- ✅ Expiration notice (24 hours)
- ✅ Professional footer

### 3.3 Test Confirmation Link

1. Click the "Confirm Email Address" button
2. You should be redirected to: `https://bookagreed.com/login`
3. Log in with your credentials
4. Your profile will be created automatically

---

## Step 4: Configure Other Email Templates (Optional)

### Reset Password Template

1. Go to **"Reset Password"** template
2. Create a similar branded template
3. Use variable: `{{ .ConfirmationURL }}`

### Magic Link Template

1. Go to **"Magic Link"** template
2. Create a similar branded template
3. Use variable: `{{ .ConfirmationURL }}`

### Change Email Template

1. Go to **"Change Email Address"** template
2. Create a similar branded template
3. Use variables:
   - `{{ .ConfirmationURL }}`
   - `{{ .Email }}`
   - `{{ .NewEmail }}`

---

## Step 5: Brevo Sender Verification

For production email delivery, verify your sender email in Brevo:

### 5.1 Access Brevo Dashboard

1. Go to: `https://app.brevo.com/senders`
2. Sign in with your Brevo account

### 5.2 Add Sender Email

1. Click **"Add a sender"**
2. Enter:
   - **Email:** `noreply@bookagreed.com`
   - **Name:** `Noreply-BookAgreed`
3. Click **"Save"**

### 5.3 Verify Domain

You'll receive a verification email or need to add DNS records:

**Option 1: Email Verification**
- Check the inbox for `noreply@bookagreed.com`
- Click the verification link

**Option 2: DNS Verification** (recommended for production)
- Add these DNS records to your domain:
  ```
  Type: TXT
  Host: @
  Value: [provided by Brevo]
  ```
- Add SPF record:
  ```
  Type: TXT
  Host: @
  Value: v=spf1 include:spf.brevo.com ~all
  ```
- Add DKIM record (provided by Brevo)

### 5.4 Check Verification Status

- Status should show: ✅ **Verified**
- If not verified, emails may land in spam or not be delivered

---

## Step 6: Email Monitoring

### 6.1 Brevo Dashboard

Monitor email delivery at:
```
https://app.brevo.com/statistics
```

You can track:
- 📧 Emails sent
- ✅ Delivered
- ❌ Bounced
- 📊 Open rate
- 🔗 Click rate

### 6.2 Supabase Auth Logs

Monitor auth events at:
```
https://[your-project-id].supabase.co/project/[your-project-id]/auth/users
```

Check for:
- User signups
- Email confirmations
- Login events

---

## Troubleshooting

### Email Not Received

**Check Spam Folder**
- Custom templates may trigger spam filters initially
- Sender verification reduces spam likelihood

**Check Brevo Logs**
- Go to: `https://app.brevo.com/statistics`
- Check if email was sent and delivered

**Check Supabase Logs**
- Go to: Auth → Logs
- Look for email send events

### Confirmation Link Not Working

**Check Redirect URL**
- Should be: `https://bookagreed.com/login` (production)
- Or: `http://localhost:5173/login` (development)

**Update in code:**
```typescript
// src/store/authStore.ts
emailRedirectTo: `${window.location.origin}/login`
```

**Update in Supabase Dashboard:**
- Go to: Auth → URL Configuration
- Add your domain to **Redirect URLs**:
  - `https://bookagreed.com/**`
  - `http://localhost:5173/**`

### Template Variables Not Showing

**Check Metadata**
Make sure signup includes metadata:
```typescript
const { error, data } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName, // ✅ This populates {{ .UserMetadata.full_name }}
    },
  },
});
```

---

## Production Checklist

Before going live, ensure:

- [ ] ✅ Custom email template uploaded to Supabase
- [ ] ✅ Sender email verified in Brevo
- [ ] ✅ SPF/DKIM records added to domain
- [ ] ✅ Test signup flow end-to-end
- [ ] ✅ Test booking confirmation emails
- [ ] ✅ Check spam folder
- [ ] ✅ Monitor Brevo dashboard for delivery rate
- [ ] ✅ Set up email alerts for failures

---

## Advanced: Email Template Customization

### Changing Colors

Edit `confirm-signup.html`:

```html
<!-- Primary color -->
<style>
  .button { background: #7c3aed !important; } /* Purple */
</style>
```

Change `#7c3aed` to your brand color.

### Changing Logo

Replace:
```html
<img src="https://bookagreed.vercel.app/logo192.png" alt="BookAgreed" width="80" />
```

With your logo URL.

### Adding Custom Content

Add sections between the header and footer:
```html
<p>Your custom message here</p>
```

---

## Support

If you encounter issues:

1. **Supabase Support:** https://supabase.com/support
2. **Brevo Support:** https://help.brevo.com/
3. **BookAgreed Docs:** See `EMAIL_CONFIRMATION_AUDIT.md`

---

**Setup Completed:** ✅  
**Email System Status:** PRODUCTION READY

