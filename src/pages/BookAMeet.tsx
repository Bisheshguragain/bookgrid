import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import type { EventType, Contact } from '../lib/database.types';
import { format, addMinutes, addDays } from 'date-fns';
import { sendBookingConfirmation, sendBookingNotificationToHost } from '../services/emailService';
import { getContacts, createContact } from '../services/contactsService';

export function BookAMeet() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    event_type_id: '',
    prospect_name: '',
    prospect_email: '',
    meeting_date: '',
    meeting_time: '',
    notes: '',
    send_invitation: true,
  });

  const [contactMode, setContactMode] = useState<'existing' | 'new'>('existing');
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  // Load user's event types and contacts
  useEffect(() => {
    if (!user) return;

    const loadEventTypes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('event_types')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('title', { ascending: true });

        if (error) throw error;
        setEventTypes(data || []);
      } catch (error) {
        console.error('Error loading event types:', error);
        setError('Failed to load event types');
      } finally {
        setLoading(false);
      }
    };

    const loadContacts = async () => {
      try {
        const contactData = await getContacts(user.id);
        setContacts(contactData);
      } catch (error) {
        console.error('Error loading contacts:', error);
        setContacts([]);
      }
    };

    loadEventTypes();
    loadContacts();
  }, [user]);

  // Auto-fill form data when contact is selected
  useEffect(() => {
    if (contactMode === 'existing' && selectedContactId) {
      const contact = contacts.find(c => c.id === selectedContactId);
      if (contact) {
        setFormData(prev => ({ ...prev, prospect_name: contact.full_name, prospect_email: contact.email }));
      }
    }
    if (contactMode === 'new') {
      setFormData(prev => ({ ...prev, prospect_name: '', prospect_email: '' }));
    }
  }, [contactMode, selectedContactId, contacts]);

  const validateForm = () => {
    if (!formData.event_type_id) {
      setError('Please select an event type');
      return false;
    }
    if (!formData.prospect_name || formData.prospect_name.length < 2) {
      setError('Please enter prospect name (minimum 2 characters)');
      return false;
    }
    if (!formData.prospect_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.prospect_email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.meeting_date) {
      setError('Please select a meeting date');
      return false;
    }
    if (!formData.meeting_time) {
      setError('Please select a meeting time');
      return false;
    }

    // Check if meeting is in the past
    const meetingDateTime = new Date(`${formData.meeting_date}T${formData.meeting_time}`);
    if (meetingDateTime < new Date()) {
      setError('Meeting time cannot be in the past');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm() || !user) return;

    setSubmitting(true);

    try {
      // Get selected event type details
      const selectedEventType = eventTypes.find(et => et.id === formData.event_type_id);
      if (!selectedEventType) {
        throw new Error('Event type not found');
      }

      // Create meeting date/time
      const startTime = new Date(`${formData.meeting_date}T${formData.meeting_time}`);
      const endTime = addMinutes(startTime, selectedEventType.duration);

      // Generate unique tokens for reschedule/cancel
      const rescheduleToken = crypto.randomUUID();
      const cancelToken = crypto.randomUUID();

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          event_type_id: formData.event_type_id,
          guest_name: formData.prospect_name,
          guest_email: formData.prospect_email,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          guest_time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          status: 'confirmed',
          notes: formData.notes || null,
          reschedule_token: rescheduleToken,
          cancel_token: cancelToken,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create reminders if specified in event type
      if (selectedEventType.reminder_offsets && selectedEventType.reminder_offsets.length > 0) {
        const reminderInserts = selectedEventType.reminder_offsets.map(offset => ({
          booking_id: booking.id,
          user_id: user.id,
          reminder_offset_minutes: offset,
          scheduled_at: addMinutes(startTime, -offset).toISOString(),
          status: 'pending' as const,
        }));

        const { error: reminderError } = await supabase
          .from('reminders')
          .insert(reminderInserts);

        if (reminderError) {
          console.error('Error creating reminders:', reminderError);
          // Don't fail the whole operation if reminders fail
        }
      }

      // Send invitation email (using email service)
      if (formData.send_invitation) {
        try {
          // Get host profile for email
          const { data: hostProfile } = await supabase
            .from('users_profile')
            .select('*')
            .eq('id', user.id)
            .single();

          if (hostProfile) {
            // Send confirmation email to prospect (includes payment info for paid meetings)
            await sendBookingConfirmation(
              booking,
              selectedEventType,
              formData.prospect_email,
              formData.prospect_name,
              hostProfile
            );

            // Send notification to host
            await sendBookingNotificationToHost(
              booking,
              selectedEventType,
              formData.prospect_name,
              formData.prospect_email,
              hostProfile
            );
          }
        } catch (emailError) {
          console.error('Error sending invitation emails:', emailError);
          // Don't fail the whole operation if email fails
          setError('Meeting booked successfully, but there was an issue sending the invitation email.');
        }
      }

      // Save new contact if in 'new' mode and not already in contacts
      if (contactMode === 'new' && contacts.every(c => c.email !== formData.prospect_email)) {
        await createContact(user.id, {
          full_name: formData.prospect_name,
          email: formData.prospect_email,
          phone_number: '',
        });
      }

      setSuccessMessage(`Meeting booked successfully with ${formData.prospect_name}!${formData.send_invitation ? ' Invitation email sent.' : ''}`);
      
      // Reset form
      setFormData({
        event_type_id: '',
        prospect_name: '',
        prospect_email: '',
        meeting_date: '',
        meeting_time: '',
        notes: '',
        send_invitation: true,
      });
      setContactMode('existing');
      setSelectedContactId('');

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Error booking meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to book meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const quickDateOptions = [
    { label: 'Tomorrow', days: 1 },
    { label: 'In 2 Days', days: 2 },
    { label: 'In 3 Days', days: 3 },
    { label: 'Next Week', days: 7 },
  ];

  const quickTimeOptions = [
    { label: '9:00 AM', time: '09:00' },
    { label: '10:00 AM', time: '10:00' },
    { label: '11:00 AM', time: '11:00' },
    { label: '2:00 PM', time: '14:00' },
    { label: '3:00 PM', time: '15:00' },
    { label: '4:00 PM', time: '16:00' },
  ];

  const setQuickDate = (days: number) => {
    const date = addDays(new Date(), days);
    setFormData(prev => ({ ...prev, meeting_date: format(date, 'yyyy-MM-dd') }));
  };

  const setQuickTime = (time: string) => {
    setFormData(prev => ({ ...prev, meeting_time: time }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Purple Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">📅 Book a Meeting</h1>
        <p className="text-purple-100 text-lg">
          Proactively schedule meetings with prospects and send invitations
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm text-green-800 font-semibold">{successMessage}</p>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="text-sm text-green-700 hover:text-green-900 underline mt-2"
            >
              View on Dashboard →
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">About Book a Meeting</h3>
            <p className="text-sm text-blue-800">
              Use this feature to proactively book meetings with prospects. Select an event type, enter prospect details, 
              choose a date and time, and optionally send an email invitation. The prospect will receive a calendar invite 
              with meeting details and options to reschedule or cancel.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-lg border-2 border-purple-100 space-y-8">
        {/* Event Type Selection */}
        <div>
          <label htmlFor="event_type" className="block text-sm font-semibold text-gray-900 mb-2">
            Event Type <span className="text-purple-600">*</span>
          </label>
          {eventTypes.length === 0 ? (
            <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800">
                You don't have any active event types. Please{' '}
                <button
                  type="button"
                  onClick={() => navigate('/app/event-types/new')}
                  className="font-semibold underline hover:text-yellow-900"
                >
                  create one first
                </button>
                .
              </p>
            </div>
          ) : (
            <select
              id="event_type"
              value={formData.event_type_id}
              onChange={(e) => setFormData({ ...formData, event_type_id: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              required
            >
              <option value="">Select an event type...</option>
              {eventTypes.map((eventType) => (
                <option key={eventType.id} value={eventType.id}>
                  {eventType.title} ({eventType.duration} min)
                </option>
              ))}
            </select>
          )}
          <p className="mt-2 text-xs text-gray-500">Choose which type of meeting you want to book</p>
        </div>

        {/* Payment Information - Show if selected event type is paid */}
        {formData.event_type_id && eventTypes.find(et => et.id === formData.event_type_id)?.is_paid && (
          <div className="space-y-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-2">💳 This is a Paid Meeting</p>
                
                {/* Payment Details */}
                {eventTypes.find(et => et.id === formData.event_type_id)?.payment_link && (
                  <div className="mb-3 p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-800 mb-2">Payment Details for Prospect:</p>
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {eventTypes.find(et => et.id === formData.event_type_id)?.payment_link}
                    </pre>
                  </div>
                )}
                
                {/* Payment Instructions */}
                <p className="text-sm text-green-800 mb-3">
                  <strong>Instructions:</strong> {eventTypes.find(et => et.id === formData.event_type_id)?.payment_instructions || 'Please complete payment at least 1 hour before the appointment and email the confirmation/receipt to confirm your booking.'}
                </p>
                
                <div className="bg-white p-3 rounded-lg border border-green-300">
                  <p className="text-xs text-green-900 font-semibold mb-1">ℹ️ Important:</p>
                  <p className="text-xs text-green-800">
                    The prospect will receive payment details in their invitation email. They must complete payment before the meeting as per your instructions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prospect Details */}
        <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
          <h3 className="text-base font-semibold text-purple-900">👤 Prospect Information</h3>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Select Contact</label>
            <div className="flex gap-3">
              <select
                value={contactMode === 'existing' ? selectedContactId : ''}
                onChange={e => {
                  if (e.target.value === 'new') {
                    setContactMode('new');
                    setSelectedContactId('');
                  } else {
                    setContactMode('existing');
                    setSelectedContactId(e.target.value);
                  }
                }}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
              >
                <option value="">Select from contacts...</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>{contact.full_name} ({contact.email})</option>
                ))}
                <option value="new">➕ Add new contact</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prospect_name" className="block text-sm font-semibold text-gray-900 mb-2">
                Prospect Name <span className="text-purple-600">*</span>
              </label>
              <input
                type="text"
                id="prospect_name"
                value={formData.prospect_name}
                onChange={(e) => setFormData({ ...formData, prospect_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                placeholder="John Doe"
                required
                disabled={contactMode === 'existing'}
              />
            </div>
            <div>
              <label htmlFor="prospect_email" className="block text-sm font-semibold text-gray-900 mb-2">
                Prospect Email <span className="text-purple-600">*</span>
              </label>
              <input
                type="email"
                id="prospect_email"
                value={formData.prospect_email}
                onChange={(e) => setFormData({ ...formData, prospect_email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                placeholder="john@company.com"
                required
                disabled={contactMode === 'existing'}
              />
            </div>
          </div>
        </div>

        {/* Date & Time Selection */}
        <div className="space-y-6">
          <h3 className="text-base font-semibold text-gray-900">📆 Schedule Meeting</h3>
          
          {/* Quick Date Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Quick Date Selection
            </label>
            <div className="flex flex-wrap gap-3">
              {quickDateOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setQuickDate(option.days)}
                  className="px-4 py-2 text-sm font-semibold bg-purple-50 text-purple-700 border-2 border-purple-200 rounded-xl hover:bg-purple-100 transition-all"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="meeting_date" className="block text-sm font-semibold text-gray-900 mb-2">
                Meeting Date <span className="text-purple-600">*</span>
              </label>
              <input
                type="date"
                id="meeting_date"
                value={formData.meeting_date}
                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
              />
            </div>
            
            <div>
              <label htmlFor="meeting_time" className="block text-sm font-semibold text-gray-900 mb-2">
                Meeting Time <span className="text-purple-600">*</span>
              </label>
              <input
                type="time"
                id="meeting_time"
                value={formData.meeting_time}
                onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Quick Time Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Quick Time Selection
            </label>
            <div className="flex flex-wrap gap-3">
              {quickTimeOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setQuickTime(option.time)}
                  className="px-4 py-2 text-sm font-semibold bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-all"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
            Meeting Notes (Optional)
          </label>
          <textarea
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
            placeholder="Add any notes about this meeting (visible to you only)..."
          />
        </div>

        {/* Send Invitation Toggle */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
          <div>
            <label htmlFor="send_invitation" className="block text-sm font-semibold text-green-900">
              📧 Send Email Invitation
            </label>
            <p className="text-sm text-green-700 mt-1">
              Automatically send a calendar invitation to the prospect
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, send_invitation: !formData.send_invitation })}
            className={`w-14 h-7 rounded-full transition-colors relative ${
              formData.send_invitation ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-1 shadow-md ${
              formData.send_invitation ? 'translate-x-8' : 'translate-x-1'
            }`}></div>
          </button>
        </div>

        {/* Preview */}
        {formData.event_type_id && formData.meeting_date && formData.meeting_time && (
          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
            <h3 className="text-sm font-semibold text-purple-900 mb-3">📋 Meeting Preview</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <strong>Event:</strong> {eventTypes.find(et => et.id === formData.event_type_id)?.title}
              </p>
              <p className="text-gray-700">
                <strong>Prospect:</strong> {formData.prospect_name || 'Not set'} ({formData.prospect_email || 'No email'})
              </p>
              <p className="text-gray-700">
                <strong>Date:</strong> {format(new Date(formData.meeting_date), 'MMMM d, yyyy')}
              </p>
              <p className="text-gray-700">
                <strong>Time:</strong> {formData.meeting_time}
              </p>
              <p className="text-gray-700">
                <strong>Duration:</strong> {eventTypes.find(et => et.id === formData.event_type_id)?.duration} minutes
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t-2 border-purple-100">
          <button
            type="button"
            onClick={() => navigate('/app/dashboard')}
            className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || eventTypes.length === 0}
          >
            {submitting ? '📅 Booking...' : '📅 Book Meeting'}
          </button>
        </div>
      </form>
    </div>
  );
}
