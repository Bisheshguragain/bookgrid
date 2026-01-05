/**
 * Google Analytics 4 Service
 * Tracks pageviews, events, and conversions for SEO and marketing analytics
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const analytics = {
  /**
   * Track a pageview
   * Call this on route changes
   */
  pageview: (path: string, title?: string) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX', {
        page_path: path,
        page_title: title,
      });
    }
  },

  /**
   * Track a custom event
   * @param action - Event name (e.g., 'sign_up', 'purchase', 'contact_form_submit')
   * @param params - Additional event parameters
   */
  event: (action: string, params?: Record<string, any>) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', action, params);
    }
  },

  /**
   * Track user signup
   */
  trackSignup: (method: 'email' | 'google' | 'github' = 'email') => {
    analytics.event('sign_up', {
      method,
      category: 'engagement',
    });
  },

  /**
   * Track successful login
   */
  trackLogin: (method: 'email' | 'google' | 'github' = 'email') => {
    analytics.event('login', {
      method,
      category: 'engagement',
    });
  },

  /**
   * Track subscription purchase/upgrade
   */
  trackPurchase: (params: {
    transactionId: string;
    value: number;
    currency?: string;
    planName: string;
    billingPeriod: 'monthly' | 'yearly';
  }) => {
    analytics.event('purchase', {
      transaction_id: params.transactionId,
      value: params.value,
      currency: params.currency || 'GBP',
      items: [{
        item_name: params.planName,
        item_category: 'subscription',
        price: params.value,
        quantity: 1,
      }],
      billing_period: params.billingPeriod,
      category: 'conversion',
    });
  },

  /**
   * Track booking creation
   */
  trackBookingCreated: (eventType: string, isPaidMeeting: boolean) => {
    analytics.event('booking_created', {
      event_type: eventType,
      is_paid: isPaidMeeting,
      category: 'engagement',
    });
  },

  /**
   * Track event type creation
   */
  trackEventTypeCreated: (isPaidMeeting: boolean) => {
    analytics.event('event_type_created', {
      is_paid: isPaidMeeting,
      category: 'engagement',
    });
  },

  /**
   * Track contact form submission
   */
  trackContactFormSubmit: () => {
    analytics.event('contact_form_submit', {
      category: 'engagement',
    });
  },

  /**
   * Track blog article view
   */
  trackBlogView: (articleId: string, articleTitle: string) => {
    analytics.event('blog_view', {
      article_id: articleId,
      article_title: articleTitle,
      category: 'engagement',
    });
  },

  /**
   * Track help center search
   */
  trackHelpSearch: (searchQuery: string) => {
    analytics.event('help_search', {
      search_term: searchQuery,
      category: 'engagement',
    });
  },

  /**
   * Track CTA button clicks
   */
  trackCTA: (ctaName: string, ctaLocation: string) => {
    analytics.event('cta_click', {
      cta_name: ctaName,
      cta_location: ctaLocation,
      category: 'engagement',
    });
  },

  /**
   * Track subscription downgrade
   */
  trackDowngrade: (fromPlan: string, toPlan: string) => {
    analytics.event('subscription_downgrade', {
      from_plan: fromPlan,
      to_plan: toPlan,
      category: 'conversion',
    });
  },

  /**
   * Track subscription cancellation
   */
  trackCancellation: (planName: string, reason?: string) => {
    analytics.event('subscription_cancel', {
      plan_name: planName,
      cancellation_reason: reason,
      category: 'conversion',
    });
  },
};

/**
 * Initialize Google Analytics
 * Call this once when app loads
 */
export function initializeAnalytics() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  
  if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
    console.warn('Google Analytics not configured. Set VITE_GA_MEASUREMENT_ID in .env');
    return;
  }

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We'll track pageviews manually
  });
}
