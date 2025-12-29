import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { subDays, format, parseISO, isAfter, isBefore } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
  LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';
import { generateAnalyticsPDF } from '../lib/pdfExport';

export function Analytics() {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [metrics, setMetrics] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [eventTypeData, setEventTypeData] = useState<any[]>([]);
  const [bookingsData, setBookingsData] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [pastBookings, setPastBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const { user, profile } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const startDate = new Date(`${dateRange.start}T00:00:00Z`).toISOString();
        const endDate = new Date(`${dateRange.end}T23:59:59Z`).toISOString();

        // Fetch booking metrics
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, status, start_time, end_time, guest_name, guest_email, guest_time_zone, notes, event_type_id, event_types(id, title, duration)')
          .eq('user_id', user.id)
          .gte('start_time', startDate)
          .lte('start_time', endDate);

        if (bookingsError) throw bookingsError;

        // Store bookings data for PDF export
        setBookingsData(bookings || []);

        // Separate upcoming and past bookings
        const now = new Date();
        const upcoming = (bookings || [])
          .filter((b: any) => isAfter(parseISO(b.start_time), now) && b.status !== 'cancelled')
          .sort((a: any, b: any) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
        
        const past = (bookings || [])
          .filter((b: any) => isBefore(parseISO(b.start_time), now) || b.status === 'cancelled')
          .sort((a: any, b: any) => parseISO(b.start_time).getTime() - parseISO(a.start_time).getTime());
        
        setUpcomingBookings(upcoming);
        setPastBookings(past);

        // Calculate metrics
        const totalBookings = bookings?.length || 0;
        const confirmedBookings = bookings?.filter((b: any) => b.status === 'confirmed').length || 0;
        const cancelledBookings = bookings?.filter((b: any) => b.status === 'cancelled').length || 0;

        // Prepare chart data (bookings by day)
        const dailyData: { [key: string]: number } = {};
        bookings?.forEach((b: any) => {
          const day = format(parseISO(b.start_time), 'MMM dd');
          dailyData[day] = (dailyData[day] || 0) + 1;
        });

        const chartDataArray = Object.entries(dailyData).map(([date, count]) => ({
          date,
          bookings: count,
        }));

        // Prepare event type data (pie chart)
        const eventTypeStats: { [key: string]: number } = {};
        bookings?.forEach((b: any) => {
          const typeTitle = b.event_types?.title || 'Unknown';
          eventTypeStats[typeTitle] = (eventTypeStats[typeTitle] || 0) + 1;
        });

        const eventTypeArray = Object.entries(eventTypeStats).map(([name, value]) => ({
          name,
          value,
        }));

        setChartData(chartDataArray);
        setEventTypeData(eventTypeArray);
        
        setMetrics({
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          conversionRate: totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0,
          averagePerDay: totalBookings > 0 ? Math.round(totalBookings / 30) : 0,
        });
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user, dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Purple Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">📊 Analytics</h1>
        <p className="text-purple-100 text-lg">
          Track your booking trends and metrics
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📅 Date Range</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-semibold text-gray-900 mb-2">
              Start Date
            </label>
            <input
              type="date"
              id="start_date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>
          
          <div>
            <label htmlFor="end_date" className="block text-sm font-semibold text-gray-900 mb-2">
              End Date
            </label>
            <input
              type="date"
              id="end_date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>
        </div>

        {/* Quick Range Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={() => {
              const end = new Date();
              const start = subDays(end, 7);
              setDateRange({
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
              });
            }}
            className="px-4 py-2 text-sm font-semibold text-purple-700 bg-purple-50 border-2 border-purple-200 rounded-xl hover:bg-purple-100 transition-all"
          >
            📆 Last 7 Days
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = subDays(end, 30);
              setDateRange({
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
              });
            }}
            className="px-4 py-2 text-sm font-semibold text-purple-700 bg-purple-50 border-2 border-purple-200 rounded-xl hover:bg-purple-100 transition-all"
          >
            📆 Last 30 Days
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = subDays(end, 90);
              setDateRange({
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
              });
            }}
            className="px-4 py-2 text-sm font-semibold text-purple-700 bg-purple-50 border-2 border-purple-200 rounded-xl hover:bg-purple-100 transition-all"
          >
            📆 Last 90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Bookings */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{metrics.totalBookings}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Confirmed Bookings */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Confirmed</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{metrics.confirmedBookings}</p>
                  <p className="text-sm text-green-600 mt-1 font-semibold">{metrics.conversionRate}% conversion</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Cancelled Bookings */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Cancelled</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{metrics.cancelledBookings}</p>
                  <p className="text-sm text-red-600 mt-1 font-semibold">{metrics.totalBookings > 0 ? Math.round((metrics.cancelledBookings / metrics.totalBookings) * 100) : 0}% cancellation</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Average Per Day */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Average Per Day</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{metrics.averagePerDay}</p>
                  <p className="text-sm text-gray-600 mt-1 font-semibold">bookings/day</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bookings Over Time */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Bookings Over Time</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Line type="monotone" dataKey="bookings" stroke="#9333ea" strokeWidth={3} name="Bookings" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center bg-purple-50 rounded-xl">
                  <p className="text-gray-500">No data available for the selected period</p>
                </div>
              )}
            </div>

            {/* Event Type Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Bookings by Event Type</h3>
              {eventTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={eventTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }: any) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventTypeData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={['#9333ea', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center bg-purple-50 rounded-xl">
                  <p className="text-gray-500">No data available for the selected period</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming & Past Bookings Section */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-purple-100 overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b-2 border-purple-100">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                  activeTab === 'upcoming'
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600 -mb-0.5'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📅 Upcoming Bookings ({upcomingBookings.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                  activeTab === 'past'
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600 -mb-0.5'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📋 Past Bookings ({pastBookings.length})
              </button>
            </div>

            {/* Bookings List */}
            <div className="p-6">
              {activeTab === 'upcoming' && (
                <>
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">No upcoming bookings in this period</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingBookings.slice(0, 10).map((booking: any) => (
                        <div
                          key={booking.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl gap-4"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">👤</span>
                              <span className="font-bold text-gray-900">{booking.guest_name}</span>
                              <span className="px-2 py-0.5 text-xs font-semibold bg-green-200 text-green-800 rounded-full">
                                {booking.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{booking.guest_email}</p>
                            <p className="text-sm text-purple-700 font-medium mt-1">
                              {booking.event_types?.title || 'Event'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {formatInTimeZone(parseISO(booking.start_time), profile?.time_zone || 'UTC', 'MMM d, yyyy')}
                            </p>
                            <p className="text-sm text-purple-600 font-medium">
                              {formatInTimeZone(parseISO(booking.start_time), profile?.time_zone || 'UTC', 'h:mm a')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {booking.event_types?.duration || 30} min
                            </p>
                          </div>
                        </div>
                      ))}
                      {upcomingBookings.length > 10 && (
                        <p className="text-center text-sm text-gray-500 pt-2">
                          And {upcomingBookings.length - 10} more upcoming bookings...
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'past' && (
                <>
                  {pastBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">No past bookings in this period</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastBookings.slice(0, 10).map((booking: any) => (
                        <div
                          key={booking.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl gap-4 ${
                            booking.status === 'cancelled'
                              ? 'bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200'
                              : 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">👤</span>
                              <span className="font-bold text-gray-900">{booking.guest_name}</span>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                booking.status === 'cancelled'
                                  ? 'bg-red-200 text-red-800'
                                  : booking.status === 'completed'
                                  ? 'bg-blue-200 text-blue-800'
                                  : 'bg-gray-200 text-gray-800'
                              }`}>
                                {booking.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{booking.guest_email}</p>
                            <p className="text-sm text-purple-700 font-medium mt-1">
                              {booking.event_types?.title || 'Event'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {formatInTimeZone(parseISO(booking.start_time), profile?.time_zone || 'UTC', 'MMM d, yyyy')}
                            </p>
                            <p className="text-sm text-gray-600 font-medium">
                              {formatInTimeZone(parseISO(booking.start_time), profile?.time_zone || 'UTC', 'h:mm a')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {booking.event_types?.duration || 30} min
                            </p>
                          </div>
                        </div>
                      ))}
                      {pastBookings.length > 10 && (
                        <p className="text-center text-sm text-gray-500 pt-2">
                          And {pastBookings.length - 10} more past bookings...
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* CSV & PDF Export */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border-2 border-purple-200">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-bold text-purple-900">📥 Export Data</h3>
                <p className="text-sm text-purple-700 mt-1">Download analytics data as CSV or PDF</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* CSV Export Button */}
                <button
                  onClick={() => {
                    // Create CSV content
                    const headers = ['Date', 'Time', 'Guest Name', 'Guest Email', 'Event Type', 'Status', 'Duration'];
                    const rows = bookingsData.map(booking => [
                      format(new Date(booking.start_time), 'yyyy-MM-dd'),
                      format(new Date(booking.start_time), 'HH:mm'),
                      booking.guest_name || 'N/A',
                      booking.guest_email || 'N/A',
                      booking.event_types?.title || 'Unknown',
                      booking.status || 'N/A',
                      booking.event_types?.duration ? `${booking.event_types.duration} min` : 'N/A',
                    ]);
                    
                    const csvContent = [headers, ...rows].map(row => 
                      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
                    ).join('\n');
                    
                    // Download CSV
                    const element = document.createElement('a');
                    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
                    element.setAttribute('download', `analytics_${dateRange.start}_to_${dateRange.end}.csv`);
                    element.click();
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV
                </button>
                
                {/* PDF Export Button */}
                <button
                  onClick={() => {
                    generateAnalyticsPDF(
                      {
                        metrics,
                        chartData,
                        eventTypeData,
                        dateRange,
                        userInfo: {
                          name: profile?.full_name || undefined,
                          email: user?.email || undefined,
                        },
                      },
                      bookingsData
                    );
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Download PDF
                </button>
              </div>
              
              {/* Info text */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-800">
                  <strong>PDF Export:</strong> Includes purple-themed header/footer, all metrics, charts data, and detailed booking list with proper formatting.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
