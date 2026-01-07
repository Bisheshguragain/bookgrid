import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { SlotSelection } from '../components/booking/SlotSelection';
import { BookingForm, type BookingFormData } from '../components/booking/BookingForm';
import { sendBookingConfirmation, sendBookingNotificationToHost } from '../services/emailService';
import { useAntiSpam } from '../hooks/useAntiSpam';
import { TurnstileCaptcha } from '../components/common/Captcha';
import { bookSlot, checkSlotAvailability } from '../services/bookingService';
import type { Database } from '../lib/database.types';

type EventType = Database['public']['Tables']['event_types']['Row'];
type UserProfile = Database['public']['Tables']['users_profile']['Row'];

interface BookingStep {
  type: 'slot-selection' | 'booking-form' | 'confirmation';
}

export function PublicBooking() {
  const { username, eventTypeId } = useParams<{ username?: string; eventTypeId?: string }>();
  const navigate = useNavigate();

  const [eventType, setEventType] = useState<EventType | null>(null);
  const [host, setHost] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<BookingStep['type']>('slot-selection');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  // Anti-spam protection hook
  const antiSpam = useAntiSpam();
  
  // Turnstile site key from environment
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (username || eventTypeId) {
      loadEventType();
    }
  }, [username, eventTypeId]);

  const loadEventType = async () => {
    setLoading(true);
    try {
      // Route 1: Load by event type ID directly (/book/:eventTypeId)
      if (eventTypeId) {
        const { data: eventData, error: eventError } = await supabase
          .from('event_types')
          .select('*')
          .eq('id', eventTypeId)
          .eq('is_active', true)
          .single();

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Event type not found or inactive');

        setEventType(eventData);

        // Get the host's profile
        const { data: userData, error: userError } = await supabase
          .from('users_profile')
          .select('*')
          .eq('id', eventData.user_id)
          .single();

        if (userError) throw userError;
        if (!userData) throw new Error('Host not found');

        setHost(userData);
        return;
      }

      // Route 2: Load by username (/u/:username)
      if (username) {
        // Get user profile by username
        const { data: userData, error: userError } = await supabase
          .from('users_profile')
          .select('*')
          .eq('username', username)
          .single();

        if (userError) throw userError;
        if (!userData) throw new Error('User not found');

        setHost(userData);

        // Get first active event type for this user
        const { data: eventData, error: eventError } = await supabase
          .from('event_types')
          .select('*')
          .eq('user_id', userData.id)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (eventError && eventError.code !== 'PGRST116') throw eventError;
        if (!eventData) throw new Error('No available event types');

        setEventType(eventData);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load event type';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // After loading eventType and host, check for holiday mode or inactive event type
  useEffect(() => {
    if (!loading && (!eventType || !host)) return;
    // Check for holiday mode in localStorage for this user
    if (host) {
      const savedHoliday = localStorage.getItem(`holiday_mode_${host.id}`);
      if (savedHoliday) {
        const holiday = JSON.parse(savedHoliday);
        const today = new Date().toISOString().split('T')[0];
        if (holiday.enabled && holiday.start <= today && holiday.end >= today) {
          setError('This user is not accepting bookings at the moment. Please contact them directly.');
          setEventType(null);
          return;
        }
      }
    }
    // If eventType is inactive
    if (eventType && eventType.is_active === false) {
      setError('This user is not accepting bookings at the moment. Please contact them directly.');
      setEventType(null);
    }
  }, [eventType, host, loading]);

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setStep('booking-form');
    // Reset form timing when user moves to booking form
    antiSpam.resetFormTiming();
  };

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!eventType || !host || !selectedSlot) return;

    try {
      // ============================================
      // ANTI-SPAM CHECK: Validate before booking
      // ============================================
      // Skip spam check if CAPTCHA was already verified
      if (!captchaToken) {
        const spamCheck = await antiSpam.checkBookingAllowed(
          data.guestEmail,
          eventType.user_id,
          eventType.id
        );

        if (!spamCheck.allowed) {
          // Check if CAPTCHA is required
          if (spamCheck.reason?.includes('captcha') && turnstileSiteKey) {
            setShowCaptcha(true);
            setError('Please complete the verification below');
            return;
          }
          
          setError(spamCheck.reason || 'Unable to process your booking. Please try again later.');
          return;
        }
      }

      const startTime = new Date(selectedSlot);
      const endTime = new Date(startTime.getTime() + eventType.duration * 60000);

      // ============================================
      // DOUBLE-BOOKING PREVENTION: Check slot availability
      // This is a critical check to prevent race conditions
      // ============================================
      const slotCheck = await checkSlotAvailability(
        eventType.user_id,
        eventType.id,
        startTime,
        endTime
      );

      if (!slotCheck.available) {
        setError(slotCheck.reason || 'This time slot is no longer available. Please select another time.');
        // Go back to slot selection to let user pick another time
        setStep('slot-selection');
        setSelectedSlot(null);
        return;
      }

      // ============================================
      // CREATE BOOKING: Use the booking service
      // ============================================
      const bookingResult = await bookSlot(
        eventType.user_id,
        eventType.id,
        data.guestName,
        data.guestEmail,
        startTime,
        endTime,
        data.notes,
        data.guestTimeZone
      );

      if (!bookingResult.success || !bookingResult.booking) {
        // Handle booking failure (e.g., slot taken by another user)
        setError(bookingResult.error || 'Failed to create booking. Please try again.');
        if (bookingResult.error?.includes('no longer available') || bookingResult.error?.includes('just booked')) {
          setStep('slot-selection');
          setSelectedSlot(null);
        }
        return;
      }

      const booking = bookingResult.booking;

      // ============================================
      // ANTI-SPAM: Mark booking as successful
      // ============================================
      await antiSpam.markBookingSuccess(
        data.guestEmail,
        eventType.user_id,
        booking.id
      );

      // Send confirmation emails
      await sendBookingConfirmation(booking, eventType, data.guestEmail, data.guestName, host);
      await sendBookingNotificationToHost(booking, eventType, data.guestName, data.guestEmail, host);

      setBookingData(data);
      setStep('confirmation');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking';
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
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!eventType || !host) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full mx-4">
          <p className="text-gray-600">Event type not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium mb-4"
          >
            ← Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {eventType.title}
          </h1>
          <p className="text-gray-600 mt-1">
            {host.full_name}
          </p>
          {eventType.description && (
            <p className="text-gray-600 text-sm mt-2">{eventType.description}</p>
          )}
          
          {/* Payment Information */}
          {eventType.is_paid && (
            <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-green-900 mb-2">💳 Payment Required</p>
                  
                  {/* Payment Details */}
                  {eventType.payment_link && (
                    <div className="mb-3 p-3 bg-white rounded-lg border border-green-200">
                      <p className="text-xs font-semibold text-green-800 mb-2">Payment Details:</p>
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">{eventType.payment_link}</pre>
                    </div>
                  )}
                  
                  {/* Payment Instructions */}
                  <p className="text-sm text-green-800 mb-3">
                    {eventType.payment_instructions || 'Please complete payment at least 1 hour before the appointment and email the confirmation/receipt to confirm your booking.'}
                  </p>
                  
                  {/* If it looks like a URL, show a button */}
                  {eventType.payment_link && eventType.payment_link.startsWith('http') && (
                    <a
                      href={eventType.payment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      Complete Payment
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Booking Steps */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {step === 'slot-selection' && (
                <SlotSelection
                  duration={eventType.duration}
                  timezone={host.time_zone}
                  userId={host.id}
                  eventTypeId={eventType.id}
                  onSelectSlot={handleSlotSelect}
                />
              )}

              {step === 'booking-form' && selectedSlot && (
                <div>
                  <button
                    onClick={() => setStep('slot-selection')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium mb-4"
                  >
                    ← Change time
                  </button>
                  
                  {/* CAPTCHA for high-risk scenarios */}
                  {showCaptcha && turnstileSiteKey && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 mb-3">
                        Please verify you're human to continue:
                      </p>
                      <TurnstileCaptcha
                        siteKey={turnstileSiteKey}
                        onVerify={(token) => {
                          setCaptchaToken(token);
                          setShowCaptcha(false);
                          setError(null);
                        }}
                        onExpire={() => setCaptchaToken(null)}
                        theme="light"
                      />
                    </div>
                  )}
                  
                  <BookingForm
                    onSubmit={handleBookingSubmit}
                    userTimeZone={host.time_zone}
                  />
                </div>
              )}

              {step === 'confirmation' && selectedSlot && bookingData && (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Booking confirmed!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    A confirmation email has been sent to {bookingData.guestEmail}
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-3">Booking details:</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Event:</dt>
                        <dd className="font-medium text-gray-900">{eventType.title}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Date & Time:</dt>
                        <dd className="font-medium text-gray-900">
                          {formatInTimeZone(new Date(selectedSlot), bookingData.guestTimeZone, 'PPP p')}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Duration:</dt>
                        <dd className="font-medium text-gray-900">{eventType.duration} minutes</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Location:</dt>
                        <dd className="font-medium text-gray-900">
                          {eventType.location_type === 'custom' ? eventType.location_value : eventType.location_type}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <button
                    onClick={() => navigate(-1)}
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
              <h3 className="font-semibold text-gray-900 mb-4">Event details</h3>
              
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
                  <p className="font-medium text-gray-900">{host.time_zone}</p>
                </div>

                {selectedSlot && (
                  <div>
                    <p className="text-gray-600">Selected time</p>
                    <p className="font-medium text-gray-900">
                      {formatInTimeZone(new Date(selectedSlot), host.time_zone, 'PPP p')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
