import { supabase } from '../lib/supabase';
import type {
  SuperAdminUser,
  MRRStats,
  UserStatistics,
  RevenueStatistics,
  InactiveUser,
  PaymentHistory,
  AccountDeletionNotice,
} from '../lib/database.types';

/**
 * SuperAdmin Service
 * Handles all supexport async function revokeUserSuperAdmin(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('users_profile')
      .update({ role: 'user' })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error revoking superadmin:', error);
    throw error;
  }
}oard functionality including:
 * - User management
 * - Subscription analytics
 * - Payment tracking
 * - Account cleanup
 */

// =====================================================
// PERMISSION CHECKS
// =====================================================

export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching role:', error);
      throw error;
    }
    
    return data?.role === 'superadmin';
  } catch (error) {
    console.error('Error checking superadmin status:', error);
    return false;
  }
}

export async function ensureSuperAdmin(userId: string): Promise<void> {
  const isAdmin = await isSuperAdmin(userId);
  if (!isAdmin) {
    throw new Error('Unauthorized: Superadmin access required');
  }
}

// =====================================================
// ANALYTICS
// =====================================================

export async function getMRR(): Promise<MRRStats> {
  try {
    const { data, error } = await supabase.rpc('get_mrr');
    
    if (error) {
      console.error('Error calling get_mrr function:', error);
      throw error;
    }
    
    // The function returns an array with one row
    return data && data.length > 0 ? data[0] : {
      total_mrr: 0,
      pro_mrr: 0,
      business_mrr: 0,
      currency: 'GBP',
    };
  } catch (error) {
    console.error('Error fetching MRR:', error);
    // Return empty data on error but don't crash
    return {
      total_mrr: 0,
      pro_mrr: 0,
      business_mrr: 0,
      currency: 'GBP',
    };
  }
}

export async function getUserStatistics(): Promise<UserStatistics> {
  try {
    const { data, error } = await supabase.rpc('get_user_statistics');
    
    if (error) {
      console.error('Error calling get_user_statistics function:', error);
      throw error;
    }
    
    // The function returns an array with one row
    return data && data.length > 0 ? data[0] : {
      total_users: 0,
      active_users: 0,
      inactive_users: 0,
      free_users: 0,
      pro_users: 0,
      business_users: 0,
      users_today: 0,
      users_this_week: 0,
      users_this_month: 0,
    };
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    // Return empty stats instead of throwing
    return {
      total_users: 0,
      active_users: 0,
      inactive_users: 0,
      free_users: 0,
      pro_users: 0,
      business_users: 0,
      users_today: 0,
      users_this_week: 0,
      users_this_month: 0,
    };
  }
}

export async function getRevenueStatistics(): Promise<RevenueStatistics> {
  try {
    const { data, error } = await supabase.rpc('get_revenue_statistics');
    
    if (error) {
      console.error('Error calling get_revenue_statistics function:', error);
      throw error;
    }
    
    // The function returns an array with one row
    return data && data.length > 0 ? data[0] : {
      total_revenue: 0,
      revenue_today: 0,
      revenue_this_week: 0,
      revenue_this_month: 0,
      revenue_this_year: 0,
      total_payments: 0,
      successful_payments: 0,
      failed_payments: 0,
    };
  } catch (error) {
    console.error('Error fetching revenue statistics:', error);
    return {
      total_revenue: 0,
      revenue_today: 0,
      revenue_this_week: 0,
      revenue_this_month: 0,
      revenue_this_year: 0,
      total_payments: 0,
      successful_payments: 0,
      failed_payments: 0,
    };
  }
}

// =====================================================
// USER MANAGEMENT
// =====================================================

