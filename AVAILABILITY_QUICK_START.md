# 🚀 Availability Advanced Features - Quick Start Guide

## 📋 Copy Schedule to All Days

### What It Does
Copies your availability from one day to all other days of the week in one click.

### How to Use
1. Go to **Availability** page
2. Set up rules for any day (e.g., Monday 9 AM - 5 PM)
3. Click **"📋 Copy to All"** button on that day
4. Confirm the action
5. Done! All days now have the same schedule

### Example
```
Before:
Monday: 9:00 - 17:00
Tuesday: (empty)
Wednesday: (empty)
...

After clicking "Copy to All" on Monday:
Monday: 9:00 - 17:00
Tuesday: 9:00 - 17:00
Wednesday: 9:00 - 17:00
Thursday: 9:00 - 17:00
Friday: 9:00 - 17:00
Saturday: 9:00 - 17:00
Sunday: 9:00 - 17:00
```

### Tips
- ✅ You can still customize individual days after copying
- ✅ Copy overwrites existing rules on other days (be careful!)
- ✅ Source day rules remain unchanged
- ✅ Great for setting up consistent work weeks

---

## 🌴 Holiday Mode

### What It Does
Automatically disables all your event types during vacation or time off.

### How to Use

#### Before Your Vacation
1. Go to **Availability** page
2. Find the **"🌴 Holiday Mode"** section at the top
3. Select your **Holiday Start Date**
4. Select your **Holiday End Date**
5. Click the **toggle switch** to enable
6. Confirm the action
7. ✅ All event types are now deactivated!

#### After Your Vacation
1. Go to **Availability** page
2. Click the **toggle switch** to disable
3. Confirm the action
4. ✅ All event types are reactivated!

### Example Timeline
```
Dec 15: You enable Holiday Mode (Dec 20 - Dec 31)
        → All your event types become inactive immediately

Dec 20-31: You're on vacation
          → No one can book meetings with you

Jan 1: You return and disable Holiday Mode
       → All event types are reactivated
       → Bookings are open again
```

### What Happens
- **When Enabled**:
  - All active event types are automatically deactivated
  - System remembers which ones were active
  - Purple info banner shows active period
  - Date fields become read-only

- **When Disabled**:
  - Previously active event types are reactivated
  - Settings are cleared
  - You're back to normal operation

### Important Notes
- ⚠️ Holiday Mode disables ALL event types (no exceptions)
- ✅ You can change dates before enabling, but not during
- ✅ System remembers your settings even if you refresh
- ✅ Each user has their own holiday settings
- ✅ Expired holidays are auto-cleaned up

---

## 🎯 Common Workflows

### Scenario 1: Setting Up Weekly Hours
```
Goal: Work Monday-Friday, 9 AM - 5 PM

Steps:
1. Add rule for Monday: 09:00 - 17:00
2. Click "Copy to All" on Monday
3. Delete rules for Saturday
4. Delete rules for Sunday
5. Done! Mon-Fri working hours set
```

### Scenario 2: Different Weekday/Weekend Hours
```
Goal: Mon-Fri 9-5, Sat 10-2, Sun off

Steps:
1. Add Monday rule: 09:00 - 17:00
2. Copy to all days
3. Delete Sunday rules
4. Delete Saturday rules
5. Add Saturday rule: 10:00 - 14:00
6. Done!
```

### Scenario 3: Two-Week Vacation
```
Goal: No bookings Dec 20 - Jan 3

Steps:
1. Go to Holiday Mode section
2. Start: December 20, 2024
3. End: January 3, 2025
4. Toggle ON
5. Confirm
6. Enjoy vacation! 🏖️
7. Return Jan 4, toggle OFF
```

### Scenario 4: Quick Schedule Update
```
Goal: Change all days from 9-5 to 10-6

Steps:
1. Delete rules for Monday
2. Add new Monday rule: 10:00 - 18:00
3. Click "Copy to All" on Monday
4. Adjust individual days if needed
```

---

## 💡 Pro Tips

### Copy Schedule
- 📌 Always check the confirmation dialog before accepting
- 📌 Copy from your most common schedule first
- 📌 Use copy as a starting point, then customize
- 📌 Remember: copy replaces existing rules on other days

### Holiday Mode
- 📌 Set up holiday mode a few days before your vacation
- 📌 Double-check the dates before enabling
- 📌 Don't forget to disable it when you return!
- 📌 The system won't auto-disable, even if period expires
- 📌 You can see which event types will be affected before enabling

---

## ❓ FAQ

### Q: What happens if I copy from a day with no rules?
**A:** You'll see an alert: "No availability rules set for this day!"

### Q: Can I undo a copy operation?
**A:** No automatic undo, but you can manually delete rules or re-add old ones.

### Q: Does Holiday Mode affect existing bookings?
**A:** No, existing bookings remain. It only prevents NEW bookings during the period.

### Q: Can I have multiple holiday periods?
**A:** Currently, only one period at a time. Disable the first to set a new one.

### Q: What if my holiday dates change?
**A:** Disable holiday mode, update the dates, then re-enable it.

### Q: Does copy include buffer times?
**A:** Yes! All rule properties are copied (times, buffers, etc.)

### Q: Can I copy to specific days only?
**A:** Not yet - it's all or nothing. But you can copy to all, then delete from specific days.

### Q: Is holiday mode data stored in the database?
**A:** Settings are stored locally in your browser. Event type changes are in the database.

---

## 🆘 Troubleshooting

### Copy Schedule Not Working
1. ✅ Check you have rules on the source day
2. ✅ Confirm the operation in the dialog
3. ✅ Wait for success message
4. ✅ Refresh page if calendar doesn't update

### Holiday Mode Toggle Not Working
1. ✅ Ensure both dates are selected
2. ✅ Check end date is after start date
3. ✅ Look for error messages
4. ✅ Try disabling and re-enabling

### Lost Holiday Mode Settings
1. ✅ Check if holiday period expired (auto-cleaned)
2. ✅ Verify you're using the same browser
3. ✅ Clear browser cache may reset local settings
4. ✅ Event types remember their activation state

---

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify your internet connection
3. Try refreshing the page
4. Check the main documentation: `AVAILABILITY_ADVANCED_FEATURES.md`

---

**Happy Scheduling! 🎉**

These features are designed to make your life easier. Set up your availability once, enjoy your vacation worry-free, and let the system handle the rest!
