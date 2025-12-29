import { useState, useEffect } from 'react';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '../../utils/cn';

interface SlotSelectionProps {
  duration: number;
  timezone: string;
  onSelectSlot: (dateTime: string) => void;
  disabledDates?: Date[];
  minDate?: Date;
}

export function SlotSelection({
  duration,
  timezone,
  onSelectSlot,
  disabledDates = [],
  minDate = startOfToday(),
}: SlotSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate next 30 days
  const dates = Array.from({ length: 30 }, (_, i) => addDays(minDate, i)).filter(
    (date) => !disabledDates.some((d) => d.toDateString() === date.toDateString())
  );

  useEffect(() => {
    if (selectedDate) {
      generateSlots(selectedDate);
    }
  }, [selectedDate]);

  const generateSlots = async (date: Date) => {
    setLoading(true);
    try {
      // Simulate API call to get available slots
      // In a real app, this would call your backend
      const mockSlots = generateMockSlots(date);
      setSlots(mockSlots);
    } catch (error) {
      console.error('Failed to generate slots:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockSlots = (date: Date): string[] => {
    const slots: string[] = [];
    
    // Generate slots every 30 minutes from 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);
        
        // Only show times that are in the future
        if (isBefore(new Date(), slotDate)) {
          const slotString = formatInTimeZone(slotDate, timezone, "yyyy-MM-dd'T'HH:mm:ss");
          slots.push(slotString);
        }
      }
    }
    
    return slots;
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
      </div>

      {/* Slot Selection */}
      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Select a time on {format(selectedDate, 'EEEE, MMMM d')}
          </h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : slots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => onSelectSlot(slot)}
                  className="p-3 rounded-lg border-2 border-gray-200 hover:border-primary-600 hover:bg-primary-50 transition-colors text-center"
                >
                  <div className="font-medium text-gray-900">
                    {formatInTimeZone(new Date(slot), timezone, 'h:mm a')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {duration} min
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 p-6 text-center">
              <p className="text-gray-600">No available slots for this date.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
