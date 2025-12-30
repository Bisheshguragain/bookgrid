export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Superadmin System Types
export type UserRole = 'user' | 'superadmin';
export type AccountStatus = 'active' | 'inactive' | 'pending_deletion' | 'deleted';
export type PaymentStatus = 'succeeded' | 'failed' | 'pending' | 'refunded' | 'cancelled';
export type NoticeStatus = 'sent' | 'cancelled' | 'executed';

export interface PaymentHistory {
  id: string;
  user_id: string;
  stripe_payment_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  payment_method: string | null;
  plan_type: 'free' | 'pro' | 'business';
  billing_period_start: string | null;
  billing_period_end: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Json | null;
  created_at: string;
}

export interface AccountDeletionNotice {
  id: string;
  user_id: string;
  notice_type: string;
  reason: string;
  days_inactive: number | null;
  scheduled_deletion_date: string;
  notice_sent_at: string;
  status: NoticeStatus;
  metadata: Json | null;
  created_at: string;
}

export interface MRRStats {
  total_mrr: number;
  pro_mrr: number;
  business_mrr: number;
  currency: string;
}

export interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  free_users: number;
  pro_users: number;
  business_users: number;
  users_today: number;
  users_this_week: number;
  users_this_month: number;
}

export interface RevenueStatistics {
  total_revenue: number;
  revenue_today: number;
  revenue_this_week: number;
  revenue_this_month: number;
  revenue_this_year: number;
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
}

export interface InactiveUser {
  user_id: string;
  email: string;
  full_name: string;
  subscription_plan: string;
  last_active_at: string;
  days_inactive: number;
  created_at: string;
}

export interface SuperAdminUser {
  user_id: string;
  email: string;
  full_name: string;
  username: string | null;
  subscription_plan: 'free' | 'pro' | 'business';
  subscription_status: string;
  role: UserRole;
  account_status: AccountStatus;
  last_active_at: string;
  deletion_notice_sent_at: string | null;
  scheduled_deletion_at: string | null;
  created_at: string;
  bookings_this_month: number;
  total_event_types: number;
  total_bookings: number;
}

