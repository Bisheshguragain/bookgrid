# 🚀 Quick Start Guide - Testing Your Calendly Clone

This guide will help you quickly test the application to verify all fixes are working.

## Step 1: Start the Development Server

```bash
cd /Users/millionairemindset/Calendly
npm run dev
```

The application should start at `http://localhost:5173`

## Step 2: Verify Supabase Connection

When the app loads, you should see:
- ✅ A green "✓ Connected" badge in the top-right corner
- ✅ Console log: "✓ Supabase initialized successfully"
- ❌ NO 406 errors in the network tab
- ❌ NO infinite loop errors in console

## Step 3: Test Authentication

1. Click "Sign Up" or navigate to `http://localhost:5173/signup`
2. Create a new account with:
   - Email: test@example.com
   - Password: TestPassword123!
   - Full Name: Test User
3. You should be redirected to the dashboard

## Step 4: Test Dashboard

Once logged in, verify the dashboard shows:

### Stats Cards
- ✅ "Upcoming Events" - Shows count (initially 0)
- ✅ "Total Events" - Shows count (initially 0)
- ✅ "Event Types" - Shows count (initially 0)

### Quick Actions
Click each button and verify you're taken to the correct page:
- ✅ "Create Event Type" → `/app/event-types/new`
- ✅ "Set Availability" → `/app/availability`
- ✅ "View Analytics" → `/app/analytics`

### Real-time Features
- ✅ Dashboard loads without errors
- ✅ No infinite loops in console
- ✅ Stats update correctly

## Step 5: Test Real-time Bookings

### Option A: Using Supabase Dashboard
1. Open Supabase dashboard: https://app.supabase.com
2. Go to your project → Table Editor → `bookings`
3. Insert a test booking:
   ```sql
   INSERT INTO bookings (user_id, event_type_id, guest_name, guest_email, start_time, end_time, status)
   VALUES (
     'your-user-id',  -- Get from users_profile table
     'test-event-id', -- Get from event_types or create one
     'Test Guest',
     'guest@example.com',
     NOW() + INTERVAL '1 day',
     NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
     'confirmed'
   );
   ```
4. Watch the dashboard - you should see:
   - ✅ New booking notification badge appear
   - ✅ Stats update in real-time
   - ✅ Booking appears in "Recent Bookings" list

### Option B: Using the Application
1. Create an Event Type first:
   - Click "Create Event Type"
   - Fill in the form
   - Save
2. Copy your public booking link
3. Open in incognito window
4. Book a time slot
5. Check dashboard for real-time update

## Step 6: Test Real-time Reminders

1. Navigate to `/app/reminders`
2. You should see the reminders page
3. Check console for:
   - ✅ "Realtime reminders subscription status: SUBSCRIBED"
   - ❌ NO errors
   - ❌ NO infinite loops

## Step 7: Verify No Critical Errors

Open browser DevTools (F12) and check:

### Console Tab
✅ Should see:
- "Initializing Supabase with URL: ..."
- "✓ Supabase initialized successfully"
- "Realtime subscription status: SUBSCRIBED"

❌ Should NOT see:
- "Maximum call stack size exceeded"
- Any 406 errors
- "Real-time connection closed" (unless you actually lost connection)
- Infinite loop warnings

### Network Tab
✅ Check for:
- WebSocket connection established
- Successful API calls (200 status)

❌ Should NOT see:
- 406 (Not Acceptable) errors
- 500 (Server Error) responses
- Failed WebSocket connections

## Step 8: Test Multiple Browser Windows (Real-time Sync)

1. Open dashboard in Chrome
2. Open dashboard in Firefox (or another Chrome window)
3. Make a change in one window (e.g., create event type)
4. Verify the change appears in the other window automatically

## Common Issues & Solutions

### Issue: "Missing Supabase environment variables"
**Solution:** Check `.env.local` file exists and contains:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Issue: 406 Errors
**Solution:** This should be fixed! If you still see them:
1. Clear browser cache
2. Restart dev server
3. Check `src/lib/supabase.ts` has the custom fetch handler

### Issue: Infinite Loops
**Solution:** This should be fixed! If you still see them:
1. Check browser console for specific error
2. Verify you're on the latest code
3. Clear React state and refresh

### Issue: Real-time Not Working
**Solution:**
1. Check Supabase project has Realtime enabled
2. Verify RLS policies are correct
3. Check browser console for subscription status
4. Look for WebSocket connection in Network tab

## Success Criteria ✅

Your application is working correctly if:

- [x] No TypeScript errors
- [x] No 406 HTTP errors
- [x] No infinite loop errors
- [x] Dashboard loads successfully
- [x] Stats cards display correctly
- [x] Quick actions navigate properly
- [x] Real-time updates work
- [x] Authentication works
- [x] WebSocket connection established
- [x] Console shows successful connection

## Next Steps

Once all tests pass:

1. **Run Production Build**
   ```bash
   npm run build
   npm run preview
   ```

2. **Deploy to Production**
   - Set up production Supabase project
   - Configure environment variables
   - Deploy to Vercel/Netlify/your hosting

3. **Configure Email Service**
   - Set up Resend API key
   - Test email notifications

---

## 📞 Need Help?

If you encounter issues:

1. Check `FINAL_IMPLEMENTATION_SUMMARY.md` for detailed explanations
2. Review `CURRENT_STATUS.md` for known issues
3. Check browser console for specific errors
4. Verify all environment variables are set
5. Try clearing browser cache and restarting dev server

---

**Happy Testing! 🎉**
