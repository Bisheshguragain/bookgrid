# Phase 3 Quick Action Plan

**Status**: Email Integration ✅ Complete | Real-time Updates 🚀 70% Complete  
**Time**: 2-3 hours to complete Phase 3.2  
**Priority**: HIGH - Real-time dashboard updates  

---

## What's Done ✅

1. **Email Service** (`src/services/emailService.ts`)
   - All email types implemented
   - Professional HTML templates
   - Integrated with booking flows
   - Dev and production modes

2. **Real-time Hook** (`src/hooks/useRealtimeBookings.ts`)
   - Subscription to bookings table
   - INSERT/UPDATE/DELETE handling
   - New booking count tracking
   - Error handling

3. **Status Component** (`src/components/layout/RealtimeStatus.tsx`)
   - Connection monitoring
   - Health checks
   - Visual feedback

---

## What's Left 🚀 (2-3 Hours)

### Task 1: Update Dashboard (1 hour)

**File**: `src/pages/Dashboard.tsx`

**Steps**:

1. Add import at top:
```typescript
import { useRealtimeBookings } from '../hooks/useRealtimeBookings';
```

2. Get user from auth store (already exists)

3. Inside component, add:
```typescript
const { newBookingCount, clearNewBookingNotification } = useRealtimeBookings({
  userId: user?.id || '',
  enabled: !!user?.id,
});
```

4. Add notification badge after header (replace upcoming events section):
```typescript
{newBookingCount > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
        {newBookingCount}
      </div>
      <p className="text-blue-900 font-medium">
        {newBookingCount} new booking{newBookingCount !== 1 ? 's' : ''}
      </p>
    </div>
    <button
      onClick={clearNewBookingNotification}
      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
    >
      Dismiss
    </button>
  </div>
)}
```

**Expected Result**: 
- Blue notification badge appears when bookings come in
- Shows count of new bookings
- Can be dismissed

---

### Task 2: Update Header (30 minutes)

**File**: `src/components/layout/Header.tsx`

**Steps**:

1. Add import:
```typescript
import { useRealtimeBookings } from '../../hooks/useRealtimeBookings';
import { useAuthStore } from '../../store/authStore';
```

2. Inside component, add:
```typescript
const { user } = useAuthStore();
const { newBookingCount } = useRealtimeBookings({
  userId: user?.id || '',
  enabled: !!user?.id,
});
```

3. Add bell icon with badge to header (usually next to user menu):
```typescript
{newBookingCount > 0 && (
  <div className="relative">
    <button className="p-2 text-gray-600 hover:text-gray-900">
      {/* Bell icon SVG */}
    </button>
    <div className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
      {newBookingCount}
    </div>
  </div>
)}
```

**Expected Result**:
- Red badge appears in header
- Shows number of new bookings
- Disappears when dismissed in Dashboard

---

### Task 3: Update Layout (30 minutes)

**File**: `src/components/layout/Layout.tsx`

**Steps**:

1. Add import at top:
```typescript
import { RealtimeStatus } from './RealtimeStatus';
```

2. Add component to layout (near top, after navigation):
```typescript
<RealtimeStatus />

{/* Rest of layout */}
```

**Expected Result**:
- Connection status shows only when disconnected
- Auto-reconnects when connection returns
- Shows "Reconnecting..." or error state as needed

---

### Task 4: Test (30 minutes)

**Manual Testing**:

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Test Real-time Sync**
   - Open http://localhost:5173/dashboard in TWO browser tabs
   - In tab 1, create a booking: go to `/u/test-user`
   - In tab 2, watch the notification badge appear instantly
   - Click "Dismiss" in tab 2
   - Badge disappears

3. **Test Header Badge**
   - Create another booking
   - Both tabs show red badge in header
   - Count matches

4. **Test Connection Status**
   - Open DevTools Network tab
   - Set throttling to "Offline"
   - See "You appear to be offline" message
   - Resume network
   - Message disappears, reconnects

5. **Test Error Handling**
   - Check console for real-time logs
   - Verify no red errors
   - All features work

---

## Code References

