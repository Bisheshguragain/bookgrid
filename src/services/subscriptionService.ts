/**
 * Subscription Service
 * Handles subscription plan checks, rate limiting, and feature access control
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { notifySuperadminUserEvent } from './emailService';

type SubscriptionPlan = 'free' | 'pro' | 'business';
type SubscriptionPlanRow = Database['public']['Tables']['subscription_plans']['Row'];

export interface PlanFeatures {
  availability: 'basic' | 'advanced';
  reminders: boolean;
  public_link: boolean;
  analytics: boolean;
  integrations: boolean;
  custom_branding: boolean;
  priority_support: boolean;
  api_access: boolean;
}

export interface PlanLimits {
  max_event_types: number; // -1 for unlimited
  max_bookings_per_month: number | null; // -1 for unlimited, null for unlimited
  current_event_types: number;
  current_bookings_this_month: number;
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  features: PlanFeatures;
  limits: PlanLimits;
  can_create_event_type: boolean;
  can_create_booking: boolean;
}

/**
 * Get user's subscription information including features and limits
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
  try {
    // Get user profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw profileError;
    }

    if (!profile) {
      console.error('No profile found for user:', userId);
      return null;
    }

    // Get subscription plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', profile.subscription_plan || 'free')
      .single();

    if (planError) {
      console.error('Error fetching subscription plan:', planError);
      throw planError;
    }

    // Count active event types
    const { count: eventTypeCount, error: eventError } = await supabase
      .from('event_types')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (eventError) throw eventError;

    const currentEventTypes = eventTypeCount || 0;
    const maxEventTypes = plan.max_event_types;
    const maxBookings = plan.max_bookings_per_month;
    const currentBookings = profile.bookings_this_month;

    return {
      plan: profile.subscription_plan as SubscriptionPlan,
      status: profile.subscription_status as any,
      features: plan.features as PlanFeatures,
      limits: {
        max_event_types: maxEventTypes,
        max_bookings_per_month: maxBookings,
        current_event_types: currentEventTypes,
        current_bookings_this_month: currentBookings,
      },
      can_create_event_type: maxEventTypes === -1 || currentEventTypes < maxEventTypes,
      can_create_booking: maxBookings === null || maxBookings === -1 || currentBookings < maxBookings,
    };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

/**
 * Check if user can create a new event type
 */
export async function canCreateEventType(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
}> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return { allowed: false, reason: 'Unable to verify subscription' };
  }

  if (!subscription.can_create_event_type) {
    return {
      allowed: false,
      reason: 'Event type limit reached',
      limit: subscription.limits.max_event_types,
      current: subscription.limits.current_event_types,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create a new booking
 */
export async function canCreateBooking(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
}> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return { allowed: false, reason: 'Unable to verify subscription' };
  }

  if (!subscription.can_create_booking) {
    return {
      allowed: false,
      reason: 'Monthly booking limit reached',
      limit: subscription.limits.max_bookings_per_month || 0,
      current: subscription.limits.current_bookings_this_month,
    };
  }

  return { allowed: true };
}

/**
 * Increment booking count after successful booking
 */
export async function incrementBookingCount(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_booking_count', {
      user_uuid: userId,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error incrementing booking count:', error);
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return false;
  }

  return subscription.features[feature] === true || 
         subscription.features[feature] === 'advanced';
}

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlanRow[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
}

/**
 * Upgrade user's subscription plan
 */
export async function upgradeSubscription(
  userId: string,
  newPlan: SubscriptionPlan
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users_profile')
      .update({
        subscription_plan: newPlan,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // Notify superadmin of upgrade
    await notifySuperadminUserEvent({
      type: 'upgrade',
      user: { id: userId, email: '', plan: newPlan, status: 'active' },
      details: {},
    });

    return { success: true };
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upgrade subscription' 
    };
  }
}

/**
 * Downgrade user's subscription plan
 * Plan hierarchy: business > pro > free
 */