export interface Database {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string
          email: string
          full_name: string
          username: string | null
          time_zone: string
          avatar_url: string | null
          default_meeting_duration: number
          subscription_plan: 'free' | 'pro' | 'business'
          subscription_status: 'active' | 'cancelled' | 'expired' | 'trial'
          subscription_start_date: string
          subscription_end_date: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_current_period_end: string | null
          bookings_this_month: number
          last_booking_reset: string
          role: UserRole
          last_active_at: string
          account_status: AccountStatus
          deletion_notice_sent_at: string | null
          scheduled_deletion_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          username?: string | null
          time_zone?: string
          avatar_url?: string | null
          default_meeting_duration?: number
          subscription_plan?: 'free' | 'pro' | 'business'
          subscription_status?: 'active' | 'cancelled' | 'expired' | 'trial'
          subscription_start_date?: string
          subscription_end_date?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          bookings_this_month?: number
          last_booking_reset?: string
          role?: UserRole
          last_active_at?: string
          account_status?: AccountStatus
          deletion_notice_sent_at?: string | null
          scheduled_deletion_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          username?: string | null
          time_zone?: string
          avatar_url?: string | null
          default_meeting_duration?: number
          subscription_plan?: 'free' | 'pro' | 'business'
          subscription_status?: 'active' | 'cancelled' | 'expired' | 'trial'
          subscription_start_date?: string
          subscription_end_date?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          bookings_this_month?: number
          last_booking_reset?: string
          role?: UserRole
          last_active_at?: string
          account_status?: AccountStatus
          deletion_notice_sent_at?: string | null
          scheduled_deletion_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_types: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          duration: number
          location_type: 'zoom' | 'google_meet' | 'microsoft_teams' | 'phone' | 'in_person' | 'webex' | 'skype' | 'custom'
          location_value: string | null
          color: string
          max_attendees: number
          is_active: boolean
          reminder_offsets: number[] | null
          date_range_start: string | null
          date_range_end: string | null
          is_paid: boolean
          payment_link: string | null
          payment_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          duration?: number
          location_type?: 'zoom' | 'google_meet' | 'microsoft_teams' | 'phone' | 'in_person' | 'webex' | 'skype' | 'custom'
          location_value?: string | null
          color?: string
          max_attendees?: number
          is_active?: boolean
          reminder_offsets?: number[] | null
          date_range_start?: string | null
          date_range_end?: string | null
          is_paid?: boolean
          payment_link?: string | null
          payment_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          duration?: number
          location_type?: 'zoom' | 'google_meet' | 'microsoft_teams' | 'phone' | 'in_person' | 'webex' | 'skype' | 'custom'
          location_value?: string | null
          color?: string
          max_attendees?: number
          is_active?: boolean
          reminder_offsets?: number[] | null
          date_range_start?: string | null
          date_range_end?: string | null
          is_paid?: boolean
          payment_link?: string | null
          payment_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      availability_rules: {
        Row: {
          id: string
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          buffer_before: number
          buffer_after: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          buffer_before?: number
          buffer_after?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          buffer_before?: number
          buffer_after?: number
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          event_type_id: string
          guest_name: string
          guest_email: string
          start_time: string
          end_time: string
          status: 'confirmed' | 'cancelled' | 'rescheduled'
          notes: string | null
          reschedule_token: string
          cancel_token: string
          guest_time_zone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type_id: string
          guest_name: string
          guest_email: string
          start_time: string
          end_time: string
          status?: 'confirmed' | 'cancelled' | 'rescheduled'
          notes?: string | null
          reschedule_token?: string
          cancel_token?: string
          guest_time_zone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type_id?: string
          guest_name?: string
          guest_email?: string
          start_time?: string
          end_time?: string
          status?: 'confirmed' | 'cancelled' | 'rescheduled'
          notes?: string | null
          reschedule_token?: string
          cancel_token?: string
          guest_time_zone?: string
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          booking_id: string
          reminder_offset_minutes: number
          status: 'pending' | 'sent' | 'failed'
          scheduled_at: string
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          reminder_offset_minutes: number
          status?: 'pending' | 'sent' | 'failed'
          scheduled_at: string
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          reminder_offset_minutes?: number
          status?: 'pending' | 'sent' | 'failed'
          scheduled_at?: string
          sent_at?: string | null
          created_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          display_name: string
          price_monthly: number
          price_yearly: number
          max_event_types: number
          max_bookings_per_month: number | null
          features: {
            availability: 'basic' | 'advanced'
            reminders: boolean
            public_link: boolean
            analytics: boolean
            integrations: boolean
            custom_branding: boolean
            priority_support: boolean
            api_access: boolean
          }
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          price_monthly?: number
          price_yearly?: number
          max_event_types: number
          max_bookings_per_month?: number | null
          features?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          price_monthly?: number
          price_yearly?: number
          max_event_types?: number
          max_bookings_per_month?: number | null
          features?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      global_settings: {
        Row: {
          id: string
          user_id: string
          minimum_notice_hours: number
          max_events_per_day: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          minimum_notice_hours?: number
          max_events_per_day?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          minimum_notice_hours?: number
          max_events_per_day?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_booking_metrics: {
        Args: {
          p_user_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          total_bookings: number
          confirmed_count: number
          cancelled_count: number
          avg_bookings_per_day: number
        }[]
      }
      get_bookings_over_time: {
        Args: {
          p_user_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          date_label: string
          booking_count: number
        }[]
      }
      get_bookings_by_event_type: {
        Args: {
          p_user_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          event_type_title: string
          booking_count: number
          percentage: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type UserProfile = Database['public']['Tables']['users_profile']['Row'] | UserProfileType
export type EventType = Database['public']['Tables']['event_types']['Row'] | EventTypeRecord
export type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row'] | AvailabilityRuleRecord
export type Booking = Database['public']['Tables']['bookings']['Row'] | BookingRecord
export type Reminder = Database['public']['Tables']['reminders']['Row'] | ReminderRecord
export type GlobalSettings = Database['public']['Tables']['global_settings']['Row']

export type BookingWithEventType = Booking & {
  event_types: EventType
}

export type EventTypeWithBookingCount = EventType & {
  booking_count?: number
}

// Standalone type definitions for better module resolution
export interface UserProfileType {
  id: string
  email: string
  full_name: string
  username: string | null
  time_zone: string
  avatar_url: string | null
  default_meeting_duration: number
  created_at: string
  updated_at: string
  // Subscription fields
  subscription_plan: 'free' | 'pro' | 'business'
  subscription_status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_current_period_end: string | null
  // Superadmin fields
  role: UserRole
  account_status: AccountStatus
  last_active_at: string | null
}

export interface EventTypeRecord {
  id: string
  user_id: string
  title: string
  description: string | null
  duration: number
  location_type: 'zoom' | 'google_meet' | 'phone' | 'custom'
  location_value: string | null
  color: string
  max_attendees: number
  is_active: boolean
  reminder_offsets: number[] | null
  date_range_start: string | null
  date_range_end: string | null
  is_paid: boolean
  payment_link: string | null
  payment_instructions: string | null
  created_at: string
  updated_at: string
}

export interface AvailabilityRuleRecord {
  id: string
  user_id: string
  day_of_week: number
  start_time: string
  end_time: string
  buffer_before: number
  buffer_after: number
  created_at: string
  updated_at: string
}

export interface BookingRecord {
  id: string
  event_type_id: string
  user_id: string
  guest_name: string
  guest_email: string
  start_time: string
  end_time: string
  status?: 'confirmed' | 'cancelled' | 'rescheduled'
  notes?: string | null
  reschedule_token?: string
  cancel_token?: string
  guest_time_zone?: string
  created_at?: string
  updated_at?: string
}

export interface ReminderRecord {
  id: string
  booking_id: string
  reminder_offset_minutes: number
  status?: 'pending' | 'sent' | 'failed'
  scheduled_at: string
  sent_at?: string | null
  created_at?: string
}

// ============================================
// CONTACTS TYPES
// ============================================
export interface Contact {
  id: string
  user_id: string
  full_name: string
  email: string
  phone_number: string
  created_at: string
  updated_at: string
}

export interface ContactInsert {
  full_name: string
  email: string
  phone_number: string
}

export interface ContactUpdate {
  full_name?: string
  email?: string
  phone_number?: string
}
