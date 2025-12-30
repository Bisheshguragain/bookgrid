/**
 * Booking Service
 * ===============
 * Centralized service for managing booking slots and availability.
 * This service handles:
 * - Fetching available slots based on availability rules
 * - Checking slot availability before booking
 * - Creating bookings with conflict prevention
 * - Releasing slots when bookings are cancelled
 */

import { supabase } from '../lib/supabase';
import { addMinutes, format, isBefore, parseISO, startOfDay, addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { Database } from '../lib/database.types';

type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

// ============================================
// Types
// ============================================

export interface TimeSlot {
  id: string;                    // Unique identifier for the slot
  startTime: string;             // ISO string
  endTime: string;               // ISO string
  displayTime: string;           // Formatted for display (e.g., "9:00 AM")
  isAvailable: boolean;          // Whether the slot can be booked
  date: string;                  // Date in YYYY-MM-DD format
}

export interface SlotAvailabilityResult {
  available: boolean;
  reason?: string;
  conflictingBooking?: {
    id: string;
    startTime: string;
    endTime: string;
  };
}

export interface BookSlotResult {
  success: boolean;
  bookingId?: string;
  booking?: Booking;
  error?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get the day of week (0=Sunday, 6=Saturday)
 */
const getDayOfWeek = (date: Date): number => {
  return date.getDay();
};

/**
 * Parse time string (HH:MM or HH:MM:SS) to hours and minutes
 */
const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Generate a unique slot ID
 */
const generateSlotId = (date: Date, startTime: string): string => {
  return `${format(date, 'yyyy-MM-dd')}_${startTime}`;
};

// ============================================
// Core Service Functions
// ============================================

/**
 * Fetch availability rules for a specific user
 * Returns the user's weekly availability schedule
 */
export const fetchAvailabilityRules = async (
  userId: string
): Promise<AvailabilityRule[]> => {
  const { data, error } = await supabase
    .from('availability_rules')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching availability rules:', error);
    throw new Error('Failed to load availability');
  }

  return data || [];
};

/**
 * Fetch existing confirmed bookings for a date range
 * Used to determine which slots are already taken
 */
export const fetchBookingsForDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw new Error('Failed to load existing bookings');
  }

  return data || [];
};

/**
 * Check if a specific time slot is available
 * Returns detailed availability status with conflict info if blocked
 */
export const checkSlotAvailability = async (
  userId: string,
  _eventTypeId: string, // Reserved for future event-type-specific rules
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<SlotAvailabilityResult> => {
  try {
    // Query for any overlapping confirmed bookings
    let query = supabase
      .from('bookings')
      .select('id, start_time, end_time')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      // Check for time overlap: (StartA < EndB) AND (EndA > StartB)
      .lt('start_time', endTime.toISOString())
      .gt('end_time', startTime.toISOString());

    // Exclude a specific booking (useful for rescheduling)
    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data: conflicts, error } = await query;

    if (error) {
      console.error('Error checking slot availability:', error);
      throw new Error('Failed to check slot availability');
    }

    // If there are conflicts, the slot is not available
    if (conflicts && conflicts.length > 0) {
      return {
        available: false,
        reason: 'This time slot is already booked',
        conflictingBooking: {
          id: conflicts[0].id,
          startTime: conflicts[0].start_time,
          endTime: conflicts[0].end_time,
        },
      };
    }

    return { available: true };
  } catch (err) {
    console.error('Error in checkSlotAvailability:', err);
    return {
      available: false,
      reason: 'Unable to verify slot availability',
    };
  }
};

/**
 * Generate available time slots for a specific date
 * Combines availability rules with existing bookings to show only open slots
 */
export const generateAvailableSlots = async (
  userId: string,
  _eventTypeId: string, // Reserved for future event-type-specific rules
  date: Date,
  durationMinutes: number,
  timezone: string,
  slotIntervalMinutes: number = 30
): Promise<TimeSlot[]> => {
  const slots: TimeSlot[] = [];
  const dayOfWeek = getDayOfWeek(date);

  try {
    // Step 1: Get availability rules for this day
    const rules = await fetchAvailabilityRules(userId);
    const dayRules = rules.filter(r => r.day_of_week === dayOfWeek);

    if (dayRules.length === 0) {
      // No availability set for this day
      return [];
    }

    // Step 2: Get existing bookings for this date
    const dayStart = startOfDay(date);
    const dayEnd = addDays(dayStart, 1);
    const existingBookings = await fetchBookingsForDateRange(userId, dayStart, dayEnd);

    // Step 3: Generate slots from each availability rule
    for (const rule of dayRules) {
      const startParts = parseTime(rule.start_time);
      const endParts = parseTime(rule.end_time);
      const bufferBefore = rule.buffer_before || 0;

      // Create start and end times for this rule
      const ruleStart = new Date(date);
      ruleStart.setHours(startParts.hours, startParts.minutes, 0, 0);

      const ruleEnd = new Date(date);
      ruleEnd.setHours(endParts.hours, endParts.minutes, 0, 0);

      // Generate slots within this window
      let slotStart = new Date(ruleStart);

      while (addMinutes(slotStart, durationMinutes) <= ruleEnd) {
        const slotEnd = addMinutes(slotStart, durationMinutes);

        // Check if slot is in the future (accounting for buffer)
        const minimumStartTime = addMinutes(new Date(), bufferBefore);
        const isInFuture = isBefore(minimumStartTime, slotStart);

        if (isInFuture) {
          // Check if slot conflicts with existing bookings
          const hasConflict = existingBookings.some(booking => {
            const bookingStart = parseISO(booking.start_time);
            const bookingEnd = parseISO(booking.end_time);
            
            // Check for overlap
            return slotStart < bookingEnd && slotEnd > bookingStart;
          });

          // Only add available slots
          if (!hasConflict) {
            slots.push({
              id: generateSlotId(date, slotStart.toISOString()),
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              displayTime: formatInTimeZone(slotStart, timezone, 'h:mm a'),
              isAvailable: true,
              date: format(date, 'yyyy-MM-dd'),
            });
          }
        }

        // Move to next slot
        slotStart = addMinutes(slotStart, slotIntervalMinutes);
      }
    }

    return slots;
  } catch (err) {
    console.error('Error generating available slots:', err);
    throw new Error('Failed to generate available time slots');
  }
};

