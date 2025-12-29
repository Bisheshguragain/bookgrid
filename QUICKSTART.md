# Quick Start Guide - Calendly Clone

## 5-Minute Setup

### 1. Install & Configure (1 minute)
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 2. Supabase Setup (2 minutes)
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your API credentials from Project Settings → API
3. Paste them into `.env`:
   ```
   VITE_SUPABASE_URL=https://[your-project].supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 3. Database Setup (2 minutes)
1. Go to Supabase SQL Editor
2. Create a new query
3. Copy-paste the entire contents of `src/lib/database-schema.sql`
4. Click "Run" to execute

### 4. Start Development (1 minute)
```bash
npm run dev
```

Visit `http://localhost:5173`

## Test Accounts

If you ran the sample data script, use these test accounts:

**Account 1:**
- Email: `john.doe@example.com`
- Password: (set your own during signup)
- Username: `johndoe`

**Account 2:**
- Email: `jane.smith@example.com`
- Username: `janesmith`

**Account 3:**
- Email: `mike.wilson@example.com`
- Username: `mikewilson`

## Key Pages to Explore

1. **Login** - `/login`
2. **Sign Up** - `/signup`
3. **Dashboard** - `/dashboard` (shows overview and upcoming bookings)
4. **Event Types** - `/event-types` (create and manage event types)
5. **Availability** - `/availability` (set working hours)
6. **Settings** - `/settings` (profile configuration)
7. **Analytics** - `/analytics` (view booking metrics)
8. **Reminders** - `/reminders` (manage reminders)

## Next Steps After Setup

### Recommended Enhancements

1. **Add Email Reminders**
   - Install SendGrid: `npm install @sendgrid/mail`
   - Create Supabase Edge Function
   - Set up reminder scheduler

2. **Create Public Booking Pages**
   - Add `/u/:username` route
   - Implement time slot generation
   - Add booking form with guest details

3. **Add Calendar Integration**
   - Google Calendar API
   - Outlook Calendar API
   - iCal feed generation

4. **Enhance Analytics**
   - Add Recharts visualizations
   - Implement CSV export
   - Add trend analysis

## Common Tasks

### Create Your First Event Type
1. Sign in to dashboard
2. Click "Event Types" in navigation
3. Click "Create Event Type"
4. Fill in title, description, duration
5. Choose location type (Zoom/Meet/Phone/Custom)
6. Save and share the booking link

### Set Your Availability
1. Go to "Availability" page
2. Click "Add Availability"
3. Select day of week
4. Set start and end times
5. Add buffer times if needed (before/after meetings)
6. Save

### View Your Bookings
1. Go to Dashboard
2. See upcoming events in the summary
3. Click "View all" to see full list
4. Manage, reschedule, or cancel bookings

## Troubleshooting

### "Cannot find Supabase"
- Check `.env` file has correct credentials
- Make sure you ran `npm install`
- Restart dev server with `npm run dev`

### Blank dashboard after login
- Check RLS policies in Supabase console
- Make sure sample data was inserted correctly
- Check browser console for errors

### Form validation errors
- Email must be valid format
- Password must be at least 8 characters
- Passwords must match on signup

### Time zone issues
- Make sure to set your time zone in Settings
- Availability rules use the time zone from your profile
- Visitors should select their time zone on booking page

## Development Tips

### Enable TypeScript Strict Mode
Already enabled! All files use strict TypeScript.

### Add Environment Variables
1. Add to `.env.example`
2. Add type definition in `.env.d.ts` if needed
3. Use `import.meta.env.VITE_*` to access

### Database Changes
1. Update schema in `database-schema.sql`
2. Update types in `database.types.ts`
3. Update RLS policies for new tables

### Add New Pages
1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Add navigation link in `Header.tsx`

## File Structure Explanation

```
Calendly/
├── src/
│   ├── components/      ← UI components (forms, layout)
│   ├── lib/            ← Configuration and schemas
│   ├── pages/          ← Full page components
│   ├── store/          ← Zustand state management
│   ├── utils/          ← Helper functions
│   ├── App.tsx         ← Main routing
│   ├── main.tsx        ← Entry point
│   └── index.css       ← Global styles (Tailwind)
├── .env.example        ← Environment template
├── package.json        ← Dependencies
└── vite.config.ts      ← Vite configuration
```

## Performance Tips

### For Fast Development
- Use `npm run dev` (hot reload enabled)
- Keep browser DevTools closed for faster refresh
- Use smaller date ranges in Analytics

### For Production
- Run `npm run build`
- Check bundle size: `npm run build -- --report`
- Enable compression on hosting

## Security Reminders

✅ Never commit `.env` file
✅ Use environment variables for sensitive data
✅ Keep Supabase keys private
✅ Enable HTTPS in production
✅ Review RLS policies regularly

## Getting Help

- Check `IMPLEMENTATION_GUIDE.md` for detailed docs
- Review code comments in key files
- Check TypeScript types for function signatures
- Use browser DevTools to debug

## What's Ready to Use

- ✅ User authentication (sign up, login, password reset)
- ✅ Profile management with time zone support
- ✅ Event type creation and management
- ✅ Availability rule configuration
- ✅ Booking dashboard with filters
- ✅ Analytics metrics dashboard
- ✅ Reminder management system
- ✅ Database with RLS security
- ✅ Type-safe data layer

## What Needs Implementation

- ⏳ Email reminder sending
- ⏳ Public booking pages (/u/:username)
- ⏳ Time slot booking flow
- ⏳ Calendar integrations
- ⏳ Chart visualizations
- ⏳ CSV export functionality

---

**Ready to extend? Start with email reminders or public booking pages!**