export async function getAllUsers(
  page: number = 1,
  pageSize: number = 50,
  filters?: {
    plan?: 'free' | 'pro' | 'business';
    status?: string;
    search?: string;
  }
): Promise<{ users: SuperAdminUser[]; total: number }> {
  try {
    let query = supabase
      .from('users_profile')
      .select(`
        id,
        email,
        full_name,
        username,
        subscription_plan,
        subscription_status,
        role,
        account_status,
        last_active_at,
        deletion_notice_sent_at,
        scheduled_deletion_at,
        created_at,
        bookings_this_month
      `, { count: 'exact' });

    // Apply filters
    if (filters?.plan) {
      query = query.eq('subscription_plan', filters.plan);
    }
    if (filters?.status) {
      query = query.eq('account_status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return { users: [], total: 0 };
    }

    // Fetch additional stats for each user
    const usersWithStats = await Promise.all(
      (data || []).map(async (user) => {
        const [eventTypesCount, bookingsCount] = await Promise.all([
          supabase
            .from('event_types')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);

        return {
          user_id: user.id, // Map id to user_id for compatibility
          email: user.email,
          full_name: user.full_name,
          username: user.username,
          subscription_plan: user.subscription_plan,
          subscription_status: user.subscription_status,
          role: user.role,
          account_status: user.account_status,
          last_active_at: user.last_active_at,
          deletion_notice_sent_at: user.deletion_notice_sent_at,
          scheduled_deletion_at: user.scheduled_deletion_at,
          created_at: user.created_at,
          bookings_this_month: user.bookings_this_month,
          total_event_types: eventTypesCount.count || 0,
          total_bookings: bookingsCount.count || 0,
        } as SuperAdminUser;
      })
    );

    return {
      users: usersWithStats,
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function getInactiveUsers(daysThreshold: number = 90): Promise<InactiveUser[]> {
  try {
    const { data, error } = await supabase.rpc('get_inactive_users', {
      days_threshold: daysThreshold,
    });

    if (error) {
      console.error('Error calling get_inactive_users function:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching inactive users:', error);
    return [];
  }
}

export async function updateUserPlan(
  userId: string,
  plan: 'free' | 'pro' | 'business'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('users_profile')
      .update({ 
        subscription_plan: plan,
        subscription_status: 'active',
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user plan:', error);
    throw error;
  }
}

export async function updateUserStatus(
  userId: string,
  status: 'active' | 'inactive' | 'pending_deletion' | 'deleted'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('users_profile')
      .update({ account_status: status })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}

export async function makeUserSuperAdmin(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('users_profile')
      .update({ role: 'superadmin' })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error making user superadmin:', error);
    throw error;
  }
}

export async function revokeSuperadminAccess(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('users_profile')
      .update({ role: 'user' })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error revoking superadmin access:', error);
    throw error;
  }
}

// =====================================================
// PAYMENT MANAGEMENT
// =====================================================

export async function getPaymentHistory(
  page: number = 1,
  pageSize: number = 50,
  filters?: {
    userId?: string;
    status?: string;
    planType?: 'free' | 'pro' | 'business';
  }
): Promise<{ payments: PaymentHistory[]; total: number }> {
  try {
    let query = supabase
      .from('payment_history')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.status) {
      query = query.eq('payment_status', filters.status);
    }
    if (filters?.planType) {
      query = query.eq('plan_type', filters.planType);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Payment history error:', error);
      // If table doesn't exist, return empty array instead of crashing
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('payment_history table does not exist - returning empty array');
        return { payments: [], total: 0 };
      }
      throw error;
    }

    return {
      payments: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching payment history:', error);
    // Return empty data instead of crashing
    return { payments: [], total: 0 };
  }
}

export async function recordPayment(payment: {
  user_id: string;
  stripe_payment_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  amount: number;
  currency?: string;
  payment_status: string;
  payment_method?: string;
  plan_type: 'free' | 'pro' | 'business';
  billing_period_start?: string;
  billing_period_end?: string;
  metadata?: any;
}): Promise<PaymentHistory> {
  try {
    const { data, error } = await supabase
      .from('payment_history')
      .insert(payment)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
}

// =====================================================
// ACCOUNT DELETION MANAGEMENT
// =====================================================

export async function getDeletionNotices(
  status?: 'sent' | 'cancelled' | 'executed'
): Promise<AccountDeletionNotice[]> {
  try {
    let query = supabase
      .from('account_deletion_notices')
      .select('*')
      .order('scheduled_deletion_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Deletion notices error:', error);
      // If table doesn't exist, return empty array instead of crashing
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('account_deletion_notices table does not exist - returning empty array');
        return [];
      }
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching deletion notices:', error);
    // Return empty data instead of crashing
    return [];
  }
}

export async function sendDeletionNotice(
  userId: string,
  noticeType: string,
  reason: string,
  daysInactive: number
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('send_deletion_notice', {
      p_user_id: userId,
      p_notice_type: noticeType,
      p_reason: reason,
      p_days_inactive: daysInactive,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending deletion notice:', error);
    throw error;
  }
}

export async function cancelDeletionNotice(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('cancel_deletion_notice', {
      p_user_id: userId,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error cancelling deletion notice:', error);
    throw error;
  }
}

export async function processInactiveAccounts(): Promise<{
  notices_sent: number;
  accounts_deleted: number;
}> {
  try {
    const { data, error } = await supabase.rpc('process_inactive_accounts');

    if (error) throw error;
    
    return data[0] || { notices_sent: 0, accounts_deleted: 0 };
  } catch (error) {
    console.error('Error processing inactive accounts:', error);
    throw error;
  }
}

// =====================================================
// ACTIVITY TRACKING
// =====================================================

export async function updateUserLastActive(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('update_user_last_active', {
      p_user_id: userId,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating last active:', error);
    // Don't throw - this is a background operation
  }
}

export async function logUserActivity(
  userId: string,
  activityType: string,
  description?: string,
  metadata?: any
): Promise<void> {
  try {
    const { error } = await supabase.from('user_activity_log').insert({
      user_id: userId,
      activity_type: activityType,
      activity_description: description,
      metadata: metadata,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - this is a background operation
  }
}
