# Booking Slot Availability System

## Overview

BookGrid implements a robust slot availability system that prevents double-booking and ensures slots are properly managed throughout the booking lifecycle.

## How It Works

### 1. Slot Generation

When a guest views available times, the system:
1. Fetches the host's **availability rules** (e.g., Monday 9 AM - 5 PM)
2. Fetches all **confirmed bookings** for the selected date
3. Generates time slots based on the availability rules
4. **Filters out slots that overlap with existing bookings**
5. Only shows **available** slots to the guest

```typescript
// SlotSelection component fetches real availability
const availableSlots = await generateAvailableSlots(
  userId,
  eventTypeId,
  date,
  duration,
  timezone
);
```

### 2. Double-Booking Prevention

Before creating a booking, the system performs a **real-time availability check**:

```typescript
// Check if slot is still available (handles race conditions)
const slotCheck = await checkSlotAvailability(
  userId,
  eventTypeId,
  startTime,
  endTime
);

if (!slotCheck.available) {
  // Redirect user to select another time
  setError('This time slot is no longer available');
  setStep('slot-selection');
  return;
}
```

### 3. Database-Level Protection

The SQL layer provides additional safety:

```sql
-- Trigger prevents INSERT/UPDATE if slot overlaps
CREATE TRIGGER booking_conflict_check
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_no_conflict();
```

### 4. Slot Release on Cancellation

When a booking is cancelled:
1. The booking status changes to `'cancelled'`
2. The slot is **automatically available** for other users
3. No additional "release" action is needed

```typescript
// The availability check excludes cancelled bookings
.eq('status', 'confirmed')  // Only confirmed bookings block slots
```

### 5. Rescheduling

When rescheduling:
1. The system checks if the **new slot** is available
2. The **current booking is excluded** from the conflict check
3. The booking time is updated atomically

```typescript
const result = await rescheduleBooking(
  bookingId,
  token,
  newStartTime,
  newEndTime
);
```

## File Structure

| File | Purpose |
|------|---------|
| `src/services/bookingService.ts` | Core booking logic and slot management |
| `src/components/booking/SlotSelection.tsx` | UI for selecting available slots |
| `src/pages/PublicBooking.tsx` | Public booking page with double-booking prevention |
| `src/pages/Cancel.tsx` | Cancellation flow (releases slot) |
| `src/pages/Reschedule.tsx` | Rescheduling flow (moves slot) |
| `sql/SLOT_AVAILABILITY.sql` | Database functions and triggers |

## Key Functions

### `generateAvailableSlots(userId, eventTypeId, date, duration, timezone)`
Generates all available time slots for a given date, filtering out already-booked times.

### `checkSlotAvailability(userId, eventTypeId, startTime, endTime, excludeBookingId?)`
Checks if a specific time slot is available. Returns `{ available: boolean, reason?: string }`.

### `bookSlot(userId, eventTypeId, guestName, guestEmail, startTime, endTime, notes?, guestTimeZone?)`
Books a slot with built-in availability verification. Returns success/failure with booking details.

### `cancelBooking(bookingId, cancelToken, reason?)`
Cancels a booking and releases the slot for other users.

### `rescheduleBooking(bookingId, rescheduleToken, newStartTime, newEndTime)`
Moves a booking to a new time, checking availability of the new slot.

## Database Schema

The system relies on the existing `bookings` table with these key fields:

```sql
bookings (
  id UUID,
  user_id UUID,           -- Host
  event_type_id UUID,
  start_time TIMESTAMPTZ, -- Slot start
  end_time TIMESTAMPTZ,   -- Slot end
  status TEXT,            -- 'confirmed' | 'cancelled' | 'rescheduled'
  ...
)
```

## SQL Functions (in SLOT_AVAILABILITY.sql)

### `check_slot_availability(user_id, event_type_id, start_time, end_time, exclude_booking_id)`
Database-level slot availability check.

### `get_available_slots(user_id, event_type_id, date, duration, interval, timezone)`
Returns all available slots for a date based on availability rules and existing bookings.

### `validate_booking_no_conflict()` (Trigger)
Prevents booking conflicts at the database level.

## Testing

To test the slot availability system:

1. **Create a booking** as a guest
2. **View the same time** as another guest - the slot should be hidden
3. **Cancel the booking** - the slot should reappear
4. **Try to book simultaneously** (two browser tabs) - only one should succeed

## Best Practices

1. Always use `checkSlotAvailability` before creating bookings
2. Use the `bookSlot` function instead of direct database inserts
3. Never manually update booking status without going through the proper functions
4. Ensure the SQL triggers are deployed to catch any edge cases
