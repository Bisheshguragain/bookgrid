import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Reminder } from '../lib/database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeRemindersOptions {
  userId: string;
  enabled?: boolean;
}

interface ReminderStats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
}

interface UseRealtimeRemindersReturn {
  reminders: Reminder[];
  stats: ReminderStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for real-time reminders using Supabase Realtime
 * Automatically updates when reminders are added, modified, or deleted
 */
export function useRealtimeReminders({
  userId,
  enabled = true,
}: UseRealtimeRemindersOptions): UseRealtimeRemindersReturn {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<ReminderStats>({
    total: 0,
    pending: 0,
    sent: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const loadingRef = useRef(false);

  // Calculate stats from reminders
  const calculateStats = useCallback((data: Reminder[]): ReminderStats => {
    return {
      total: data.length,
      pending: data.filter((r) => r.status === 'pending').length,
      sent: data.filter((r) => r.status === 'sent').length,
      failed: data.filter((r) => r.status === 'failed').length,
    };
  }, []);

  // Initial load of reminders
  const loadReminders = useCallback(async () => {
    if (!userId || !enabled || loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('reminders')
        .select(`
          *,
          bookings(
            guest_name,
            guest_email,
            start_time,
            event_types(title)
          )
        `)
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: false });

      if (err) throw err;

      const reminderData = (data || []) as Reminder[];
      setReminders(reminderData);
      setStats(calculateStats(reminderData));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load reminders';
      setError(message);
      console.error('Error loading reminders:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [userId, enabled, calculateStats]);

  // Initial load effect
  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  // Real-time subscription effect
  useEffect(() => {
    if (!userId || !enabled) return;

    // Cleanup any existing subscription first
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    const channel = supabase
      .channel(`reminders-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'reminders',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReminder = payload.new as Reminder;
            setReminders((prev) => [newReminder, ...prev]);
            setStats((prev) => {
              const updated = { ...prev, total: prev.total + 1 };
              const status = newReminder.status as keyof ReminderStats;
              if (status in updated) {
                updated[status] = (updated[status] as number) + 1;
              }
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedReminder = payload.new as Reminder;
            const oldReminder = payload.old as Reminder;
            
            setReminders((prev) =>
              prev.map((r) => (r.id === updatedReminder.id ? updatedReminder : r))
            );
            
            // Update stats if status changed
            if (oldReminder.status !== updatedReminder.status) {
              setStats((prev) => {
                const updated = { ...prev };
                const oldStatus = oldReminder.status as keyof ReminderStats;
                const newStatus = updatedReminder.status as keyof ReminderStats;
                
                if (oldStatus in updated) {
                  updated[oldStatus] = Math.max(0, (updated[oldStatus] as number) - 1);
                }
                if (newStatus in updated) {
                  updated[newStatus] = (updated[newStatus] as number) + 1;
                }
                
                return updated;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedReminder = payload.old as Reminder;
            setReminders((prev) => prev.filter((r) => r.id !== deletedReminder.id));
            setStats((prev) => {
              const updated = { ...prev, total: prev.total - 1 };
              const status = deletedReminder.status as keyof ReminderStats;
              if (status in updated) {
                updated[status] = Math.max(0, (updated[status] as number) - 1);
              }
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        // Handle connection status without logging
        if (status === 'SUBSCRIBED') {
          setError(null);
        }
      });

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [userId, enabled]);

  const refetch = useCallback(async () => {
    await loadReminders();
  }, [loadReminders]);

  return {
    reminders,
    stats,
    loading,
    error,
    refetch,
  };
}
