import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useRealtimeBookings } from '../hooks/useRealtimeBookings';
import { supabase } from '../lib/supabase';
import { formatDateTime } from '../utils/datetime';
import type { BookingWithEventType } from '../lib/database.types';

export function Dashboard() {
  const [stats, setStats] = useState({
    upcoming: 0,
    past: 0,
    eventTypes: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<BookingWithEventType[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingWithEventType[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, profile } = useAuthStore();
  const { newBookingCount, clearNewBookingNotification } = useRealtimeBookings({
    userId: user?.id || '',
    enabled: !!user?.id,
    channelName: 'dashboard-bookings',
  });

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const now = new Date().toISOString();

        // Fetch stats
        const [upcomingCount, pastCount, eventTypesCount] = await Promise.all([
          supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'confirmed')
            .gte('start_time', now),
          supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .lt('start_time', now),
          supabase
            .from('event_types')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_active', true),
        ]);

        setStats({
          upcoming: upcomingCount.count || 0,
          past: pastCount.count || 0,
          eventTypes: eventTypesCount.count || 0,
        });

        // Fetch upcoming events
        const { data: upcoming, error: upcomingError } = await supabase
          .from('bookings')
          .select(`
            *,
            event_types (*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .gte('start_time', now)
          .order('start_time', { ascending: true })
          .limit(5);

        if (upcomingError) throw upcomingError;
        setUpcomingEvents(upcoming as BookingWithEventType[] || []);

        // Fetch recent bookings
        const { data: recent, error: recentError } = await supabase
          .from('bookings')
          .select(`
            *,
            event_types (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3); // Show only 3 most recent bookings

        if (recentError) throw recentError;
        setRecentBookings(recent as BookingWithEventType[] || []);

      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header with Purple Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-purple-100 text-lg">
          Here's what's happening with your calendar today
        </p>
      </div>

      {/* New Booking Notification Badge */}
      {newBookingCount > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-white border-2 border-purple-200 rounded-xl p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold shadow-lg">
              {newBookingCount}
            </div>
            <div>
              <p className="text-purple-900 font-semibold text-lg">
                New {newBookingCount === 1 ? 'Booking' : 'Bookings'}!
              </p>
              <p className="text-purple-600 text-sm">
                {newBookingCount} {newBookingCount !== 1 ? 'appointments' : 'appointment'} waiting for you
              </p>
            </div>
          </div>
          <button
            onClick={clearNewBookingNotification}
            className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming Events Card */}
        <Link 
          to="/app/calendar" 
          className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-xl cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2 group-hover:text-purple-700 transition-colors">Upcoming Events</p>
              <p className="text-4xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{stats.upcoming}</p>
              <p className="text-sm text-gray-500 mt-1">Scheduled appointments</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Total Events Card */}
        <Link 
          to="/app/calendar" 
          className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-xl cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2 group-hover:text-purple-700 transition-colors">Total Events</p>
              <p className="text-4xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{stats.past + stats.upcoming}</p>
              <p className="text-sm text-gray-500 mt-1">All time bookings</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Event Types Card */}
        <Link 
          to="/app/event-types" 
          className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-xl cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2 group-hover:text-purple-700 transition-colors">Event Types</p>
              <p className="text-4xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{stats.eventTypes}</p>
              <p className="text-sm text-gray-500 mt-1">Active templates</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-300 to-purple-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-purple-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-3"></span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link
            to="/app/event-types/new"
            className="group flex items-center p-5 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">New Event Type</p>
              <p className="text-sm text-gray-500">Create template</p>
            </div>
          </Link>

          <Link
            to="/app/availability"
            className="group flex items-center p-5 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">Set Availability</p>
              <p className="text-sm text-gray-500">Configure hours</p>
            </div>
          </Link>

          <Link
            to="/app/calendar"
            className="group flex items-center p-5 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-300 to-purple-400 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">View Calendar</p>
              <p className="text-sm text-gray-500">See bookings</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Upcoming Events & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-3"></span>
              Upcoming Events
            </h2>
            <Link to="/app/calendar" className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm font-medium">No upcoming events</p>
                <p className="text-gray-400 text-xs mt-1">Your future appointments will appear here</p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <Link 
                  key={event.id} 
                  to="/app/calendar"
                  className="flex items-start space-x-3 p-4 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100 hover:border-purple-300 transition-all group"
                >
                  <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mt-1 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {event.guest_name}
                      </p>
                      <span className="text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                        Manage →
                      </span>
                    </div>
                    <p className="text-xs text-purple-600 font-medium mt-0.5">
                      {event.event_types.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(event.start_time, profile?.time_zone)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-3"></span>
              Recent Bookings
            </h2>
            <Link to="/app/analytics?tab=bookings" className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm font-medium">No recent bookings</p>
                <p className="text-gray-400 text-xs mt-1">Your booking history will appear here</p>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100 hover:border-purple-300 transition-all">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                    booking.status === 'confirmed' ? 'bg-green-500' :
                    booking.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{booking.guest_name}</p>
                    <p className="text-xs text-purple-600 font-medium mt-0.5">{booking.event_types.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(booking.start_time, profile?.time_zone)} • <span className="capitalize">{booking.status}</span>
                    </p>
                    {booking.notes && (
                      <p className="text-xs text-gray-700 mt-1">📝 {booking.notes}</p>
                    )}
                    {booking.meeting_method && (
                      <p className="text-xs text-blue-700 mt-1">🔗 {booking.meeting_method}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
