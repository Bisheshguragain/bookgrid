# Getting Started with Calendly Clone

## Quick Setup (5 minutes)

### 1. Prerequisites
- Node.js 18+
- npm or yarn
- A Supabase account (free tier is fine)

### 2. Clone & Install
```bash
cd /Users/millionairemindset/Calendly
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Database Setup
1. Go to [Supabase Console](https://app.supabase.com)
2. Create a new project
3. Go to SQL Editor
4. Run the SQL from `src/lib/database-schema.sql`
5. (Optional) Run `src/lib/sample-data.sql` to add test data

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173`

## 📚 Project Structure

```
Calendly/
├── src/
│   ├── components/
│   │   ├── auth/              # Login, signup, password reset
│   │   ├── booking/           # Slot selection, booking form
│   │   ├── layout/            # Header, main layout wrapper
│   │   └── modals/            # Event details modal
│   ├── pages/
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── EventTypes.tsx      # Manage event types
│   │   ├── Availability.tsx    # Set working hours
│   │   ├── Analytics.tsx       # Charts and metrics
│   │   ├── Settings.tsx        # Profile settings
│   │   ├── Reminders.tsx       # Reminder configuration
│   │   ├── PublicBooking.tsx   # Public booking page
│   │   ├── Reschedule.tsx      # Reschedule flow
│   │   └── Cancel.tsx          # Cancellation flow
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── database.types.ts   # TypeScript types
│   │   └── database-schema.sql # SQL schema
│   ├── store/
│   │   └── authStore.ts        # Zustand auth store
│   ├── utils/
│   │   ├── cn.ts               # Class names utility
│   │   └── datetime.ts         # Date/time utilities
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind styles
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🔑 Key Routes

### Public Routes (No Authentication Required)
- `/login` - Login page
- `/signup` - Sign up page
- `/forgot-password` - Password reset
- `/u/:username` - Public booking page
- `/book/:eventTypeId` - Book event type
- `/reschedule/:bookingId/:token` - Reschedule appointment
- `/cancel/:bookingId/:token` - Cancel appointment

### Protected Routes (Authentication Required)
- `/dashboard` - Main dashboard
- `/event-types` - Event type management
- `/availability` - Availability configuration
- `/analytics` - Analytics dashboard
- `/settings` - Profile settings
- `/reminders` - Reminder management

## 🎯 Common Development Tasks

### Add a New Page
1. Create `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/layout/Header.tsx`

### Create a New Component
```typescript
// src/components/my-component/MyComponent.tsx
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <div className="p-4 bg-white rounded-lg">
      <h1 className="text-lg font-bold">{title}</h1>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

### Query Database
```typescript
import { supabase } from '../lib/supabase';

// Fetch data
const { data, error } = await supabase
  .from('event_types')
  .select('*')
  .eq('user_id', userId);

// Insert data
const { data, error } = await supabase
  .from('bookings')
  .insert({ user_id, event_type_id, guest_name, ... });

// Update data
const { error } = await supabase
  .from('event_types')
  .update({ title: 'New Title' })
  .eq('id', eventTypeId);
```

### Use Zustand Store
```typescript
import { useAuthStore } from '../store/authStore';

function MyComponent() {
  const { user, profile, isAuthenticated } = useAuthStore();
  
  return <div>{user?.email}</div>;
}
```

### Form with Validation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  email: z.string().email('Invalid email'),
});

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <p>{errors.title.message}</p>}
    </form>
  );
}
```

## 🎨 Styling with Tailwind CSS

Common utility classes:
```
// Layout
- flex, grid, w-full, h-screen, p-4, m-2

// Colors
- bg-white, text-gray-900, border-gray-300

// Responsive
- md:grid-cols-2 lg:grid-cols-3 sm:w-1/2

// Components (predefined)
- .btn-primary, .btn-secondary, .card, .input-field

// States
- hover:, focus:, disabled:, dark:
```

See `src/index.css` for component definitions.

## 🔐 Security Notes

- Row-Level Security (RLS) is active on all tables
- All database queries are user-scoped
- Tokens are used for reschedule/cancel links
- Environment variables are never exposed to client (use VITE_ prefix)
- Form validation happens on client and server

## 📱 Testing Locally

### Test Public Booking Flow
1. Create an event type in dashboard
2. Set availability for today
3. Visit `/u/your-username` or `/book/{eventTypeId}`
4. Book an appointment
5. View in dashboard

### Test Reschedule/Cancel
1. Copy reschedule_token from bookings table
2. Visit `/reschedule/{bookingId}/{token}`
3. Same for `/cancel/{bookingId}/{token}`

### Test with Sample Data
Run sample-data.sql to get test users:
- Email: `user1@example.com` / password: `password123`
- Email: `user2@example.com` / password: `password123`

## 🚀 Build for Production

```bash
# Build
npm run build

# Preview production build locally
npm run preview

# Lint check
npm run lint
```

## 📖 Documentation Files

- `README.md` - Project overview
- `FEATURE_UPDATES.md` - Implementation progress
- `IMPLEMENTATION_GUIDE.md` - Detailed feature guide
- `QUICKSTART.md` - Quick start guide

## 🆘 Troubleshooting

### Dependencies Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors in IDE
- Restart TypeScript server: Cmd+Shift+P → "TypeScript: Restart TS Server"
- Check `tsconfig.json` is properly configured

### Supabase Connection Issues
- Verify `.env` credentials
- Check Supabase project is active
- Ensure RLS policies are enabled

### Database Schema Issues
- Re-run `database-schema.sql` in Supabase SQL Editor
- Check all tables are created
- Verify RLS policies are present

## 💡 Tips & Best Practices

1. **Always add types** - Use TypeScript's strict mode
2. **Use React hooks** - Prefer hooks over class components
3. **Validate input** - Use Zod schemas for all forms
4. **Handle errors** - Always show user-friendly error messages
5. **Responsive first** - Design mobile first, then enhance
6. **Test regularly** - Test public flows frequently
7. **Security first** - Validate on client and server

## 📞 Need Help?

Check these files for more info:
- `src/lib/database-schema.sql` - Database structure
- `src/App.tsx` - Routing setup
- `src/store/authStore.ts` - State management
- Example components in `src/components/`

---

**Version**: 1.0.0  
**Last Updated**: December 27, 2025
