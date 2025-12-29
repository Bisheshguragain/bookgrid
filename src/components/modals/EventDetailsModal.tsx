import { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import type { Database } from '../../lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type EventType = Database['public']['Tables']['event_types']['Row'];

interface EventDetailsModalProps {
  isOpen: boolean;
  booking: (Booking & { event_types: EventType }) | null;
  userTimeZone?: string;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
  onReschedule?: (id: string) => void;
}

export function EventDetailsModal({
  isOpen,
  booking,
  userTimeZone = 'America/New_York',
  onClose,
  onDelete,
  onReschedule,
}: EventDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const handleCancel = async () => {
    if (!onDelete) return;
    setLoading(true);
    try {
      await onDelete(booking.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const startDate = new Date(booking.start_time);
  const endDate = new Date(booking.end_time);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Event Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Event Title */}
          <div>
            <p className="text-sm text-gray-600">Event Type</p>
            <p className="text-lg font-semibold text-gray-900">{booking.event_types.title}</p>
          </div>

          {/* Guest Info */}
          <div>
            <p className="text-sm text-gray-600">Guest</p>
            <p className="text-gray-900 font-medium">{booking.guest_name}</p>
            <p className="text-sm text-gray-500">{booking.guest_email}</p>
          </div>

          {/* Date & Time */}
          <div>
            <p className="text-sm text-gray-600">Date & Time</p>
            <p className="text-gray-900 font-medium">
              {formatInTimeZone(startDate, userTimeZone, 'PPP')}
            </p>
            <p className="text-gray-900 font-medium">
              {formatInTimeZone(startDate, userTimeZone, 'p')} - {formatInTimeZone(endDate, userTimeZone, 'p')}
            </p>
          </div>

          {/* Duration */}
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="text-gray-900 font-medium">{booking.event_types.duration} minutes</p>
          </div>

          {/* Location */}
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="text-gray-900 font-medium">
              {booking.event_types.location_type === 'custom'
                ? booking.event_types.location_value || 'Not specified'
                : booking.event_types.location_type}
            </p>
          </div>

          {/* Guest Timezone */}
          <div>
            <p className="text-sm text-gray-600">Guest Timezone</p>
            <p className="text-gray-900 font-medium">{booking.guest_time_zone}</p>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div>
              <p className="text-sm text-gray-600">Notes</p>
              <p className="text-gray-900 text-sm">{booking.notes}</p>
            </div>
          )}

          {/* Status */}
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              booking.status === 'confirmed'
                ? 'bg-green-100 text-green-800'
                : booking.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {booking.status === 'confirmed' && (
          <div className="flex gap-2 p-6 border-t border-gray-200">
            {onReschedule && (
              <button
                onClick={() => {
                  onReschedule(booking.id);
                  onClose();
                }}
                className="flex-1 py-2 px-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                Reschedule
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleCancel}
                className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Cancelling...' : 'Cancel'}
              </button>
            )}
          </div>
        )}

        {/* Close Button */}
        {!onDelete && (
          <div className="flex gap-2 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full py-2 px-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
