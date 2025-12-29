import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { canCreateEventType, getUserSubscription, type SubscriptionInfo } from '../services/subscriptionService';
import { UpgradePrompt, LimitReachedBanner } from '../components/subscription/UpgradePrompt';

const COLORS = [
  '#A855F7', // purple
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F97316', // orange
  '#10B981', // green
  '#3B82F6', // blue
  '#14B8A6', // teal
  '#EF4444', // red
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

const MEETING_TYPES = [
  { 
    value: 'one-to-one', 
    label: 'One-to-One', 
    icon: '👤',
    description: 'Individual meeting with one person'
  },
  { 
    value: 'group', 
    label: 'Group', 
    icon: '👥',
    description: 'Meeting with multiple participants'
  },
] as const;

export function CreateEventType() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    meeting_type: 'one-to-one' as 'one-to-one' | 'group',
    location_type: 'zoom' as 'zoom' | 'google_meet' | 'microsoft_teams' | 'phone' | 'in_person' | 'webex' | 'skype' | 'custom',
    location_value: '',
    color: COLORS[0],
    max_attendees: 1,
    is_active: true,
    reminder_offsets: [15, 60], // 15 mins and 1 hour before
    date_range_start: '', // NEW: Start date for availability
    date_range_end: '', // NEW: End date for availability
    is_paid: false, // NEW: Whether this meeting requires payment
    payment_link: '', // NEW: Payment details (link or bank details)
    payment_instructions: 'Please complete payment at least 1 hour before the appointment and email the confirmation/receipt to confirm your booking.', // NEW: Payment instructions
  });

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;

      const data = await getUserSubscription(user.id);
      if (data) {
        setSubscription(data);
      }
    };

    fetchSubscription();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create an event type');
      return;
    }

    // Check if user can create event type
    const canCreate = await canCreateEventType(user.id);
    if (!canCreate.allowed) {
      setShowUpgradePrompt(true);
      setError(canCreate.reason || 'Cannot create event type');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('event_types')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          duration: formData.duration,
          location_type: formData.location_type,
          location_value: formData.location_value || null,
          color: formData.color,
          max_attendees: formData.max_attendees,
          is_active: formData.is_active,
          reminder_offsets: formData.reminder_offsets,
          date_range_start: formData.date_range_start || null,
          date_range_end: formData.date_range_end || null,
          is_paid: formData.is_paid,
          payment_link: formData.is_paid ? formData.payment_link : null,
          payment_instructions: formData.is_paid ? formData.payment_instructions : null,
        })
        .select();

      if (insertError) {
        console.error('Error creating event type:', insertError);
        
        // Create detailed error message
        let detailedError = insertError.message;
        if (insertError.details) detailedError += ` | Details: ${insertError.details}`;
        if (insertError.hint) detailedError += ` | Hint: ${insertError.hint}`;
        if (insertError.code) detailedError += ` | Code: ${insertError.code}`;
        
        setError(detailedError);
        return;
      }

      // Navigate back to event types list
      navigate('/app/event-types');
    } catch (err) {
      console.error('Error creating event type:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event type';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/app/event-types');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && subscription && (
        <UpgradePrompt
          feature="event types"
          currentLimit={subscription.limits.max_event_types}
          planName={subscription.plan}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}

      {/* Subscription Limit Banner */}
      {subscription && !subscription.can_create_event_type && (
        <LimitReachedBanner
          message={`You've reached the maximum of ${subscription.limits.max_event_types} event type${subscription.limits.max_event_types !== 1 ? 's' : ''} for the ${subscription.plan} plan.`}
          current={subscription.limits.current_event_types}
          limit={subscription.limits.max_event_types}
          onUpgrade={() => navigate('/app/pricing')}
        />
      )}

      {/* Header with Purple Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">✨ Create Event Type</h1>
        <p className="text-purple-100 text-lg">
          Set up a new event type that people can book
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-lg border-2 border-purple-100 space-y-8">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
            Event Title <span className="text-purple-600">*</span>
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            placeholder="e.g., 30 Minute Consultation"
          />
          <p className="mt-2 text-xs text-gray-500">Give your event a clear, descriptive name</p>
        </div>

        {/* Meeting Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Meeting Type <span className="text-purple-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MEETING_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setFormData({ 
                    ...formData, 
                    meeting_type: type.value,
                    // Set max_attendees to 1 for one-to-one, keep current value for group
                    max_attendees: type.value === 'one-to-one' ? 1 : formData.max_attendees > 1 ? formData.max_attendees : 2
                  });
                }}
                className={`p-5 rounded-xl border-2 text-left transition-all ${
                  formData.meeting_type === type.value
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{type.icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold text-base mb-1 ${
                      formData.meeting_type === type.value ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      {type.label}
                    </p>
                    <p className={`text-sm ${
                      formData.meeting_type === type.value ? 'text-purple-700' : 'text-gray-600'
                    }`}>
                      {type.description}
                    </p>
                  </div>
                  {formData.meeting_type === type.value && (
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
            placeholder="Describe what this meeting is about..."
          />
          <p className="mt-2 text-xs text-gray-500">Help attendees understand what to expect</p>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-semibold text-gray-900 mb-2">
            Duration <span className="text-purple-600">*</span>
          </label>
          <select
            id="duration"
            required
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          >
            <option value={15}>⏱️ 15 minutes</option>
            <option value={30}>⏱️ 30 minutes</option>
            <option value={45}>⏱️ 45 minutes</option>
            <option value={60}>⏱️ 1 hour</option>
            <option value={90}>⏱️ 1.5 hours</option>
            <option value={120}>⏱️ 2 hours</option>
          </select>
        </div>

        {/* Location Type */}
        <div>
          <label htmlFor="location_type" className="block text-sm font-semibold text-gray-900 mb-2">
            Location <span className="text-purple-600">*</span>
          </label>
          <select
            id="location_type"
            required
            value={formData.location_type}
            onChange={(e) => setFormData({ ...formData, location_type: e.target.value as any })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
            <label htmlFor="location_value" className="block text-sm font-semibold text-gray-900 mb-2">
              Location Details
            </label>
            <input
              type="text"
              id="location_value"
              value={formData.location_value}
              onChange={(e) => setFormData({ ...formData, location_value: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="Meeting link or address"
            />
          </div>
        )}

        {/* Color */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Event Color 🎨
          </label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-12 h-12 rounded-full transition-all ${
                  formData.color === color ? 'ring-4 ring-offset-2 ring-purple-400' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">Choose a color for your calendar events</p>
        </div>

        {/* Max Attendees - Only show for Group meetings */}
        {formData.meeting_type === 'group' && (
          <div>
            <label htmlFor="max_attendees" className="block text-sm font-semibold text-gray-900 mb-2">
              Maximum Attendees <span className="text-purple-600">*</span>
            </label>
            <input
              type="number"
              id="max_attendees"
              required
              min={2}
              max={100}
              value={formData.max_attendees}
              onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) || 2 })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
            <p className="mt-2 text-xs text-gray-500">How many people can attend this group meeting (minimum 2)</p>
          </div>
        )}

        {/* Date Range Availability */}
        <div className="space-y-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
          <div>
            <h3 className="text-base font-semibold text-purple-900 mb-2">📅 Date Range Availability (Optional)</h3>
            <p className="text-sm text-purple-700">Set a specific date range when this event type is available for booking</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date_range_start" className="block text-sm font-semibold text-gray-900 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="date_range_start"
                value={formData.date_range_start}
                onChange={(e) => setFormData({ ...formData, date_range_start: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
              />
              <p className="text-xs text-gray-600 mt-1">When bookings can start</p>
            </div>
            
            <div>
              <label htmlFor="date_range_end" className="block text-sm font-semibold text-gray-900 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="date_range_end"
                value={formData.date_range_end}
                onChange={(e) => setFormData({ ...formData, date_range_end: e.target.value })}
                min={formData.date_range_start || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
              />
              <p className="text-xs text-gray-600 mt-1">When bookings end</p>
            </div>
          </div>
          
          {formData.date_range_start && formData.date_range_end && (
            <div className="bg-white p-4 rounded-xl border-2 border-purple-300 shadow-sm">
              <p className="text-sm text-purple-900 font-medium">
                ✓ This event type will only be available from{' '}
                <strong>{new Date(formData.date_range_start).toLocaleDateString()}</strong> to{' '}
                <strong>{new Date(formData.date_range_end).toLocaleDateString()}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Reminder Offsets */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            📧 Email Reminders
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-all cursor-pointer">
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
                className="mr-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
              />
              <span className="text-sm font-medium text-gray-700">15 minutes before</span>
            </label>
            <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-all cursor-pointer">
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
                className="mr-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
              />
              <span className="text-sm font-medium text-gray-700">1 hour before</span>
            </label>
            <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-all cursor-pointer">
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
                className="mr-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
              />
              <span className="text-sm font-medium text-gray-700">1 day before</span>
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
        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
          <div>
            <label htmlFor="is_active" className="block text-sm font-semibold text-gray-900">
              🟢 Active Status
            </label>
            <p className="text-sm text-gray-600 mt-1">Event type is available for booking</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
            className={`w-14 h-7 rounded-full transition-colors relative ${
              formData.is_active ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-1 shadow-md ${
              formData.is_active ? 'translate-x-8' : 'translate-x-1'
            }`}></div>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t-2 border-purple-100">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? '✨ Creating...' : '✨ Create Event Type'}
          </button>
        </div>
      </form>
    </div>
  );
}
