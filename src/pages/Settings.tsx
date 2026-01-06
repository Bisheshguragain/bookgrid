import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getTimeZones } from '../utils/datetime';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/database.types';
import { 
  getUserSubscription, 
  cancelSubscription, 
  downgradeSubscription, 
  reactivateSubscription,
  type SubscriptionInfo 
} from '../services/subscriptionService';

export function Settings() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    full_name: '',
    username: '',
    time_zone: 'Europe/London',
    default_meeting_duration: 30,
    company_name: '', // Add company_name to form state
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionAction, setSubscriptionAction] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState<'free' | 'pro' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { profile, updateProfile, user } = useAuthStore();

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        username: profile.username || '',
        time_zone: profile.time_zone,
        default_meeting_duration: profile.default_meeting_duration,
        company_name: profile.company_name || '', // Load company_name
      });
    }
  }, [profile]);

  // Load subscription data
  useEffect(() => {
    const loadSubscription = async () => {
      if (user) {
        setSubscriptionLoading(true);
        const data = await getUserSubscription(user.id);
        setSubscription(data);
        setSubscriptionLoading(false);
      }
    };
    loadSubscription();
  }, [user]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.full_name || formData.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }
    
    if (formData.username && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (formData.username && !/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    
    if (formData.company_name && formData.company_name.length > 100) {
      newErrors.company_name = 'Company name must be 100 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if username is already taken by another user
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!username || username.length < 3) return true;
    
    setIsCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('id')
        .eq('username', username.toLowerCase())
        .neq('id', profile?.id || '')
        .limit(1);
      
      if (error) {
        console.error('Error checking username:', error);
        return true; // Allow on error, server will catch duplicates
      }
      
      return !data || data.length === 0;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      // Check username availability if it changed
      if (formData.username && formData.username !== profile?.username) {
        const isAvailable = await checkUsernameAvailability(formData.username);
        if (!isAvailable) {
          setErrors({ username: 'This username is already taken. Please choose another.' });
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare update data (exclude avatar_url)
      const updateData = {
        full_name: formData.full_name,
        username: formData.username?.toLowerCase(),
        time_zone: formData.time_zone,
        default_meeting_duration: formData.default_meeting_duration,
        company_name: formData.company_name || null, // Save company_name
      };

      const { error } = await updateProfile(updateData);
      
      if (error) {
        if (error.message.includes('username') || error.message.includes('duplicate') || error.message.includes('unique')) {
          setErrors({ username: 'This username is already taken. Please choose another.' });
        } else {
          setErrors({ api: error.message });
        }
      } else {
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrors({ api: 'An error occurred while updating your profile' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCancelSubscription = async (immediate: boolean = false) => {
    if (!user) return;
    
    setSubscriptionAction('cancel');
    try {
      const result = await cancelSubscription(user.id, immediate);
      if (result.success) {
        setShowCancelModal(false);
        const data = await getUserSubscription(user.id);
        setSubscription(data);
        setSuccessMessage(
          immediate 
            ? 'Subscription cancelled. You are now on the free plan.' 
            : `Subscription will be cancelled on ${new Date(result.effectiveDate!).toLocaleDateString()}`
        );
      } else {
        setErrors({ api: result.error || 'Failed to cancel subscription' });
      }
    } catch (error) {
      setErrors({ api: 'An error occurred while cancelling subscription' });
    } finally {
      setSubscriptionAction(null);
    }
  };

  const handleDowngradeSubscription = async () => {
    if (!user || !selectedDowngradePlan) return;
    
    setSubscriptionAction('downgrade');
    try {
      const result = await downgradeSubscription(user.id, selectedDowngradePlan);
      if (result.success) {
        setShowDowngradeModal(false);
        setSelectedDowngradePlan(null);
        const data = await getUserSubscription(user.id);
        setSubscription(data);
        setSuccessMessage(`Successfully downgraded to ${selectedDowngradePlan} plan`);
      } else {
        setErrors({ api: result.error || 'Failed to downgrade subscription' });
      }
    } catch (error) {
      setErrors({ api: 'An error occurred while downgrading subscription' });
    } finally {
      setSubscriptionAction(null);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!user) return;
    
    setSubscriptionAction('reactivate');
    try {
      const result = await reactivateSubscription(user.id);
      if (result.success) {
        const data = await getUserSubscription(user.id);
        setSubscription(data);
        setSuccessMessage('Subscription reactivated successfully!');
      } else {
        setErrors({ api: result.error || 'Failed to reactivate subscription' });
      }
    } catch (error) {
      setErrors({ api: 'An error occurred while reactivating subscription' });
    } finally {
      setSubscriptionAction(null);
    }
  };

  const timeZones = getTimeZones();
  const durationOptions = [15, 30, 45, 60, 90, 120];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header with Purple Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">⚙️ Settings</h1>
        <p className="text-purple-100 text-lg">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-purple-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">👤 Profile Information</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {successMessage && (
            <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4">
              <div className="text-sm text-green-800 font-medium flex items-center gap-2">
                <span>✅</span> {successMessage}
              </div>
            </div>
          )}

          {errors.api && (
            <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4">
              <div className="text-sm text-red-800 font-medium flex items-center gap-2">
                <span>❌</span> {errors.api}
              </div>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-semibold text-gray-900 mb-2">
              Full Name <span className="text-purple-600">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              required
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.full_name ? 'border-red-500' : 'border-gray-200 focus:border-purple-500'
              }`}
              value={formData.full_name || ''}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
            {errors.full_name && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.full_name}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-900 mb-2">
              Username
              {isCheckingUsername && (
                <span className="ml-2 text-xs text-purple-600">
                  ⏳ Checking availability...
                </span>
              )}
            </label>
            <div className="mt-1 flex rounded-xl shadow-sm">
              <span className="inline-flex items-center px-4 rounded-l-xl border-2 border-r-0 border-gray-200 bg-purple-50 text-purple-700 text-sm font-medium">
                bookagreed.com/
              </span>
              <input
                type="text"
                id="username"
                name="username"
                className={`flex-1 px-4 py-3 border-2 rounded-r-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                  errors.username ? 'border-red-500' : 'border-gray-200 focus:border-purple-500'
                }`}
                value={formData.username || ''}
                onChange={handleChange}
                placeholder="your-username"
              />
            </div>
            {errors.username && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.username}</p>
            )}
            <p className="mt-2 text-sm text-gray-600">
              Your personal booking page will be available at this URL
            </p>
          </div>

          {/* Time Zone */}
          <div>
            <label htmlFor="time_zone" className="block text-sm font-semibold text-gray-900 mb-2">
              Time Zone <span className="text-purple-600">*</span>
            </label>
            <select
              id="time_zone"
              name="time_zone"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              value={formData.time_zone || ''}
              onChange={handleChange}
            >
              {timeZones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-600">
              This will be used as the default time zone for your events
            </p>
          </div>

          {/* Default Meeting Duration */}
          <div>
            <label htmlFor="default_meeting_duration" className="block text-sm font-semibold text-gray-900 mb-2">
              Default Meeting Duration
            </label>
            <select
              id="default_meeting_duration"
              name="default_meeting_duration"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              value={formData.default_meeting_duration || 30}
              onChange={handleChange}
            >
              {durationOptions.map((duration) => (
                <option key={duration} value={duration}>
                  ⏱️ {duration} minutes
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-600">
              This will be the default duration when creating new event types
            </p>
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="company_name" className="block text-sm font-semibold text-gray-900 mb-2">
              Company Name <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.company_name ? 'border-red-500' : 'border-gray-200 focus:border-purple-500'
              }`}
              value={formData.company_name || ''}
              onChange={handleChange}
              placeholder="Enter your company name"
              maxLength={100}
            />
            {errors.company_name && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.company_name}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Subscription Management - NEW SECTION */}
      <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-purple-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">💳 Subscription</h2>
        
        {subscriptionLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : subscription ? (
          <div className="space-y-6">
            {/* Current Plan Display */}
            <div className={`p-6 rounded-xl border-2 ${
              subscription.plan === 'business' ? 'bg-blue-50 border-blue-200' :
              subscription.plan === 'pro' ? 'bg-purple-50 border-purple-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {subscription.plan === 'business' ? '🏢' : subscription.plan === 'pro' ? '⭐' : '🎁'}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 capitalize">
                      {subscription.plan} Plan
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Status: <span className={`font-semibold capitalize ${
                      subscription.status === 'active' ? 'text-green-600' :
                      subscription.status === 'cancelled' ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>{subscription.status}</span>
                  </p>
                </div>
                
                {subscription.plan !== 'free' && (
                  <button
                    onClick={() => navigate('/app/pricing')}
                    className="px-4 py-2 text-sm font-semibold text-purple-600 hover:text-purple-700 border-2 border-purple-200 hover:border-purple-300 rounded-lg transition-colors"
                  >
                    Change Plan
                  </button>
                )}
              </div>
              
              {/* Usage Stats */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/60 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Event Types</p>
                  <p className="text-lg font-bold text-gray-900">
                    {subscription.limits.current_event_types} / {subscription.limits.max_event_types === -1 ? '∞' : subscription.limits.max_event_types}
                  </p>
                </div>
                <div className="bg-white/60 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Bookings This Month</p>
                  <p className="text-lg font-bold text-gray-900">
                    {subscription.limits.current_bookings_this_month} / {subscription.limits.max_bookings_per_month === -1 || subscription.limits.max_bookings_per_month === null ? '∞' : subscription.limits.max_bookings_per_month}
                  </p>
                </div>
              </div>
            </div>

            {/* Cancelled Notice */}
            {subscription.status === 'cancelled' && (
              <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="font-bold text-orange-900">Subscription Cancelled</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Your subscription is cancelled but you still have access until the end of your billing period.
                    </p>
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={subscriptionAction === 'reactivate'}
                      className="mt-3 px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      {subscriptionAction === 'reactivate' ? '⏳ Reactivating...' : '🔄 Reactivate Subscription'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade CTA for Free Users */}
            {subscription.plan === 'free' && (
              <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white">
                <h4 className="font-bold text-lg mb-2">🚀 Upgrade to Pro or Business</h4>
                <p className="text-purple-100 text-sm mb-4">
                  Unlock more event types, advanced analytics, and priority support.
                </p>
                <button
                  onClick={() => navigate('/app/pricing')}
                  className="px-6 py-2 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors"
                >
                  View Plans
                </button>
              </div>
            )}

            {/* Subscription Actions */}
            {subscription.plan !== 'free' && subscription.status === 'active' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Manage Subscription</h4>
                
                <div className="flex flex-wrap gap-3">
                  {/* Downgrade Button */}
                  {subscription.plan === 'business' && (
                    <button
                      onClick={() => {
                        setSelectedDowngradePlan('pro');
                        setShowDowngradeModal(true);
                      }}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 border-2 border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                    >
                      Downgrade to Pro
                    </button>
                  )}
                  
                  {(subscription.plan === 'business' || subscription.plan === 'pro') && (
                    <button
                      onClick={() => {
                        setSelectedDowngradePlan('free');
                        setShowDowngradeModal(true);
                      }}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 border-2 border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                    >
                      Downgrade to Free
                    </button>
                  )}
                  
                  {/* Cancel Button */}
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 text-sm font-semibold text-red-600 border-2 border-red-200 hover:border-red-300 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Unable to load subscription information</p>
        )}
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-purple-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">📋 Account Information</h2>
        
        <div className="space-y-5">
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <label className="block text-sm font-semibold text-purple-900 mb-1">Email Address</label>
            <div className="text-sm text-gray-900 font-medium">{profile?.email}</div>
            <p className="mt-2 text-xs text-purple-700">
              Contact support to change your email address
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <label className="block text-sm font-semibold text-purple-900 mb-1">Account Created</label>
            <div className="text-sm text-gray-900 font-medium">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-red-200 mt-8">
        <h2 className="text-xl font-bold text-red-700 mb-6">⚠️ Danger Zone</h2>
        <div className="space-y-4">
          <p className="text-red-600 font-semibold">Delete Account</p>
          <p className="text-sm text-gray-700 mb-2">Permanently delete your account and all associated data.</p>
          <button
            type="button"
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl shadow-lg hover:from-red-700 hover:to-red-800 transition-all"
            onClick={() => setShowDeleteModal(true)}
          >
            🗑️ Delete Account
          </button>
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-xl p-8 shadow-xl max-w-md w-full">
                <h3 className="text-lg font-bold text-red-700 mb-4">Delete Account</h3>
                <p className="mb-4 text-gray-800">To permanently delete your account, please email <a href="mailto:support@bookagreed.com" className="text-purple-700 underline">support@bookagreed.com</a> and mention your reason for closing in a few words. Our team will process your request and confirm via email.</p>
                <button
                  type="button"
                  className="mt-4 px-6 py-2 bg-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-300"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">😢</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Cancel Subscription?</h3>
              <p className="text-gray-600 mt-2">
                We're sorry to see you go. Here's what happens when you cancel:
              </p>
            </div>
            
            <ul className="space-y-2 mb-6 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>You'll lose access to premium features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Your event types over the free limit will be deactivated</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span>Your data will be preserved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span>You can reactivate anytime</span>
              </li>
            </ul>
            
            <div className="space-y-3">
              <button
                onClick={() => handleCancelSubscription(false)}
                disabled={subscriptionAction === 'cancel'}
                className="w-full py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {subscriptionAction === 'cancel' ? '⏳ Processing...' : 'Cancel at End of Billing Period'}
              </button>
              <button
                onClick={() => handleCancelSubscription(true)}
                disabled={subscriptionAction === 'cancel'}
                className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {subscriptionAction === 'cancel' ? '⏳ Processing...' : 'Cancel Immediately'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Keep My Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Downgrade Modal */}
      {showDowngradeModal && selectedDowngradePlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⬇️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Downgrade to {selectedDowngradePlan.charAt(0).toUpperCase() + selectedDowngradePlan.slice(1)}?
              </h3>
              <p className="text-gray-600 mt-2">
                You'll lose access to some features with this change.
              </p>
            </div>
            
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-yellow-800 mb-2">Features you'll lose:</h4>
              <ul className="space-y-1 text-sm text-yellow-700">
                {subscription?.plan === 'business' && selectedDowngradePlan === 'pro' && (
                  <>
                    <li>• Unlimited event types → 10 event types</li>
                    <li>• Unlimited bookings → 1,000 bookings/month</li>
                    <li>• Dedicated support</li>
                  </>
                )}
                {selectedDowngradePlan === 'free' && (
                  <>
                    <li>• Advanced availability settings</li>
                    <li>• Analytics dashboard</li>
                    <li>• Calendar integrations</li>
                    <li>• API access</li>
                    <li>• Most event types (keep only 1)</li>
                  </>
                )}
              </ul>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleDowngradeSubscription}
                disabled={subscriptionAction === 'downgrade'}
                className="w-full py-3 bg-yellow-600 text-white font-semibold rounded-xl hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {subscriptionAction === 'downgrade' ? '⏳ Processing...' : `Downgrade to ${selectedDowngradePlan.charAt(0).toUpperCase() + selectedDowngradePlan.slice(1)}`}
              </button>
              <button
                onClick={() => {
                  setShowDowngradeModal(false);
                  setSelectedDowngradePlan(null);
                }}
                className="w-full py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Keep Current Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
