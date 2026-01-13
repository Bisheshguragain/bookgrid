import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { SlotSelection } from '../components/booking/SlotSelection';
import { sendRescheduleConfirmation } from '../services/emailService';
import { rescheduleBooking, checkSlotAvailability } from '../services/bookingService';
import type { Database } from '../lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type EventType = Database['public']['Tables']['event_types']['Row'];

interface RescheduleStep {
  type: 'confirmation' | 'slot-selection' | 'success';
}

export function Reschedule() {
  const { bookingId, token } = useParams<{ bookingId: string; token: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<RescheduleStep['type']>('confirmation');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId && token) {
      loadBooking();
    }
  }, [bookingId, token]);

  const loadBooking = async () => {
    setLoading(true);
    try {
      // Fetch booking with verification token
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          event_types (*)
        `)
        .eq('id', bookingId)
        .eq('reschedule_token', token)
        .single();

      if (fetchError) throw new Error('Invalid reschedule link');
      if (!data) throw new Error('Booking not found');

      setBooking(data as Booking);
      setEventType((data as any).event_types as EventType);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load booking';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setStep('success');
    handleReschedule(slot);
  };

  const handleReschedule = async (newSlot: string) => {
    if (!booking || !eventType || !token) return;

    try {
      const startTime = new Date(newSlot);
      const endTime = new Date(startTime.getTime() + eventType.duration * 60000);

      // ============================================
      // DOUBLE-BOOKING PREVENTION: Check slot availability
      // Exclude current booking from the check (it's being moved)
      // ============================================
      const slotCheck = await checkSlotAvailability(
        eventType.user_id,
        eventType.id,
        startTime,
        endTime,
        booking.id // Exclude current booking from conflict check
      );

      if (!slotCheck.available) {
        setError(slotCheck.reason || 'This time slot is no longer available. Please select another time.');
        setStep('slot-selection');
        return;
      }

      // ============================================
      // RESCHEDULE: Use the booking service
      // The old slot is automatically released when we update to the new time
      // ============================================
      const result = await rescheduleBooking(
        booking.id,
        token,
        startTime,
        endTime
      );

      if (!result.success || !result.booking) {
        setError(result.error || 'Failed to reschedule. Please try again.');
        setStep('slot-selection');
        return;
      }

      // Get host information to send email
      const { data: hostData } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', eventType.user_id)
        .single();

      if (hostData) {
        // Send reschedule confirmation email
        await sendRescheduleConfirmation(
          booking,
          result.booking,
          eventType,
          booking.guest_email,
          booking.guest_name,
          hostData
        );
      }

      setStep('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reschedule booking';
      setError(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full mx-4">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!booking || !eventType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full mx-4">
          <p className="text-gray-600">Booking not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Reschedule Appointment
          </h1>
          <p className="text-gray-600 mt-1">
            {eventType.title}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Booking Steps */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {step === 'confirmation' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Current Appointment
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Guest:</span>
                        <span className="font-medium text-gray-900">{booking.guest_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{booking.guest_email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Time:</span>
                        <span className="font-medium text-gray-900">
                          {formatInTimeZone(new Date(booking.start_time), booking.guest_time_zone, 'PPP p')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('slot-selection')}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Choose New Time
                  </button>
                </div>
              )}

              {step === 'slot-selection' && (
                <div>
                  <button
                    onClick={() => setStep('confirmation')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium mb-4"
                  >
                    ← Back
                  </button>
                  <SlotSelection
                    duration={eventType.duration}
                    timezone={booking.guest_time_zone}
                    userId={eventType.user_id}
                    eventTypeId={eventType.id}
                    onSelectSlot={handleSlotSelect}
                  />
                </div>
              )}

              {step === 'success' && selectedSlot && (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Rescheduled!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your appointment has been successfully rescheduled. A confirmation email has been sent to {booking.guest_email}.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-3">New appointment details:</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Event:</dt>
                        <dd className="font-medium text-gray-900">{eventType.title}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">New Time:</dt>
                        <dd className="font-medium text-gray-900">
                          {formatInTimeZone(new Date(selectedSlot), booking.guest_time_zone, 'PPP p')}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Duration:</dt>
                        <dd className="font-medium text-gray-900">{eventType.duration} minutes</dd>
                      </div>
                    </dl>
                  </div>

                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Event Details</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-600">Duration</p>
                  <p className="font-medium text-gray-900">{eventType.duration} minutes</p>
                </div>

                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="font-medium text-gray-900">
                    {eventType.location_type === 'custom' ? eventType.location_value : eventType.location_type}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">Timezone</p>
                  <p className="font-medium text-gray-900">{booking.guest_time_zone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
