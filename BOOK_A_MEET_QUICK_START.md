# 📅 Book a Meet - Quick Start Guide

## What is Book a Meet?

**Book a Meet** is a feature that allows you to **proactively schedule meetings with prospects** and send them email invitations. Unlike the public booking page where prospects come to you, this feature lets you take control and book meetings directly.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Navigate to Book a Meet
Click **"Book a Meet"** in the main navigation bar (between "Event Types" and "Calendar")

### Step 2: Fill Out the Form
1. **Select Event Type**: Choose which type of meeting you want to book
2. **Enter Prospect Info**: Add their name and email
3. **Pick Date & Time**: Use quick buttons or manual selection
4. **Add Notes** (optional): Internal notes for yourself
5. **Toggle Email**: Choose whether to send invitation email

### Step 3: Submit
Click **"📅 Book Meeting"** and you're done! The prospect will receive an invitation (if toggle is on).

---

## 📋 Form Fields Guide

### Required Fields (marked with *)

| Field | Description | Example |
|-------|-------------|---------|
| **Event Type** | Type of meeting to schedule | "30 Minute Meeting" |
| **Prospect Name** | Full name of the person | "John Doe" |
| **Prospect Email** | Valid email address | "john@company.com" |
| **Meeting Date** | Date for the meeting | "2025-02-15" |
| **Meeting Time** | Time for the meeting | "10:00 AM" |

### Optional Fields

