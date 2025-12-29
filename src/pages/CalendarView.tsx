import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import type { BookingWithEventType } from '../lib/database.types';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<BookingWithEventType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
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
                               booking.status === 'cancelled' ? '✗ Cancelled' : '⏳ Pending'}
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
    </div>
  );
}
