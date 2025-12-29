import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Booking = Database['public']['Tables']['bookings']['Row'];

interface UseRealtimeBookingsOptions {
  userId: string;
  enabled?: boolean;
  limit?: number;
  channelName?: string; // Optional unique channel name
}

interface UseRealtimeBookingsReturn {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  newBookingCount: number;
  clearNewBookingNotification: () => void;
  refetch: () => Promise<void>;
}

/**
 * Hook for real-time bookings using Supabase Realtime
 * Automatically updates when bookings are added, modified, or deleted
 */
export function useRealtimeBookings({
  userId,
  enabled = true,
  limit = 50,
  channelName,
}: UseRealtimeBookingsOptions): UseRealtimeBookingsReturn {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBookingCount, setNewBookingCount] = useState(0);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const loadingRef = useRef(false);
  const limitRef = useRef(limit);
  const userIdRef = useRef(userId);
  const enabledRef = useRef(enabled);

  // Update refs when props change
  useEffect(() => {
    limitRef.current = limit;
    userIdRef.current = userId;
    enabledRef.current = enabled;
  }, [limit, userId, enabled]);

  // Initial load of bookings - use refs to prevent dependency issues
  const loadBookings = useCallback(async () => {
    if (!userIdRef.current || !enabledRef.current || loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userIdRef.current)
        .order('start_time', { ascending: false })
        .limit(limitRef.current);

      if (err) throw err;
      setBookings(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bookings';
      setError(errorMessage);
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []); // No dependencies - uses refs instead

  // Initial load effect - only runs when userId or enabled changes
  useEffect(() => {
    if (!userId || !enabled) return;
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, enabled]); // loadBookings is stable, don't include it

  // Real-time subscription effect
  useEffect(() => {
    if (!userId || !enabled) return;

    // Cleanup any existing subscription first
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Setup real-time subscription
    const uniqueChannelName = channelName || `bookings-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Add new booking and increment counter
            setBookings(prev => [payload.new as Booking, ...prev].slice(0, limitRef.current));
            setNewBookingCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing booking
            setBookings(prev =>
              prev.map(b => (b.id === (payload.new as Booking).id ? (payload.new as Booking) : b))
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted booking
            setBookings(prev => prev.filter(b => b.id !== (payload.old as Booking).id));
          }
        }
      )
      .subscribe((status) => {
        // Only handle connection status, don't log to console
        if (status === 'SUBSCRIBED') {
          setError(null);
        }
      });

    subscriptionRef.current = channel;

    // Cleanup subscription
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [userId, enabled]);

  const clearNewBookingNotification = useCallback(() => {
    setNewBookingCount(0);
  }, []);

  const refetch = useCallback(async () => {
    await loadBookings();
  }, [loadBookings]);

  return {
    bookings,
    loading,
    error,
    newBookingCount,
    clearNewBookingNotification,
    refetch,
  };
}
