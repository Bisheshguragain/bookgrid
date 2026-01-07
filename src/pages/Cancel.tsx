import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { sendCancellationConfirmation, sendCancellationNotificationToHost } from '../services/emailService';
import type { Database } from '../lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type EventType = Database['public']['Tables']['event_types']['Row'];

export function Cancel() {
  const { bookingId, token } = useParams<{ bookingId: string; token: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

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
        .eq('cancel_token', token)
        .single();

      if (fetchError) throw new Error('Invalid cancellation link');
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

  const handleCancel = async () => {
    if (!booking || !eventType) return;

    setCancelLoading(true);
    try {
      // ============================================
      // CANCEL BOOKING: Update status to 'cancelled'
      // This automatically releases the time slot:
      // - The slot becomes available for other users
      // - Our availability logic excludes cancelled bookings
      // - No additional action needed to "free" the slot
      // ============================================
      const { data: cancelledBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          notes: cancellationReason ? `Cancelled: ${cancellationReason}` : 'Cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
        .eq('cancel_token', token!)
        .select()
        .single();

      if (updateError) throw updateError;
      if (!cancelledBooking) throw new Error('Failed to cancel booking');

      // Get host information to send emails
      const { data: hostData } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', eventType.user_id)
        .single();

      if (hostData) {
        // Send cancellation emails to both guest and host
        await sendCancellationConfirmation(
          cancelledBooking,
          eventType,
          booking.guest_email,
          booking.guest_name,
          hostData
        );
        await sendCancellationNotificationToHost(
          cancelledBooking,
          eventType,
          booking.guest_name,
          booking.guest_email,
          hostData
        );
      }

      setCancelled(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel booking';
      setError(message);
    } finally {
      setCancelLoading(false);
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
            onClick={() => navigate(-1)}
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

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Appointment Cancelled
            </h1>
            <p className="text-gray-600 mb-6">
              Your appointment has been successfully cancelled. A confirmation email has been sent to {booking.guest_email}.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">Cancelled appointment:</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Event:</dt>
                  <dd className="font-medium text-gray-900">{eventType.title}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Guest:</dt>
                  <dd className="font-medium text-gray-900">{booking.guest_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Date & Time:</dt>
                  <dd className="font-medium text-gray-900">
                    {formatInTimeZone(new Date(booking.start_time), booking.guest_time_zone, 'PPP p')}
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
            Cancel Appointment
          </h1>
          <p className="text-gray-600 mt-1">
            Are you sure you want to cancel this appointment?
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Cancellation Confirmation */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
                <p className="text-red-700 font-medium">
                  This action cannot be undone. The organizer will be notified of the cancellation.
                </p>
              </div>

              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Appointment Details
              </h2>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Event:</span>
                  <span className="font-medium text-gray-900">{eventType.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guest:</span>
                  <span className="font-medium text-gray-900">{booking.guest_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{booking.guest_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-medium text-gray-900">
                    {formatInTimeZone(new Date(booking.start_time), booking.guest_time_zone, 'PPP p')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">{eventType.duration} minutes</span>
                </div>
              </div>

              {/* Cancellation Reason */}
              <div className="mb-6">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-900 mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  id="reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Tell us why you're cancelling..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 py-2 px-4 rounded-lg border-2 border-gray-300 text-gray-900 font-medium hover:border-gray-400 transition-colors"
                  disabled={cancelLoading}
                >
                  Keep Appointment
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">What Happens?</h3>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-gray-600">The organizer will be notified</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-gray-600">You'll receive a confirmation email</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-gray-600">The time slot will be freed up</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-gray-600">This action cannot be undone</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