| Field | Description |
|-------|-------------|
| **Notes** | Internal notes (prospect won't see) |
| **Send Invitation** | Toggle to send email (default: ON) |

---

## ⚡ Quick Selection Features

### Quick Date Buttons
Click these for instant date selection:
- **Tomorrow** - Schedules for the next day
- **In 2 Days** - Day after tomorrow
- **In 3 Days** - Three days from now
- **Next Week** - One week from today

### Quick Time Buttons
Common business hours for easy selection:
- **9:00 AM** - Early morning
- **10:00 AM** - Mid-morning
- **11:00 AM** - Late morning
- **2:00 PM** - Early afternoon
- **3:00 PM** - Mid-afternoon
- **4:00 PM** - Late afternoon

---

## ✅ What Happens When You Book?

1. **Booking Created**: Meeting is saved in your database
2. **Reminders Set**: Automatic reminders created (based on event type)
3. **Email Sent** (if toggle on): Prospect receives invitation with:
   - Meeting details (date, time, duration)
   - Location information
   - Reschedule link
   - Cancel link
4. **Success Message**: You see confirmation with link to dashboard
5. **Form Reset**: Form clears for next booking

---

## 🎨 UI Guide

### Color Coding
- **Purple Sections** = Event type and prospect info
- **Blue Sections** = Information/help text
- **Green Sections** = Email invitation toggle
- **Red Messages** = Errors/validation issues
- **Green Messages** = Success confirmations

### Visual Indicators
- 🔴 Red asterisk (*) = Required field
- 📧 Email icon = Email invitation setting
- 📋 Clipboard icon = Meeting preview
- 📅 Calendar icon = Date/time selection
- 👤 Person icon = Prospect information

---

## 🚨 Common Errors & Solutions

### "Please select an event type"
**Problem**: No event type selected  
**Solution**: Choose an event type from dropdown. If empty, create one first.

### "Please enter a valid email address"
**Problem**: Email format is incorrect  
**Solution**: Ensure email has @ and domain (e.g., user@domain.com)

### "Meeting time cannot be in the past"
**Problem**: Selected date/time has already passed  
**Solution**: Choose a future date and time

### "Failed to load event types"
**Problem**: No active event types available  
**Solution**: Go to Event Types → Create New Event Type

---

## 💡 Pro Tips

### 1. Use Quick Buttons for Speed
Instead of clicking date picker, use quick date buttons for common scenarios.

### 2. Add Context in Notes
Use the notes field to remind yourself why you're meeting this person:
- "Follow-up from conference"
- "Discussed product demo"
- "Referral from Sarah"

### 3. Preview Before Submitting
Check the meeting preview at the bottom to verify all details before booking.

### 4. Create Common Event Types
Set up event types for your most common meetings:
- "15 Min Quick Call"
- "30 Min Demo"
- "60 Min Consultation"

### 5. Toggle Email Wisely
- **ON** = Prospect gets invitation (recommended)
- **OFF** = You book it, send manual invite later

---

## 📱 Mobile Usage

### Touch-Friendly Design
- All buttons are large enough for easy tapping
- Form fields have adequate spacing
- Quick buttons stack vertically on mobile

### Mobile Tips
- Use landscape mode for easier typing
- Quick buttons are especially useful on mobile
- Autocomplete suggestions help on mobile keyboards

---

## 🔒 Security & Privacy

### What Prospects See
- Your name (from profile)
- Meeting details (date, time, duration, location)
- Event type title and description
- Reschedule/cancel links

### What Prospects DON'T See
- Your internal notes
- Other bookings on your calendar
- Your availability rules
- Your email address (unless you choose to share)

### Data Security
- All data encrypted in transit (HTTPS)
- Secure tokens for reschedule/cancel links
- No data sold to third parties
- Compliant with data protection regulations

---

## 🔄 After Booking

### What You Can Do
1. **View in Dashboard**: See all your bookings
2. **View in Calendar**: See monthly overview
3. **Edit Notes**: Update your internal notes
4. **Cancel Meeting**: Cancel if needed
5. **Reschedule**: Change date/time
6. **Contact Prospect**: You have their email

### What Prospect Can Do
1. **Accept Invitation**: Add to their calendar
2. **Reschedule**: Use link in email
3. **Cancel**: Use link in email
4. **Ask Questions**: Reply to invitation email

---

## 📧 Email Integration Status

### Current Status (Development)
- ✅ Form works perfectly
- ✅ Booking saved to database
- ✅ Reminders created
- ⏳ Email **logged to console** (not sent yet)

### Production Status (After Email Setup)
- ✅ Email sent via SendGrid/Mailgun
- ✅ Calendar invite (.ics file) attached
- ✅ Professional email template
- ✅ Automatic follow-up reminders

---

## 🆘 Need Help?

### Troubleshooting Steps
1. Check if you have active event types
2. Verify prospect email format
3. Ensure date/time is in future
4. Check browser console for errors
5. Refresh the page and try again

### Getting Support
- Review [BOOK_A_MEET_FEATURE.md](./BOOK_A_MEET_FEATURE.md) for detailed guide
- Check [FINAL_PROJECT_STATUS.md](./FINAL_PROJECT_STATUS.md) for project status
- Contact support team

---

## 🎓 Tutorial Example

### Scenario: Booking a demo with a prospect

1. **Navigate**: Click "Book a Meet" in navbar
2. **Event Type**: Select "Product Demo (30 min)"
3. **Prospect**: 
   - Name: "Sarah Johnson"
   - Email: "sarah@techcorp.com"
4. **Date**: Click "Tomorrow" quick button
5. **Time**: Click "2:00 PM" quick button
6. **Notes**: "Met at TechConf 2025 - interested in Enterprise plan"
7. **Email**: Leave toggle ON
8. **Submit**: Click "📅 Book Meeting"
9. **Success**: See confirmation, Sarah receives email
10. **Done**: Navigate to dashboard to see booking

---

## 🌟 Best Practices

### Do's ✅
- ✅ Double-check prospect email
- ✅ Add meaningful notes for context
- ✅ Use quick buttons for efficiency
- ✅ Preview before submitting
- ✅ Follow up if no response

### Don'ts ❌
- ❌ Don't book in the past
- ❌ Don't use fake emails for testing
- ❌ Don't forget to create event types first
- ❌ Don't spam prospects with multiple bookings
- ❌ Don't share reschedule tokens publicly

---

## 📊 Use Cases

### Perfect For:
1. **Sales Teams**: Schedule demos with leads
2. **Customer Success**: Book onboarding calls
3. **Consultants**: Schedule client meetings
4. **Recruiters**: Book candidate interviews
5. **Freelancers**: Schedule project kickoffs
6. **Coaches**: Book coaching sessions

### Not Ideal For:
1. Group events (use event types for 1-on-1)
2. Recurring meetings (book once, set up recurrence separately)
3. Instant meetings (use for future scheduling)

---

## 🔜 Coming Soon

Features planned for future releases:
- 📨 Bulk booking (multiple meetings at once)
- 📧 Custom email templates
- 🔁 Recurring meeting series
- 📞 SMS notifications to prospects
- 🌍 Multi-timezone support
- 📊 Prospect engagement tracking
- 🤖 AI-powered time suggestions

---

**Quick Reference Card**

```
BOOK A MEET - CHEAT SHEET

Required:
☐ Event Type
☐ Prospect Name
☐ Prospect Email
☐ Meeting Date
☐ Meeting Time

Optional:
☐ Notes
☐ Send Email (default ON)

Quick Buttons:
• Tomorrow / In 2 Days / In 3 Days / Next Week
• 9 AM / 10 AM / 11 AM / 2 PM / 3 PM / 4 PM

After Booking:
→ Booking created in database
→ Reminders set automatically
→ Email sent (if toggled on)
→ View in Dashboard/Calendar
```

---

**Navigation:** Dashboard → Book a Meet  
**Access Level:** All authenticated users  
**Required Setup:** At least one active event type  
**Estimated Time:** ~1 minute per booking  

---

*For detailed technical documentation, see [BOOK_A_MEET_FEATURE.md](./BOOK_A_MEET_FEATURE.md)*
