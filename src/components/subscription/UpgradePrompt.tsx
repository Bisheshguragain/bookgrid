import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  currentLimit: number;
  planName: string;
  onClose?: () => void;
}

export function UpgradePrompt({ feature, currentLimit, planName, onClose }: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Upgrade to Continue
        </h3>
        
        <p className="text-gray-600 text-center mb-6">
          You've reached the limit for <strong>{feature}</strong> on the{' '}
          <span className="capitalize font-semibold text-gray-900">{planName}</span> plan.
        </p>

        {/* Limit Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Current Limit:</span>
            <span className="text-2xl font-bold text-gray-900">{currentLimit}</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-6 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Upgrade to Pro and get:</p>
          <div className="space-y-2">
            {[
              'Up to 10 event types',
              'Advanced availability settings',
              'Analytics dashboard',
              'Calendar integrations',
              '1,000 bookings/month',
            ].map((benefit, index) => (
              <div key={index} className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/app/pricing')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            View Pricing Plans
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all"
            >
              Maybe Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface LimitReachedBannerProps {
  message: string;
  current: number;
  limit: number;
  onUpgrade: () => void;
}

export function LimitReachedBanner({ message, current, limit, onUpgrade }: LimitReachedBannerProps) {
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-yellow-900 mb-2">
            Limit Reached
          </h3>
          <p className="text-yellow-800 mb-4">
            {message}
          </p>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 bg-white rounded-lg p-3 border-2 border-yellow-200">
              <div className="text-sm text-yellow-700 mb-1">Usage</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-yellow-900">{current}</span>
                <span className="text-yellow-700">/ {limit}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onUpgrade}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
