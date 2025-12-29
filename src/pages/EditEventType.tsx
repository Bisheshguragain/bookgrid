import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

const LOCATION_TYPES = [
  { value: 'zoom', label: '🎥 Zoom Meeting' },
  { value: 'google_meet', label: '📹 Google Meet' },
  { value: 'microsoft_teams', label: '💼 Microsoft Teams' },
  { value: 'phone', label: '📞 Phone Call' },
  { value: 'in_person', label: '🏢 In-Person Meeting' },
  { value: 'webex', label: '🌐 Webex' },
  { value: 'skype', label: '💬 Skype' },
  { value: 'custom', label: '✏️ Custom Location' },
] as const;

export function EditEventType() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    location_type: 'zoom' as 'zoom' | 'google_meet' | 'microsoft_teams' | 'phone' | 'in_person' | 'webex' | 'skype' | 'custom',
    location_value: '',
    color: COLORS[0],
    max_attendees: 1,
    is_active: true,
    reminder_offsets: [] as number[],
    date_range_start: '',
    date_range_end: '',
    is_paid: false,
    payment_link: '',
    payment_instructions: 'Please complete payment at least 1 hour before the appointment and email the confirmation/receipt to confirm your booking.',
  });

  // Load existing event type
  useEffect(() => {
    if (!id || !user) return;

    const loadEventType = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('event_types')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Event type not found');
          return;
        }

        setFormData({
          title: data.title,
          description: data.description || '',
          duration: data.duration,
          location_type: data.location_type,
          location_value: data.location_value || '',
          color: data.color,
          max_attendees: data.max_attendees,
          is_active: data.is_active,
          reminder_offsets: data.reminder_offsets || [],
          date_range_start: '',
          date_range_end: '',
          is_paid: data.is_paid || false,
          payment_link: data.payment_link || '',
          payment_instructions: data.payment_instructions || 'Please complete payment at least 1 hour before the appointment and email the confirmation/receipt to confirm your booking.',
        });
      } catch (err) {
        console.error('Error loading event type:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event type');
      } finally {
        setLoading(false);
      }
    };

    loadEventType();
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id) {
      setError('You must be logged in to edit an event type');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('event_types')
        .update({
          title: formData.title,
          description: formData.description || null,
          duration: formData.duration,
          location_type: formData.location_type,
          location_value: formData.location_value || null,
          color: formData.color,
          max_attendees: formData.max_attendees,
          is_active: formData.is_active,
          reminder_offsets: formData.reminder_offsets,
          is_paid: formData.is_paid,
          payment_link: formData.is_paid ? formData.payment_link : null,
          payment_instructions: formData.is_paid ? formData.payment_instructions : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Navigate back to event types list
      navigate('/app/event-types');
    } catch (err) {
      console.error('Error updating event type:', err);
      setError(err instanceof Error ? err.message : 'Failed to update event type');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/app/event-types');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-sm text-red-800 mb-4">{error}</p>
          <button
            onClick={() => navigate('/app/event-types')}
            className="btn-primary"
          >
            Back to Event Types
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Event Type</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update your event type settings
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {error && formData.title && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Event Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="30 Minute Meeting"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Describe what this meeting is about..."
          />
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes) *
          </label>
          <select
            id="duration"
            required
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        {/* Location Type */}
        <div>
          <label htmlFor="location_type" className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <select
            id="location_type"
            required
            value={formData.location_type}
            onChange={(e) => setFormData({ ...formData, location_type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {LOCATION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location Value (if custom) */}
        {formData.location_type === 'custom' && (
          <div>
            <label htmlFor="location_value" className="block text-sm font-medium text-gray-700 mb-2">
              Location Details
            </label>
            <input
              type="text"
              id="location_value"
              value={formData.location_value}
              onChange={(e) => setFormData({ ...formData, location_value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Meeting link or address"
            />
          </div>
        )}

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-10 h-10 rounded-full transition-all ${
                  formData.color === color ? 'ring-4 ring-offset-2 ring-gray-400' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Max Attendees */}
        <div>
          <label htmlFor="max_attendees" className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Attendees *
          </label>
          <input
            type="number"
            id="max_attendees"
            required
            min={1}
            max={100}
            value={formData.max_attendees}
            onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Date Range Availability */}
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">📅 Date Range Availability (Optional)</h3>
            <p className="text-xs text-gray-600 mb-3">Set a specific date range when this event type is available for booking</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date_range_start" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="date_range_start"
                value={formData.date_range_start}
                onChange={(e) => setFormData({ ...formData, date_range_start: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">When bookings can start</p>
            </div>
            
            <div>
              <label htmlFor="date_range_end" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="date_range_end"
                value={formData.date_range_end}
                onChange={(e) => setFormData({ ...formData, date_range_end: e.target.value })}
                min={formData.date_range_start || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">When bookings end</p>
            </div>
          </div>
          
          {formData.date_range_start && formData.date_range_end && (
            <div className="bg-white p-3 rounded border border-blue-300">
              <p className="text-sm text-blue-900">
                ✓ This event type will only be available from{' '}
                <strong>{new Date(formData.date_range_start).toLocaleDateString()}</strong> to{' '}
                <strong>{new Date(formData.date_range_end).toLocaleDateString()}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Reminder Offsets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Reminders
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.reminder_offsets.includes(15)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      reminder_offsets: [...formData.reminder_offsets, 15].sort((a, b) => a - b),
                    });
                  } else {
                    setFormData({
                      ...formData,
                      reminder_offsets: formData.reminder_offsets.filter(o => o !== 15),
                    });
                  }
                }}
                className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">15 minutes before</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.reminder_offsets.includes(60)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      reminder_offsets: [...formData.reminder_offsets, 60].sort((a, b) => a - b),
                    });
                  } else {
                    setFormData({
                      ...formData,
                      reminder_offsets: formData.reminder_offsets.filter(o => o !== 60),
                    });
                  }
                }}
                className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">1 hour before</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.reminder_offsets.includes(1440)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      reminder_offsets: [...formData.reminder_offsets, 1440].sort((a, b) => a - b),
                    });
                  } else {
                    setFormData({
                      ...formData,
                      reminder_offsets: formData.reminder_offsets.filter(o => o !== 1440),
                    });
                  }
                }}
                className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">1 day before</span>
            </label>
          </div>
        </div>

        {/* Payment Section */}
        <div className="space-y-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
          <div>
            <h3 className="text-base font-semibold text-green-900 mb-2">💳 Payment Settings</h3>
            <p className="text-sm text-green-700">Configure whether this meeting requires payment</p>
          </div>

          {/* Free/Paid Toggle */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-green-200">
            <div>
              <label htmlFor="is_paid" className="block text-sm font-semibold text-gray-900">
                💰 Paid Meeting
              </label>
              <p className="text-sm text-gray-600 mt-1">Require payment before booking</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_paid: !formData.is_paid })}
              className={`w-14 h-7 rounded-full transition-colors relative ${
                formData.is_paid ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-1 shadow-md ${
                formData.is_paid ? 'translate-x-8' : 'translate-x-1'
              }`}></div>
            </button>
          </div>

          {/* Payment Details - Only show if paid */}
          {formData.is_paid && (
            <>
              <div>
                <label htmlFor="payment_link" className="block text-sm font-semibold text-gray-900 mb-2">
                  Payment Details <span className="text-green-600">*</span>
                </label>
                <textarea
                  id="payment_link"
                  required={formData.is_paid}
                  rows={4}
                  value={formData.payment_link}
                  onChange={(e) => setFormData({ ...formData, payment_link: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none bg-white font-mono text-sm"
                  placeholder="Enter payment link OR bank details:&#10;&#10;Examples:&#10;- Payment Link: https://paypal.me/yourname/50&#10;- Stripe Link: https://buy.stripe.com/xyz&#10;- Bank Transfer:&#10;  Account Name: Your Name&#10;  Sort Code: 12-34-56&#10;  Account Number: 12345678&#10;  Reference: [Booking ID]"
                />
                <p className="mt-2 text-xs text-gray-600">
                  Add your payment link (PayPal, Stripe, Square, GoCardless) OR your bank details for direct transfer
                </p>
              </div>

              <div>
                <label htmlFor="payment_instructions" className="block text-sm font-semibold text-gray-900 mb-2">
                  Payment Instructions <span className="text-green-600">*</span>
                </label>
                <textarea
                  id="payment_instructions"
                  rows={4}
                  required={formData.is_paid}
                  value={formData.payment_instructions}
                  onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none bg-white"
                  placeholder="E.g., Please complete payment at least 1 hour before the appointment and email the confirmation/receipt to payments@yourcompany.com"
                />
                <p className="mt-2 text-xs text-gray-600">Instructions for how and when to make payment</p>
              </div>

              <div className="bg-white p-4 rounded-xl border-2 border-green-300 shadow-sm">
                <p className="text-sm text-green-900 font-medium mb-2">
                  💡 Payment Details Tips:
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Add payment links (PayPal, Stripe, Square, GoCardless, etc.)</li>
                  <li>OR provide bank account details for direct transfer</li>
                  <li>Include clear instructions and payment deadline</li>
                  <li>Payment details will be shown on booking page and in all emails</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">
              Active
            </label>
            <p className="text-sm text-gray-500">Event type is available for booking</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              formData.is_active ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
              formData.is_active ? 'translate-x-7' : 'translate-x-1'
            }`}></div>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