/**
 * Book a slot with availability verification
 * Performs a final availability check before creating the booking
 */
export const bookSlot = async (
  userId: string,
  eventTypeId: string,
  guestName: string,
  guestEmail: string,
  startTime: Date,
  endTime: Date,
  notes?: string,
  guestTimeZone: string = 'America/New_York'
): Promise<BookSlotResult> => {
  try {
    // Step 1: Verify slot is still available (race condition prevention)
    const availability = await checkSlotAvailability(
      userId,
      eventTypeId,
      startTime,
      endTime
    );

    if (!availability.available) {
      return {
        success: false,
        error: availability.reason || 'This time slot is no longer available. Please select another time.',
      };
    }

    // Step 2: Create the booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        event_type_id: eventTypeId,
        guest_name: guestName,
        guest_email: guestEmail,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: notes || null,
        guest_time_zone: guestTimeZone,
        status: 'confirmed',
      })
      .select()
      .single();

    if (error) {
      // Check if it's a conflict error from the trigger
      if (error.message?.includes('conflict') || error.message?.includes('overlaps')) {
        return {
          success: false,
          error: 'This time slot was just booked by someone else. Please select another time.',
        };
      }
      throw error;
    }

    if (!booking) {
      throw new Error('Failed to create booking');
    }

    return {
      success: true,
      bookingId: booking.id,
      booking: booking,
    };
  } catch (err) {
    console.error('Error booking slot:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to book this time slot',
    };
  }
};

/**
 * Cancel a booking and release the slot
 * The slot automatically becomes available again for other users
 */
export const cancelBooking = async (
  bookingId: string,
  cancelToken: string,
  cancellationReason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify token and update status
    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        notes: cancellationReason 
          ? `Cancelled: ${cancellationReason}` 
          : 'Cancelled by guest',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('cancel_token', cancelToken)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!updatedBooking) {
      return {
        success: false,
        error: 'Invalid cancellation link or booking not found',
      };
    }

    // The slot is now automatically available because:
    // 1. The booking status is 'cancelled'
    // 2. Our availability check excludes cancelled bookings
    // 3. The slot will show up in generateAvailableSlots for other users

    return { success: true };
  } catch (err) {
    console.error('Error cancelling booking:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to cancel booking',
    };
  }
};

/**
 * Reschedule a booking
 * Releases the old slot and books the new one
 */
export const rescheduleBooking = async (
  bookingId: string,
  rescheduleToken: string,
  newStartTime: Date,
  newEndTime: Date
): Promise<BookSlotResult> => {
  try {
    // Step 1: Get the existing booking to verify token and get user/event info
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('reschedule_token', rescheduleToken)
      .single();

    if (fetchError || !existingBooking) {
      return {
        success: false,
        error: 'Invalid reschedule link or booking not found',
      };
    }

    // Step 2: Check if new slot is available (excluding current booking)
    const availability = await checkSlotAvailability(
      existingBooking.user_id,
      existingBooking.event_type_id,
      newStartTime,
      newEndTime,
      bookingId // Exclude this booking from conflict check
    );

    if (!availability.available) {
      return {
        success: false,
        error: availability.reason || 'The new time slot is not available',
      };
    }

    // Step 3: Update the booking with new time
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
        status: 'confirmed', // Keep as confirmed
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('reschedule_token', rescheduleToken)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      bookingId: updatedBooking.id,
      booking: updatedBooking,
    };
  } catch (err) {
    console.error('Error rescheduling booking:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to reschedule booking',
    };
  }
};

// ============================================
// Export default service object
// ============================================
export const bookingService = {
  fetchAvailabilityRules,
  fetchBookingsForDateRange,
  checkSlotAvailability,
  generateAvailableSlots,
  bookSlot,
  cancelBooking,
  rescheduleBooking,
};

export default bookingService;
