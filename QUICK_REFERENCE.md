# Quick Reference - Calendly Clone

## 🚀 Quick Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📂 File Quick Navigation

### Authentication
- Login: `src/components/auth/LoginForm.tsx`
- Signup: `src/components/auth/SignUpForm.tsx`
- Password Reset: `src/components/auth/ForgotPasswordForm.tsx`
- Auth Store: `src/store/authStore.ts`

### Public Booking
- Main Page: `src/pages/PublicBooking.tsx`
- Slot Picker: `src/components/booking/SlotSelection.tsx`
- Guest Form: `src/components/booking/BookingForm.tsx`

### User Dashboard
- Dashboard: `src/pages/Dashboard.tsx`
- Event Types: `src/pages/EventTypes.tsx`
- Availability: `src/pages/Availability.tsx`
- Analytics: `src/pages/Analytics.tsx`
- Settings: `src/pages/Settings.tsx`
- Reminders: `src/pages/Reminders.tsx`

### Booking Management
- Reschedule: `src/pages/Reschedule.tsx`
- Cancel: `src/pages/Cancel.tsx`
- Details Modal: `src/components/modals/EventDetailsModal.tsx`

### Core Libraries
- Supabase Client: `src/lib/supabase.ts`
- Database Types: `src/lib/database.types.ts`
- Database Schema: `src/lib/database-schema.sql`

### Utilities
- Classnames Helper: `src/utils/cn.ts`
- Date/Time Functions: `src/utils/datetime.ts`

## 🔀 Routing Map

```
/login                          → LoginForm
/signup                         → SignUpForm
/forgot-password                → ForgotPasswordForm
/u/:username                    → PublicBooking
/book/:eventTypeId              → PublicBooking
/reschedule/:bookingId/:token   → Reschedule
/cancel/:bookingId/:token       → Cancel

/dashboard                      → Dashboard (protected)
/event-types                    → EventTypes (protected)
/availability                   → Availability (protected)
/analytics                      → Analytics (protected)
/settings                       → Settings (protected)
/reminders                      → Reminders (protected)
```

## 💾 Database Tables

```sql
users_profile          -- User information
event_types            -- Event type definitions
availability_rules     -- Working hours
bookings               -- Scheduled appointments
reminders              -- Reminder configurations
```

## 🔑 Key Functions

### Authentication
```typescript
import { useAuthStore } from '../store/authStore';

const { user, profile, isAuthenticated, setUser, logout } = useAuthStore();
```

### Database Query
```typescript
import { supabase } from '../lib/supabase';

const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);
```

### Form Handling
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

### Date Formatting
```typescript
import { formatDateTime, formatTime } from '../utils/datetime';

formatDateTime(date, timezone);
formatTime(timeString, timezone);
```

### Class Names
```typescript
import { cn } from '../utils/cn';

className={cn('base-class', condition && 'conditional-class')}
```

## 🎨 Tailwind Quick Classes

```
Spacing:     p-4, m-2, gap-6, space-y-4
Colors:      bg-white, text-gray-900, border-gray-300
Responsive:  md:, lg:, sm:, xl:
Flexbox:     flex, justify-center, items-center, gap-4
Grid:        grid, grid-cols-3, gap-6
Sizing:      w-full, h-screen, max-w-2xl
Text:        font-bold, text-lg, truncate
States:      hover:, focus:, disabled:, dark:
```

## 📦 Common Component Patterns

### Controlled Form Input
```tsx
<input
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="input-field"
/>
```

### Button with Loading
```tsx
<button
  disabled={loading}
  className={cn('btn-primary', loading && 'opacity-50')}
>
  {loading ? 'Loading...' : 'Action'}
</button>
```

### Data Loading
```tsx
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  loadData().finally(() => setLoading(false));
}, []);

if (loading) return <LoadingSpinner />;
```

### Error Handling
```tsx
const [error, setError] = useState<string | null>(null);

try {
  await action();
} catch (err) {
  setError(err instanceof Error ? err.message : 'Error occurred');
}

{error && <ErrorMessage message={error} />}
```

## 🔒 Security Checklist

- ✅ All queries use user_id filtering
- ✅ RLS policies active on all tables
- ✅ Form validation with Zod
- ✅ Token-based access for public flows
- ✅ Environment variables use VITE_ prefix
- ✅ No sensitive data in localStorage
- ✅ HTTPS for production

## 📊 Common Queries

```typescript
// Fetch user bookings
const { data } = await supabase
  .from('bookings')
  .select('*, event_types(*)')
  .eq('user_id', userId)
  .eq('status', 'confirmed');

// Count bookings
const { count } = await supabase
  .from('bookings')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId);

// Get event types with count
const { data } = await supabase
  .from('event_types')
  .select('*, bookings(count)')
  .eq('user_id', userId);
```

## 🎯 Testing URLs

```
Dev Server:   http://localhost:5173
Public Page:  http://localhost:5173/u/test-user
Login:        http://localhost:5173/login
Dashboard:    http://localhost:5173/dashboard
Analytics:    http://localhost:5173/analytics
```

## 📱 Responsive Breakpoints

```
Mobile:   < 640px (sm)
Tablet:   640px - 1024px (md, lg)
Desktop:  > 1024px (xl, 2xl)
```

## 🔧 Environment Variables

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

## 📚 Import Paths (Absolute)

All imports use relative paths:
```typescript
import { Component } from '../components/...'
import { store } from '../store/...'
import { fn } from '../utils/...'
```

## 🐛 Debugging Tips

### Check Auth
```typescript
supabase.auth.getSession().then(({ data }) => console.log(data))
```

### Check Database
Visit Supabase console → SQL Editor → Select from tables

### Check API
Open DevTools → Network tab → Monitor Supabase requests

### React DevTools
Install React DevTools Chrome extension for component inspection

## 📖 Documentation Files

- `README.md` - Project overview
- `GETTING_STARTED.md` - Setup guide
- `FEATURE_UPDATES.md` - Implementation status
- `DEVELOPMENT_CHECKLIST.md` - Task list
- `PHASE2_SUMMARY.md` - Iteration summary
- `IMPLEMENTATION_GUIDE.md` - Feature details

## 🚀 Next Steps

1. Read `GETTING_STARTED.md` for setup
2. Run `npm install && npm run dev`
3. Create Supabase project
4. Run `database-schema.sql`
5. Add `.env` credentials
6. Visit `http://localhost:5173/login`

## 💡 Pro Tips

1. Use VS Code REST Client extension for API testing
2. Use Supabase SQL Editor for quick queries
3. Check browser console for auth errors
4. Use network tab for debugging API calls
5. Use React DevTools for state inspection

---

**Quick Reference Version**: 1.0  
**Last Updated**: December 27, 2025