### Email Service Functions
Already integrated into:
- `PublicBooking.tsx` - Creates bookings + sends emails
- `Reschedule.tsx` - Reschedules + sends confirmations
- `Cancel.tsx` - Cancellations + sends notifications

### Real-time Hook
Example usage:
```typescript
const { bookings, newBookingCount } = useRealtimeBookings({
  userId: 'user-123',
  enabled: true,
  limit: 50,
});
```

Returns:
- `bookings` - Array of booking objects
- `loading` - Loading state
- `error` - Error message if any
- `newBookingCount` - Number of new bookings
- `clearNewBookingNotification()` - Reset count
- `refetch()` - Manual refresh

### Status Component
Simple import and use:
```typescript
import { RealtimeStatus } from '../components/layout/RealtimeStatus';

// In JSX
<RealtimeStatus />
```

---

## Files to Modify

```
src/
├── pages/Dashboard.tsx          ← Add hook + badge
├── components/layout/
│   ├── Header.tsx               ← Add badge
│   └── Layout.tsx               ← Add RealtimeStatus
```

## Files Already Complete

```
✅ src/services/emailService.ts
✅ src/hooks/useRealtimeBookings.ts
✅ src/components/layout/RealtimeStatus.tsx
✅ src/pages/PublicBooking.tsx (already integrated)
✅ src/pages/Reschedule.tsx (already integrated)
✅ src/pages/Cancel.tsx (already integrated)
```

---

## Verification Checklist

After completing all 4 tasks, verify:

- [ ] Dashboard compiles without errors
- [ ] Header compiles without errors  
- [ ] Layout compiles without errors
- [ ] App starts with `npm run dev`
- [ ] No red errors in console
- [ ] Real-time badge appears on new bookings
- [ ] Badge count is correct
- [ ] Dismiss button works
- [ ] Header badge works
- [ ] Connection status works
- [ ] Can switch between pages
- [ ] Can create bookings
- [ ] Email logs appear in console

---

## Estimated Time Breakdown

| Task | Time |
|------|------|
| Task 1: Dashboard | 1 hour |
| Task 2: Header | 30 min |
| Task 3: Layout | 30 min |
| Task 4: Testing | 30 min |
| **Total** | **2.5 hours** |

---

## Troubleshooting

### Badge not appearing?
- Check console for errors
- Verify `useAuthStore()` returns user ID
- Check realtime hook is enabled
- Try refreshing page

### Real-time not working?
- Check Supabase connection
- Verify Realtime is enabled in Supabase
- Check browser console for WebSocket errors
- Try reloading page

### Header badge not syncing?
- Make sure both components use same hook
- Check they reference same userId
- Verify clearNewBookingNotification works

### Connection status always shows error?
- Check internet connection
- Try hard refresh (Cmd+Shift+R)
- Check browser console
- Verify Supabase is running

---

## After Phase 3.2 Complete

Once real-time updates are done:

1. **Phase 3.3 - Reminders System** (1-2 days)
   - Enhance Reminders.tsx UI
   - Add job scheduler
   - Send reminder emails

2. **Phase 4 - Testing** (2-3 days)
   - Write unit tests
   - Write E2E tests
   - Performance testing

3. **Phase 5 - Deployment** (1-2 days)
   - Docker setup
   - CI/CD pipeline
   - Deploy to Vercel

---

## Quick Copy-Paste Code

### Dashboard Badge
```typescript
{newBookingCount > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
        {newBookingCount}
      </div>
      <p className="text-blue-900 font-medium">
        {newBookingCount} new booking{newBookingCount !== 1 ? 's' : ''}
      </p>
    </div>
    <button
      onClick={clearNewBookingNotification}
      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
    >
      Dismiss
    </button>
  </div>
)}
```

### Header Bell
```typescript
{newBookingCount > 0 && (
  <div className="relative ml-4">
    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    <div className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
      {newBookingCount}
    </div>
  </div>
)}
```

---

**Start with Task 1: Dashboard update (takes ~1 hour)**  
**Goal: Have real-time dashboard working in 2-3 hours**
