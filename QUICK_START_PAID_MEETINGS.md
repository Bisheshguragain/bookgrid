# ⚡ Quick Start Guide - Paid Meetings Feature

## 🚀 Setup (One-Time)

### Step 1: Run Database Migration
Open Supabase SQL Editor and run:

```sql
ALTER TABLE event_types 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_link TEXT,
ADD COLUMN IF NOT EXISTS payment_instructions TEXT DEFAULT 'Payments are to be made upfront at least 1 hour prior to appointment. Please email the payment confirmation once it is done.';

ALTER TABLE event_types
ADD CONSTRAINT payment_link_required_if_paid 
CHECK (is_paid = false OR (is_paid = true AND payment_link IS NOT NULL AND length(payment_link) > 0));
```

### Step 2: Refresh Application
- Refresh your browser
- New features are now active!

---

## 📝 How to Create a Paid Meeting

1. **Navigate** to Event Types → Create Event Type
2. **Fill** in basic details (title, description, duration, location)
3. **Scroll** to "Payment Settings" (green section)
4. **Toggle** "Paid Meeting" to ON
5. **Enter** your payment link (e.g., `https://paypal.me/yourname/50`)
6. **(Optional)** Customize payment instructions
7. **Click** "Create Event Type"

That's it! Your paid meeting is ready for bookings.

---

## 💡 Payment Link Examples

### PayPal
```
https://paypal.me/yourname/50
https://www.paypal.com/paypalme/yourname
```

### Stripe Payment Link
```
https://buy.stripe.com/your-unique-link
```

### Bank Transfer Page
```
https://yourwebsite.com/payment
```

### Custom Payment Portal
```
https://payment.yourcompany.com/consultation
```

---

## 👥 What Your Clients See

### On Booking Page
- Green payment notice at the top
- Your payment instructions
- "Complete Payment" button
- All normal booking details

### In Confirmation Email
- Standard booking confirmation
- Green payment section with:
  - Payment instructions
  - "Complete Payment" button
  - Deadline reminder

---

## 🎯 Best Practices

### Payment Instructions
Be clear and specific:
- ✅ "Payment of £50 required at least 2 hours before appointment"
- ✅ "Complete payment and email receipt to payments@yourcompany.com"
- ✅ "After payment, screenshot confirmation and reply to this email"

### Payment Links
Use direct, simple links:
- ✅ Short PayPal.me links
- ✅ Stripe payment links
- ✅ Direct bank transfer pages
- ❌ Avoid complex checkout flows

### Timing
- Request payment at least 1-2 hours before
- Gives you time to verify
- Prevents last-minute cancellations

---

## ✅ Verification Checklist

After creating your first paid meeting:

- [ ] Create test event type with paid toggle ON
- [ ] Add your payment link
- [ ] Save successfully
- [ ] Visit your public booking page
- [ ] See green payment banner
- [ ] Click "Complete Payment" button
- [ ] Make a test booking
- [ ] Check confirmation email
- [ ] Verify payment section appears in email

---

## 📧 Email Confirmation Example

Your clients will receive:

```
✅ Your booking is confirmed!

Event: 1-Hour Consultation
Date & Time: Monday, January 1, 2024, 10:00 AM
Location: Zoom

💳 Payment Required
Payments are to be made upfront at least 1 hour 
prior to appointment. Please email the payment 
confirmation once it is done.

[Complete Payment Button]

[Reschedule] [Cancel]
```

---

## 🆘 Troubleshooting

### Can't save paid meeting
- ✅ Make sure payment link is filled
- ✅ Check link starts with `https://`
- ✅ Verify migration was run

### Payment section not showing
- ✅ Refresh browser
- ✅ Check "Paid Meeting" toggle is ON
- ✅ Verify migration ran successfully

### Email missing payment info
- ✅ Check event type has `is_paid = true`
- ✅ Verify payment link and instructions are saved
- ✅ Try creating new booking

---

## 🎉 You're Ready!

Start accepting paid bookings with BookGrid:
1. Set up your payment platform
2. Create paid event types
3. Share your booking link
4. Collect payments before appointments

**Simple, professional, effective!** 💪
