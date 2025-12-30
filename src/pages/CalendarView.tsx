import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, isBefore } from 'date-fns';
import type { BookingWithEventType } from '../lib/database.types';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<BookingWithEventType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingWithEventType | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const loadBookings = async () => {
      setLoading(true);
      try {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);

        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            event_types (*)
          `)
          .eq('user_id', user.id)
          .gte('start_time', start.toISOString())
          .lte('start_time', end.toISOString())
          .order('start_time', { ascending: true });

        if (error) throw error;
        setBookings((data || []) as BookingWithEventType[]);
      } catch (error) {
        console.error('Error loading bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user, currentDate]);

  // ============================================
  // BOOKING ACTIONS: Cancel & Reschedule
  // ============================================
  
  /**
   * Cancel a booking (host action)
   * This releases the time slot for other users
   */
  const handleCancelBooking = async (booking: BookingWithEventType) => {
    const confirmMessage = `Are you sure you want to cancel the booking with ${booking.guest_name}?\n\nThis will:\n• Free up the time slot\n• Notify the guest via email`;
    
    if (!window.confirm(confirmMessage)) return;
    
    setActionLoading(booking.id);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          notes: booking.notes 
            ? `${booking.notes}\n\n[Cancelled by host on ${new Date().toLocaleDateString()}]`
            : `[Cancelled by host on ${new Date().toLocaleDateString()}]`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === booking.id 
          ? { ...b, status: 'cancelled' as const }
          : b
      ));

      alert(`✅ Booking with ${booking.guest_name} has been cancelled. The time slot is now available.`);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('❌ Failed to cancel booking. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Open reschedule modal for editing booking time
   */
  const handleRescheduleBooking = (booking: BookingWithEventType) => {
    setEditingBooking(booking);
  };

  /**
   * Update booking with new time
   */
  const handleUpdateBookingTime = async (bookingId: string, newStartTime: Date) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const duration = booking.event_types.duration;
    const newEndTime = new Date(newStartTime.getTime() + duration * 60000);

    setActionLoading(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === bookingId 
          ? { ...b, start_time: newStartTime.toISOString(), end_time: newEndTime.toISOString(), status: 'confirmed' as const }
          : b
      ));

      setEditingBooking(null);
      alert('✅ Booking time updated successfully!');
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('❌ Failed to update booking. The time slot may be taken.');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Check if booking can be modified (is in the future)
   */
  const canModifyBooking = (booking: BookingWithEventType): boolean => {
    return isBefore(new Date(), new Date(booking.start_time)) && booking.status === 'confirmed';
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.start_time), date)
    );
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  // Calculate padding days for calendar grid
  const firstDayOfMonth = monthStart.getDay();
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* Header with Purple Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">📆 Calendar View</h1>
            <p className="text-purple-100 text-lg">
              View all your appointments in calendar format
            </p>
          </div>
          
          <button
            onClick={handleToday}
            className="px-6 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl"
          >
            🗓️ Today
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100 space-y-6">
        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-purple-200 rounded-xl overflow-hidden shadow-md">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="bg-gradient-to-br from-purple-100 to-pink-100 py-3 text-center text-xs font-bold text-purple-900"
                >
                  {day}
                </div>
              ))}

              {/* Padding days */}
              {paddingDays.map((_, index) => (
                <div key={`padding-${index}`} className="bg-white min-h-24"></div>
              ))}

              {/* Calendar days */}
              {daysInMonth.map((date) => {
                const dayBookings = getBookingsForDate(date);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isCurrentDay = isToday(date);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`bg-white min-h-24 p-2 text-left hover:bg-purple-50 transition-colors relative ${
                      !isSameMonth(date, currentDate) ? 'text-gray-400' : ''
                    } ${isSelected ? 'ring-2 ring-purple-500 ring-inset bg-purple-50' : ''}`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                        isCurrentDay
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-gray-900'
                      }`}
                    >
                      {format(date, 'd')}
                    </span>

                    {dayBookings.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {dayBookings.slice(0, 2).map((booking) => (
                          <div
                            key={booking.id}
                            className="text-xs px-1 py-0.5 rounded truncate"
                            style={{
                              backgroundColor: booking.event_types.color + '20',
                              color: booking.event_types.color,
                            }}
                          >
                            {format(new Date(booking.start_time), 'h:mm a')}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-xs text-gray-500 px-1">
                            +{dayBookings.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="border-t-2 border-purple-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  📅 {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>

                {selectedBookings.length === 0 ? (
                  <div className="text-center py-8 bg-purple-50 rounded-xl">
                    <p className="text-gray-600 text-sm">No appointments scheduled for this day</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-start space-x-4 p-5 rounded-xl border-2 border-purple-100 hover:border-purple-300 transition-colors bg-white shadow-sm"
                      >
                        <div
                          className="w-1.5 h-full rounded-full"
                          style={{ backgroundColor: booking.event_types.color }}
                        ></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900">
                              {booking.event_types.title}
                            </h4>
                            <span
                              className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-700'
                                  : booking.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {booking.status === 'confirmed' ? '✓ Confirmed' : 
                               booking.status === 'cancelled' ? '✗ Cancelled' : '⏳ Rescheduled'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 font-medium">
                            🕐 {format(new Date(booking.start_time), 'h:mm a')} -{' '}
                            {format(new Date(booking.end_time), 'h:mm a')}
                          </p>
                          <p className="text-sm text-gray-700 mt-2">
                            <strong>👤 Guest:</strong> {booking.guest_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>✉️ Email:</strong> {booking.guest_email}
                          </p>
                          {booking.notes && (
                            <p className="text-sm text-gray-600 mt-2 p-3 bg-purple-50 rounded-lg">
                              <strong>📝 Notes:</strong> {booking.notes}
                            </p>
                          )}
                          
                          {/* ============================================ */}
                          {/* ACTION BUTTONS: Cancel & Reschedule */}
                          {/* ============================================ */}
                          {canModifyBooking(booking) && (
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                              <button
                                onClick={() => handleRescheduleBooking(booking)}
                                disabled={actionLoading === booking.id}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancelBooking(booking)}
                                disabled={actionLoading === booking.id}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {actionLoading === booking.id ? (
                                  <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                                Cancel Booking
                              </button>
                            </div>
                          )}
                          
                          {/* Show message for past/cancelled bookings */}
                          {!canModifyBooking(booking) && booking.status === 'confirmed' && (
                            <p className="text-xs text-gray-400 mt-3 italic">
                              ⏰ This booking has already passed
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
          <p className="text-sm font-semibold text-gray-600 mb-1">📊 Total This Month</p>
          <p className="text-3xl font-bold text-purple-600">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-100">
          <p className="text-sm font-semibold text-gray-600 mb-1">✅ Confirmed</p>
          <p className="text-3xl font-bold text-green-600">
            {bookings.filter(b => b.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-100">
          <p className="text-sm font-semibold text-gray-600 mb-1">❌ Cancelled</p>
          <p className="text-3xl font-bold text-red-600">
            {bookings.filter(b => b.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* RESCHEDULE MODAL */}
      {/* ============================================ */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">📅 Reschedule Booking</h2>
                <button
                  onClick={() => setEditingBooking(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Current booking info */}
              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-purple-900 mb-2">Current Booking:</p>
                <p className="text-sm text-purple-700">
                  <strong>{editingBooking.guest_name}</strong> - {editingBooking.event_types.title}
                </p>
                <p className="text-sm text-purple-600">
                  {format(new Date(editingBooking.start_time), 'EEEE, MMMM d, yyyy')} at{' '}
                  {format(new Date(editingBooking.start_time), 'h:mm a')}
                </p>
              </div>
              
              {/* New time selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Date
                  </label>
                  <input
                    type="date"
                    id="reschedule-date"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    defaultValue={format(new Date(editingBooking.start_time), 'yyyy-MM-dd')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Time
                  </label>
                  <input
                    type="time"
                    id="reschedule-time"
                    defaultValue={format(new Date(editingBooking.start_time), 'HH:mm')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingBooking(null)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const dateInput = document.getElementById('reschedule-date') as HTMLInputElement;
                    const timeInput = document.getElementById('reschedule-time') as HTMLInputElement;
                    if (dateInput && timeInput) {
                      const newDateTime = new Date(`${dateInput.value}T${timeInput.value}`);
                      if (newDateTime > new Date()) {
                        handleUpdateBookingTime(editingBooking.id, newDateTime);
                      } else {
                        alert('Please select a future date and time');
                      }
                    }
                  }}
                  disabled={actionLoading === editingBooking.id}
                  className="flex-1 px-4 py-3 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === editingBooking.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
