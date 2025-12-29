import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { formatDateTime } from '../utils/datetime';

export function Reminders() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, profile } = useAuthStore();

  // Load reminders with booking details
  const loadReminders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          bookings(
            id,
            guest_name,
            guest_email,
            start_time,
            user_id,
            event_types(title)
          )
        `)
        .eq('bookings.user_id', user.id)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load reminders on mount - FIX: Use useEffect to prevent infinite loop
  useEffect(() => {
    if (user) {
      loadReminders();
    }
  }, [user]); // Only re-run if user changes

  const markAsSent = async (reminderId: string) => {
    try {
      const { error: err } = await supabase
        .from('reminders')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString() 
        })
        .eq('id', reminderId);

      if (err) throw err;
      await loadReminders();
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
    }
  };

  const processAllPendingReminders = async () => {
    const pendingReminders = reminders.filter(r => r.status === 'pending');
    
    if (pendingReminders.length === 0) {
      alert('No pending reminders to process');
      return;
    }

    if (!window.confirm(`Process ${pendingReminders.length} pending reminder(s)?`)) {
      return;
    }

    for (const reminder of pendingReminders) {
      await markAsSent(reminder.id);
    }

    alert(`Processed ${pendingReminders.length} reminders`);
  };

  const filteredReminders = reminders.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  // Calculate stats
  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    sent: reminders.filter(r => r.status === 'sent').length,
    failed: reminders.filter(r => r.status === 'failed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Purple Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔔 Reminders</h1>
            <p className="text-purple-100 text-lg">
              Manage your booking reminders and notifications
            </p>
          </div>
          <button
            onClick={processAllPendingReminders}
            className="px-6 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            ⚡ Process Pending
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
          <p className="text-sm font-semibold text-gray-600 mb-1">📊 Total Reminders</p>
          <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-yellow-100">
          <p className="text-sm font-semibold text-gray-600 mb-1">⏳ Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-100">
          <p className="text-sm font-semibold text-gray-600 mb-1">✅ Sent</p>
          <p className="text-3xl font-bold text-green-600">{stats.sent}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-100">
          <p className="text-sm font-semibold text-gray-600 mb-1">❌ Failed</p>
          <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3">
        {['all', 'pending', 'sent', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
              filter === status
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-purple-100 hover:border-purple-300 hover:bg-purple-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({
              status === 'all' ? stats.total : 
              status === 'pending' ? stats.pending :
              status === 'sent' ? stats.sent :
              stats.failed
            })
          </button>
        ))}
      </div>

      {/* Reminders Table */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-purple-100 overflow-hidden">
        {filteredReminders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No reminders</h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'Create bookings to see reminders' : `No ${filter} reminders`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">👤 Guest</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">📅 Event</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">🕐 Event Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">⏰ Remind Before</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">📆 Scheduled For</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">📊 Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">⚡ Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-purple-100">
                {filteredReminders.map((reminder) => (
                  <tr key={reminder.id} className="hover:bg-purple-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {reminder.bookings?.guest_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {reminder.bookings?.guest_email || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reminder.bookings?.event_types?.title || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reminder.bookings?.start_time ? (
                        formatDateTime(reminder.bookings.start_time, profile?.time_zone)
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {reminder.reminder_offset_minutes} minutes
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(reminder.scheduled_at, profile?.time_zone)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        reminder.status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : reminder.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {reminder.status === 'sent' ? '✅ ' : reminder.status === 'pending' ? '⏳ ' : '❌ '}
                        {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {reminder.status === 'pending' && (
                        <button
                          onClick={() => markAsSent(reminder.id)}
                          className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
                        >
                          📤 Send Now
                        </button>
                      )}
                      {reminder.status === 'sent' && reminder.sent_at && (
                        <span className="text-gray-500 text-xs">
                          ✓ Sent {new Date(reminder.sent_at).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Integration Info */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border-2 border-purple-200">
        <h2 className="text-lg font-bold text-purple-900 mb-4">📧 Email Integration</h2>
        <p className="text-purple-800 mb-4">
          This reminder system is currently in demo mode. In production, reminders would be sent via email to guests.
        </p>
        <div className="bg-white p-5 rounded-xl border-2 border-purple-200 shadow-sm">
          <p className="text-sm text-purple-900 font-bold mb-3">
            🔌 Integration Points:
          </p>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              <span>Supabase Edge Functions → SendGrid/Mailgun API</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              <span>Scheduled via pg_cron or external scheduler</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              <span>Templates: 24h, 1h, and 15m before booking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">•</span>
              <span>Unsubscribe links for guest management</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