export async function downgradeSubscription(
  userId: string,
  newPlan: SubscriptionPlan
): Promise<{ success: boolean; error?: string; effectiveDate?: string }> {
  try {
    // Get current subscription to validate downgrade
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return { success: false, error: 'Unable to fetch current subscription' };
    }

    // Validate it's actually a downgrade
    const planHierarchy: Record<SubscriptionPlan, number> = {
      'free': 0,
      'pro': 1,
      'business': 2,
    };

    if (planHierarchy[newPlan] >= planHierarchy[subscription.plan]) {
      return { success: false, error: 'This is not a downgrade. Use upgrade instead.' };
    }

    // For paid subscriptions, schedule the downgrade for end of billing period
    // For now, we'll do immediate downgrade (in production, integrate with Stripe)
    const effectiveDate = new Date().toISOString();

    const { error } = await supabase
      .from('users_profile')
      .update({
        subscription_plan: newPlan,
        subscription_status: 'active',
        subscription_end_date: null, // Clear any scheduled cancellation
      })
      .eq('id', userId);

    if (error) throw error;

    // Notify superadmin of downgrade
    await notifySuperadminUserEvent({
      type: 'downgrade',
      user: { id: userId, email: '', plan: newPlan, status: 'active' },
      details: {},
    });

    return { success: true, effectiveDate };
  } catch (error) {
    console.error('Error downgrading subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to downgrade subscription',
    };
  }
}

/**
 * Cancel user's subscription
 * Sets status to 'cancelled' and schedules revert to free plan
 */
export async function cancelSubscription(
  userId: string,
  immediate: boolean = false
): Promise<{ success: boolean; error?: string; effectiveDate?: string }> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return { success: false, error: 'Unable to fetch current subscription' };
    }

    if (subscription.plan === 'free') {
      return { success: false, error: 'You are already on the free plan' };
    }

    if (immediate) {
      // Immediate cancellation - revert to free plan now
      const { error } = await supabase
        .from('users_profile')
        .update({
          subscription_plan: 'free',
          subscription_status: 'active',
          subscription_end_date: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true, effectiveDate: new Date().toISOString() };
    } else {
      // Schedule cancellation for end of billing period
      // In production, this would integrate with Stripe to get the actual period end
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1); // Assume monthly billing

      const { error } = await supabase
        .from('users_profile')
        .update({
          subscription_status: 'cancelled',
          subscription_end_date: periodEnd.toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true, effectiveDate: periodEnd.toISOString() };
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
}

/**
 * Reactivate a cancelled subscription (before it expires)
 */
export async function reactivateSubscription(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return { success: false, error: 'Unable to fetch current subscription' };
    }

    if (subscription.status !== 'cancelled') {
      return { success: false, error: 'Subscription is not in cancelled state' };
    }

    const { error } = await supabase
      .from('users_profile')
      .update({
        subscription_status: 'active',
        subscription_end_date: null,
      })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reactivate subscription',
    };
  }
}

/**
 * Get plan display information
 */
export function getPlanDisplayInfo(plan: SubscriptionPlan): {
  name: string;
  description: string;
  badge?: string;
  color: string;
} {
  switch (plan) {
    case 'free':
      return {
        name: 'Free',
        description: 'Perfect for getting started',
        color: 'gray',
      };
    case 'pro':
      return {
        name: 'Pro',
        description: 'For professionals and small teams',
        badge: 'Popular',
        color: 'purple',
      };
    case 'business':
      return {
        name: 'Business',
        description: 'For growing businesses',
        badge: 'Best Value',
        color: 'blue',
      };
  }
}

export default {
  getUserSubscription,
  canCreateEventType,
  canCreateBooking,
  incrementBookingCount,
  hasFeatureAccess,
  getSubscriptionPlans,
  upgradeSubscription,
  downgradeSubscription,
  cancelSubscription,
  reactivateSubscription,
  getPlanDisplayInfo,
};
