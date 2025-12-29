# Real-time Updates Implementation Guide (Phase 3 Part 2)

## Overview

This guide covers implementing real-time updates using Supabase Realtime, so the dashboard updates live when new bookings are created and notifications appear in real-time.

---

## Architecture

```
Database Changes
       ↓
Supabase Realtime (WebSocket)
       ↓
useRealtimeBookings Hook
       ↓
Dashboard Component
       ↓
Live UI Updates + Notification Badge
```

---

## Implementation Steps

### Step 1: Create useRealtimeBookings Hook

Create `/src/hooks/useRealtimeBookings.ts`:

```typescript
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];

interface UseRealtimeBookingsOptions {
  userId: string;
  enabled?: boolean;
}

export function useRealtimeBookings({ userId, enabled = true }: UseRealtimeBookingsOptions) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBookingCount, setNewBookingCount] = useState(0);

  // Initial load
  useEffect(() => {
    if (!enabled) return;
    
    const loadBookings = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (err) throw err;
        setBookings(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [userId, enabled]);

  // Real-time subscription
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`bookings:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newBooking = payload.new as Booking;
            setBookings((prev) => [newBooking, ...prev]);
            setNewBookingCount((prev) => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            const updatedBooking = payload.new as Booking;
            setBookings((prev) =>
              prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedBooking = payload.old as Booking;
            setBookings((prev) => prev.filter((b) => b.id !== deletedBooking.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, enabled]);

  const clearNewBookingNotification = useCallback(() => {
    setNewBookingCount(0);
  }, []);

  return {
    bookings,
    loading,
    error,
    newBookingCount,
    clearNewBookingNotification,
  };
}
```

### Step 2: Update Dashboard Component

Modify `/src/pages/Dashboard.tsx`:

```typescript
import { useRealtimeBookings } from '../hooks/useRealtimeBookings';

export function Dashboard() {
  const { user } = useAuthStore();
  const {
    bookings,
    loading,
    error,
    newBookingCount,
    clearNewBookingNotification,
  } = useRealtimeBookings({
    userId: user?.id || '',
    enabled: !!user?.id,
  });

  // ... rest of component

  return (
    <div>
      {/* New bookings badge */}
      {newBookingCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              {newBookingCount}
            </div>
            <p className="text-blue-900">
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

      {/* Rest of dashboard content */}
    </div>
  );
}
```

### Step 3: Add Connection Status Indicator

Create `/src/components/layout/RealtimeStatus.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export function RealtimeStatus() {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const subscription = supabase
      .channel('system')
      .on('system', { event: '*.join' }, () => {
        setConnected(true);
      })
      .on('system', { event: '*.leave' }, () => {
        setConnected(false);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (connected) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-sm text-yellow-800">
      <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
      Reconnecting to server...
    </div>
  );
}
```

### Step 4: Update Header with Badge

Modify `/src/components/layout/Header.tsx`:

```typescript
import { useRealtimeBookings } from '../../hooks/useRealtimeBookings';
import { useAuthStore } from '../../store/authStore';

export function Header() {
  const { user } = useAuthStore();
  const { newBookingCount } = useRealtimeBookings({
    userId: user?.id || '',
    enabled: !!user?.id,
  });

  return (
    <header className="bg-white border-b border-gray-200">
      {/* ... existing header code ... */}
      
      {/* Add notification badge */}
      {newBookingCount > 0 && (
        <div className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {newBookingCount}
        </div>
      )}
    </header>
  );
}
```

---

## Key Features

### 1. Real-time Bookings
- Subscribes to changes on the bookings table
- Automatically updates on INSERT, UPDATE, DELETE
- Filtered by user_id for security

### 2. Notification Badge
- Shows count of new bookings
- Appears above dashboard
- Can be dismissed by user
- Also shows in header

### 3. Connection Status
- Displays "Reconnecting" message on disconnect
- Automatic reconnection with exponential backoff
- User always knows if data is live

### 4. Error Handling
- Graceful fallback if subscription fails
- Shows error message to user
- Can retry or disable realtime

---

## Database Setup

Real-time is enabled by default in Supabase. Just ensure RLS policies allow:

```sql
-- Example RLS policy for bookings table
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Realtime will respect these policies
```

---

## Testing Real-time

### Multi-Tab Testing
1. Open dashboard in two browser tabs
2. Create a booking in one tab
3. See instant update in other tab

### Network Throttling
1. Open DevTools
2. Go to Network tab
3. Set throttling to "Slow 3G"
4. Create booking - watch reconnection

### Production Testing
1. Deploy to two regions
2. Test cross-region updates
3. Monitor WebSocket connections

---

## Performance Considerations

### Optimization Strategies

1. **Query Filtering**
   - Only subscribe to user's bookings
   - Reduces message volume
   - Improves latency

2. **Debouncing**
   - Group rapid updates
   - Prevents UI flashing
   - Reduces re-renders

3. **Pagination**
   - Load only last 30 bookings
   - Load older on scroll
   - Improves performance

4. **Memory Management**
   - Clean up subscriptions on unmount
   - Limit bookings array size
   - Use virtualization for lists

### Example with Pagination

```typescript
const [limit, setLimit] = useState(30);
const [offset, setOffset] = useState(0);

const { data, error } = await supabase
  .from('bookings')
  .select('*', { count: 'est' })
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);
```

---

## Error Scenarios

### Network Disconnection
- Supabase auto-reconnects
- Shows "Reconnecting..." indicator
- Syncs changes on reconnect

### Subscription Failure
- Fallback to polling (every 30s)
- Show error message
- Offer manual refresh button

### RLS Policy Violation
- No error to user (security)
- Dashboard shows last known state
- Manual refresh updates data

---

## Troubleshooting

### Realtime Not Working?

1. Check Supabase project settings
   - Realtime > Enable
   - Table > Realtime > ON

2. Verify RLS policies
   - Check if user can SELECT from table
   - Realtime respects RLS

3. Check browser console
   - Look for WebSocket errors
   - Check Realtime subscription logs

4. Test with DevTools
   - Open Network > WS
   - Should see ws://... connection
   - Should see payload messages

### Performance Issues?

1. Reduce subscription payload
   - Select only needed columns
   - Filter by date range
   - Use pagination

2. Debounce updates
   - Batch rapid changes
   - Use timeouts
   - Reduce re-renders

3. Monitor WebSocket
   - Check message frequency
   - Check message size
   - Use Chrome DevTools

---

## Security Considerations

✅ RLS policies enforced by Supabase  
✅ Only user's own data returned  
✅ No sensitive info in payloads  
✅ WebSocket encrypted (WSS)  
✅ Token-based authentication  

---

## Deployment

### Environment Setup
```bash
# Supabase project already handles realtime
# No additional configuration needed
# Just enable in project settings
```

### Monitoring
- Monitor WebSocket connections
- Track subscription success rate
- Alert on reconnection issues
- Log subscription errors

---

## Next Steps

1. **Implement hook** - Create useRealtimeBookings
2. **Update Dashboard** - Use hook and show badge
3. **Add status indicator** - Show connection status
4. **Test thoroughly** - Multi-tab, network, errors
5. **Optimize performance** - Reduce payload size
6. **Monitor in production** - Track metrics

---

## Estimated Timeline

- **Hook creation**: 1-2 hours
- **Dashboard integration**: 1-2 hours
- **Status indicator**: 1 hour
- **Testing**: 2-3 hours
- **Total**: 5-8 hours (can be done in 1 day)

---

## Success Criteria

✅ New bookings appear in dashboard instantly  
✅ Notification badge shows count  
✅ Badge updates in real-time  
✅ Connection status displayed  
✅ Works with slow networks  
✅ No console errors  
✅ Performance acceptable (< 100ms latency)  

---

**Ready to implement? Start with Step 1: Create useRealtimeBookings Hook**
