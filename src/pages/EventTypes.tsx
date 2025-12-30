import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import type { EventType } from '../lib/database.types';
import { generateBookingUrl, generateEmbedCode } from '../utils/datetime';
import { BookAMeet } from './BookAMeet';

// Tab types for the Event Types page
type EventTypesTab = 'my-events' | 'book-a-meet';

export function EventTypes() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EventTypesTab>('my-events');

  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const loadEventTypes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('event_types')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading event types:', error);
          throw error;
        }
        
        setEventTypes(data || []);
      } catch (error) {
        console.error('Error loading event types:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEventTypes();
  }, [user]);

  const toggleEventType = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('event_types')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setEventTypes(prev => prev.map(et => 
        et.id === id ? { ...et, is_active: !currentStatus } : et
      ));
    } catch (error) {
      console.error('Error toggling event type:', error);
    }
  };

  const deleteEventType = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event type?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('event_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setEventTypes(prev => prev.filter(et => et.id !== id));
    } catch (error) {
      console.error('Error deleting event type:', error);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">📅 Event Types</h1>
            <p className="text-purple-100 text-lg">
              Create and manage your available event types
            </p>
          </div>
          {activeTab === 'my-events' && (
            <Link
              to="/app/event-types/new"
              className="px-6 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event Type
            </Link>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-purple-100 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('my-events')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'my-events'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            My Event Types
          </button>
          <button
            onClick={() => setActiveTab('book-a-meet')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'book-a-meet'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Book a Meet
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'book-a-meet' ? (
        <BookAMeet />
      ) : (
        <>
          {/* Event Types Grid */}
          {eventTypes.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-lg border-2 border-purple-100">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No event types yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">Get started by creating your first event type to allow people to book time with you</p>
          <Link
            to="/app/event-types/new"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event Type
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventTypes.map((eventType) => (
            <div key={eventType.id} className="bg-white rounded-xl p-6 space-y-4 shadow-lg border-2 border-purple-100 hover:border-purple-300 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-5 h-5 rounded-full shadow-md" 
                    style={{ backgroundColor: eventType.color }}
                  ></div>
                  <div>
                    <h3 className="font-bold text-gray-900">{eventType.title}</h3>
                    <p className="text-sm text-gray-600">⏱️ {eventType.duration} minutes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleEventType(eventType.id, eventType.is_active)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      eventType.is_active ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-1 shadow-md ${
                      eventType.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
              </div>

              {/* Description */}
              {eventType.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {eventType.description}
                </p>
              )}

              {/* Details */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {eventType.location_type}
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Max {eventType.max_attendees}
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t-2 border-purple-100">
                {/* Booking Link */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">🔗 Booking Link</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={generateBookingUrl(eventType.id)}
                      readOnly
                      className="flex-1 text-xs bg-purple-50 border-2 border-purple-200 rounded-lg px-3 py-2 font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(generateBookingUrl(eventType.id), eventType.id)}
                      className="text-sm text-purple-600 hover:text-purple-700 font-semibold px-3 py-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all"
                    >
                      {copiedId === eventType.id ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Embed Code */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">📦 Embed Code</label>
                  <div className="flex items-center space-x-2">
                    <textarea
                      value={generateEmbedCode(eventType.id)}
                      readOnly
                      rows={2}
                      className="flex-1 text-xs bg-purple-50 border-2 border-purple-200 rounded-lg px-3 py-2 resize-none font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(generateEmbedCode(eventType.id), `embed-${eventType.id}`)}
                      className="text-sm text-purple-600 hover:text-purple-700 font-semibold px-3 py-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all"
                    >
                      {copiedId === `embed-${eventType.id}` ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3">
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/app/event-types/${eventType.id}/edit`}
                      className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      ✏️ Edit
                    </Link>
                    <button
                      onClick={() => deleteEventType(eventType.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-semibold"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                    eventType.is_active 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {eventType.is_active ? '🟢 Active' : '⚫ Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
