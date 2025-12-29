# 🔧 How to Test the Book a Meet Fix

## Step-by-Step Testing Guide

### ✅ Quick Test (2 minutes)

1. **Navigate to Book a Meet**
   ```
   Dashboard → Book a Meet tab
   ```

2. **Select Event Type**
   - Choose any active event type from dropdown
   - (If paid meeting, you'll see payment info - that's normal!)

3. **Fill in Prospect Details**
   ```
   Name: Test User
   Email: test@example.com
   ```

4. **Choose Date & Time**
   ```
   Date: Tomorrow (or use quick date button)
   Time: Any future time (or use quick time button)
   ```

5. **Optional Settings**
   - Toggle "Send Email Invitation" (ON or OFF)
   - Add notes if desired

6. **Submit Booking**
   - Click "📅 Book Meeting" button
   - Wait a moment...

### Expected Results:

#### ✅ Success (After Fix):
```
✓ Green success message appears at top
✓ "Meeting booked successfully with Test User!"
✓ Form resets (clears all fields)
✓ No error messages
✓ If email enabled: "Invitation email sent"
```

#### ❌ Failure (Before Fix):
```
✗ Red error message
✗ "Failed to book meeting"
✗ Form doesn't reset
✗ No booking created
```

---

## 🔍 Detailed Test Scenarios

### Scenario 1: Free Meeting
```
1. Select: Free event type (e.g., "15-min Call")
2. Prospect: John Doe, john@test.com
3. Date: Tomorrow
4. Time: 2:00 PM
5. Submit
6. ✅ Should succeed
```

### Scenario 2: Paid Meeting
```
1. Select: Paid event type (e.g., "Consultation")
2. See: Green payment banner appears
3. Prospect: Jane Smith, jane@test.com
4. Date: Next week
5. Time: 10:00 AM
6. Submit
7. ✅ Should succeed
8. ✅ Prospect receives email with payment details
```

### Scenario 3: With Email Invitation
```
1. Select: Any event type
2. Prospect: Bob Wilson, bob@test.com
3. Date: In 2 days
4. Time: 3:00 PM
5. Toggle: ✓ Send Email Invitation (ON)
6. Submit
7. ✅ Should succeed
8. ✅ Check console: "Invitation emails sent successfully"
```

### Scenario 4: Without Email Invitation
```
1. Select: Any event type
2. Prospect: Alice Brown, alice@test.com
3. Date: Tomorrow
4. Time: 11:00 AM
5. Toggle: ✗ Send Email Invitation (OFF)
6. Submit
7. ✅ Should succeed
8. ✅ Success message: "Meeting booked successfully" (no email mention)
```

---

## 🐛 Troubleshooting

### If It Still Fails:

#### Check 1: Browser Console
```
F12 → Console tab
Look for any error messages
```

**Common Issues:**
- Network error: Check internet connection
- Auth error: Make sure you're logged in
- Validation error: Check form fields are filled correctly

#### Check 2: Form Validation
Ensure:
- ✅ Event type selected
- ✅ Prospect name (min 2 characters)
- ✅ Valid email format
- ✅ Date is in the future
- ✅ Time is selected

#### Check 3: Database Connection
```
Check Supabase dashboard
Verify database is accessible
```

---

## 📊 Verification Checklist

After testing, confirm:

### Basic Functionality
- [ ] Can select event type
- [ ] Can enter prospect details
- [ ] Can choose date/time
- [ ] Can submit form
- [ ] Success message appears
- [ ] Form resets after success

### Email Integration
- [ ] Toggle works
- [ ] Emails sent when enabled
- [ ] No emails when disabled
- [ ] Console logs show success

### Payment Features (for paid events)
- [ ] Payment banner appears
- [ ] Payment details visible
- [ ] Booking still succeeds
- [ ] Email includes payment info

### Error Handling
- [ ] Validation errors show clearly
- [ ] Past dates rejected
- [ ] Invalid email rejected
- [ ] Network errors handled gracefully

---

## 🎯 Expected Behavior

### Timeline After Successful Booking:

```
1. Click "Book Meeting"
   ↓
2. Button shows "📅 Booking..."
   ↓
3. Database insert happens
   ↓
4. Reminders created (if configured)
   ↓
5. Emails sent (if enabled)
   ↓
6. Success message appears
   ↓
7. Form clears
   ↓
8. Ready for next booking ✅
```

### What Gets Created:

1. **Booking Record** in database
   - All details saved
   - Status: "confirmed"
   - Tokens generated (reschedule/cancel)

2. **Reminder Records** (if event type has reminders)
   - Scheduled at correct times
   - Status: "pending"

3. **Emails Sent** (if enabled)
   - Confirmation to prospect
   - Notification to host

---

## 💡 Pro Tips

### Quick Testing:
- Use "Quick Date" buttons (Tomorrow, In 2 Days, etc.)
- Use "Quick Time" buttons (9:00 AM, 2:00 PM, etc.)
- These speed up testing significantly!

### Test Data:
```
Use these for testing:
- test1@example.com
- test2@example.com  
- demo@test.com

Names:
- Test User
- Demo Prospect
- John Doe
```

### Check Dashboard:
After booking, go to Dashboard to see:
- New booking in "Upcoming Events"
- Correct date/time
- Guest details
- Status: Confirmed

---

## ✅ Success Indicators

You'll know the fix worked when:

1. **No Error Messages** ❌ → ✅
2. **Green Success Banner** ✅
3. **Form Resets** ✅
4. **Booking Appears in Dashboard** ✅
5. **Emails Sent** (if enabled) ✅

---

## 🎉 Final Confirmation

If you can successfully:
- ✅ Create a booking via Book a Meet
- ✅ See success message
- ✅ See booking in dashboard
- ✅ Receive email notifications

**Then the bug is FIXED!** 🎊

---

*Testing Guide - December 28, 2025*  
*All tests should pass after the `guest_time_zone` fix*
