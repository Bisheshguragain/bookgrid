import { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { cn } from '../../utils/cn';
import { generateAvailableSlots, type TimeSlot } from '../../services/bookingService';

interface SlotSelectionProps {
  duration: number;
  timezone: string;
  userId: string;          // Host's user ID for fetching availability
  eventTypeId: string;     // Event type ID for slot generation
  onSelectSlot: (dateTime: string) => void;
  disabledDates?: Date[];
  minDate?: Date;
}

/**
 * SlotSelection Component
 * =======================
 * Displays available time slots for booking.
 * 
 * Key Features:
 * - Shows only AVAILABLE slots (filters out already booked times)
 * - Fetches real availability from database
 * - Respects host's availability rules
 * - Automatically refreshes when date changes
 */
export function SlotSelection({
  duration,
  timezone,
  userId,
  eventTypeId,
  onSelectSlot,
  disabledDates = [],
  minDate = startOfToday(),
}: SlotSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate next 30 days for date picker
  const dates = Array.from({ length: 30 }, (_, i) => addDays(minDate, i)).filter(
    (date) => !disabledDates.some((d) => d.toDateString() === date.toDateString())
  );

  /**
   * Fetch available slots from the booking service
   * This excludes already booked slots automatically
   */
  const fetchSlots = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the booking service to get REAL available slots
      // This filters out already booked times from the availability
      const availableSlots = await generateAvailableSlots(
        userId,
        eventTypeId,
        date,
        duration,
        timezone,
        30 // Slot interval in minutes
      );
      
      // Only show slots that are marked as available
      const openSlots = availableSlots.filter(slot => slot.isAvailable);
      setSlots(openSlots);
      
      if (openSlots.length === 0) {
        setError('No available slots for this date. The host may be fully booked or unavailable.');
      }
    } catch (err) {
      console.error('Failed to fetch available slots:', err);
      setError('Unable to load available times. Please try again.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [userId, eventTypeId, duration, timezone]);

  // Fetch slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots]);

  /**
   * Handle slot selection
   * The slot is passed back to the parent for booking
   */
  const handleSlotClick = (slot: TimeSlot) => {
    onSelectSlot(slot.startTime);
  };

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a date</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {dates.slice(0, 12).map((date) => (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={cn(
                'p-3 rounded-lg border-2 transition-colors text-center',
                selectedDate?.toDateString() === date.toDateString()
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="text-sm font-medium text-gray-900">
                {format(date, 'EEE')}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {format(date, 'd')}
              </div>
            </button>
          ))}
        </div>
        
        {/* Show more dates option */}
        {dates.length > 12 && (
          <button
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            onClick={() => {/* Could implement pagination or calendar view */}}
          >
            View more dates →
          </button>
        )}
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Select a time on {format(selectedDate, 'EEEE, MMMM d')}
          </h3>
          
          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
              <p className="text-sm text-gray-500">Loading available times...</p>
            </div>
          ) : error ? (
            /* Error or no slots message */
            <div className="rounded-lg bg-gray-50 p-6 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => fetchSlots(selectedDate)}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Try again
              </button>
            </div>
          ) : slots.length > 0 ? (
            /* Available slots grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleSlotClick(slot)}
                  className="p-3 rounded-lg border-2 border-gray-200 hover:border-primary-600 hover:bg-primary-50 transition-colors text-center group"
                >
                  <div className="font-medium text-gray-900 group-hover:text-primary-700">
                    {slot.displayTime}
                  </div>
                  <div className="text-xs text-gray-500">
                    {duration} min
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* No slots available */
            <div className="rounded-lg bg-gray-50 p-6 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              <p className="text-gray-600">No available slots for this date.</p>
              <p className="text-sm text-gray-500 mt-1">Please try another date.</p>
            </div>
          )}
          
          {/* Timezone notice */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            Times shown in {timezone}
          </div>
        </div>
      )}
    </div>
  );
}
