import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getSubscriptionPlans, getUserSubscription, upgradeSubscription, downgradeSubscription, type SubscriptionInfo } from '../services/subscriptionService';
import type { Database } from '../lib/database.types';

type SubscriptionPlanRow = Database['public']['Tables']['subscription_plans']['Row'];

export function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlanRow[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [downgrading, setDowngrading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, subscriptionData] = await Promise.all([
        getSubscriptionPlans(),
        user ? getUserSubscription(user.id) : Promise.resolve(null),
      ]);

      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setUpgrading(planName);
    try {
      const result = await upgradeSubscription(user.id, planName as any);
      if (result.success) {
        await loadData();
        alert('Subscription upgraded successfully!');
      } else {
        alert(`Failed to upgrade: ${result.error}`);
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to upgrade subscription');
    } finally {
      setUpgrading(null);
    }
  };

  const handleDowngrade = async (planName: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to downgrade to the ${planName} plan? You may lose access to some features.`
    );
    if (!confirmed) return;

    setDowngrading(planName);
    try {
      const result = await downgradeSubscription(user.id, planName as any);
      if (result.success) {
        await loadData();
        alert('Subscription downgraded successfully!');
      } else {
        alert(`Failed to downgrade: ${result.error}`);
      }
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      alert('Failed to downgrade subscription');
    } finally {
      setDowngrading(null);
    }
  };

  const handlePlanChange = (planName: string) => {
    if (!currentSubscription) {
      handleUpgrade(planName);
      return;
    }
    
    const currentLevel = getPlanLevel(currentSubscription.plan);
    const newLevel = getPlanLevel(planName);
    
    if (newLevel > currentLevel) {
      handleUpgrade(planName);
    } else if (newLevel < currentLevel) {
      handleDowngrade(planName);
    }
  };

  const getPlanLevel = (planName: string): number => {
    const planHierarchy: Record<string, number> = {
      'free': 0,
      'pro': 1,
      'business': 2,
    };
    return planHierarchy[planName] || 0;
  };

  const getPlanFeatures = (plan: SubscriptionPlanRow) => {
    const features: string[] = [];
    
    if (plan.name === 'free') {
      features.push('Up to 1 event type');
      features.push('Basic availability settings');
      features.push('Email reminders');
      features.push('Public booking link');
      features.push('100 bookings/month');
      features.push('Time zone support');
    } else if (plan.name === 'pro') {
      features.push('Up to 10 event types');
      features.push('Advanced availability');
      features.push('Email reminders');
      features.push('Public booking link');
      features.push('Analytics dashboard');
      features.push('Calendar integrations');
      features.push('API access');
      features.push('1,000 bookings/month');
    } else if (plan.name === 'business') {
      features.push('Unlimited event types');
      features.push('Advanced availability');
      features.push('Email reminders');
      features.push('Public booking link');
      features.push('Advanced analytics & reports');
      features.push('Everything in Pro');
      features.push('Custom branding');
      features.push('Dedicated support');
      features.push('Team collaboration (coming soon)');
      features.push('Unlimited bookings');
    }

    return features;
  };

  const getPrice = (plan: SubscriptionPlanRow) => {
    return billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
  };

  const getSavingsPercent = (plan: SubscriptionPlanRow) => {
    if (plan.price_monthly === 0) return 0;
    const monthlyCost = plan.price_monthly * 12;
    const yearlyCost = plan.price_yearly;
    return Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start for free, upgrade as you grow. All plans include our core scheduling features.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center bg-white rounded-full p-1 shadow-md">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Save up to 17%
              </span>
            </button>
          </div>
        </div>

        {/* Current Plan Info */}
        {currentSubscription && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center bg-blue-50 border-2 border-blue-200 rounded-xl px-6 py-3">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                Current Plan: <strong className="capitalize">{currentSubscription.plan}</strong>
                {' • '}
                {currentSubscription.limits.current_event_types} / {currentSubscription.limits.max_event_types === -1 ? '∞' : currentSubscription.limits.max_event_types} event types
                {' • '}
                {currentSubscription.limits.current_bookings_this_month} / {currentSubscription.limits.max_bookings_per_month === -1 ? '∞' : currentSubscription.limits.max_bookings_per_month} bookings this month
              </span>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan === plan.name;
            const features = getPlanFeatures(plan);
            const price = getPrice(plan);
            const savings = getSavingsPercent(plan);

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 ${
                  plan.name === 'pro' ? 'border-4 border-purple-500 md:scale-105' : 'border-2 border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {plan.name === 'pro' && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1 rounded-bl-xl text-sm font-bold">
                    POPULAR
                  </div>
                )}

                {/* Best Value Badge */}
                {plan.name === 'business' && billingPeriod === 'yearly' && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-xl text-sm font-bold">
                    BEST VALUE
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.display_name}
                  </h3>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-gray-900">
                        £{price}
                      </span>
                      <span className="text-gray-600 ml-2">
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingPeriod === 'yearly' && savings > 0 && (
                      <p className="text-sm text-green-600 font-semibold mt-1">
                        Save {savings}% with yearly billing
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePlanChange(plan.name)}
                    disabled={isCurrentPlan || upgrading === plan.name || downgrading === plan.name}
                    className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition-all mb-6 ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : currentSubscription && getPlanLevel(plan.name) < getPlanLevel(currentSubscription.plan)
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700 shadow-lg hover:shadow-xl'
                        : plan.name === 'pro'
                        ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {upgrading === plan.name || downgrading === plan.name ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {upgrading === plan.name ? 'Upgrading...' : 'Downgrading...'}
                      </span>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : currentSubscription && getPlanLevel(plan.name) < getPlanLevel(currentSubscription.plan) ? (
                      'Downgrade'
                    ) : plan.name === 'free' ? (
                      'Get Started Free'
                    ) : (
                      'Upgrade Now'
                    )}
                  </button>

                  {/* Features List */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      What's included:
                    </p>
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Need help choosing? <button onClick={() => navigate('/app/settings')} className="text-purple-600 font-semibold hover:underline">Contact us</button> for personalized recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
