import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';

type RealtimeStatusType = 'connected' | 'reconnecting' | 'error' | 'offline';

/**
 * Real-time connection status indicator
 * Shows when the app has connection issues
 */
export function RealtimeStatus() {
  const [status, setStatus] = useState<RealtimeStatusType>('connected');
  const checkInProgressRef = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkConnection = async () => {
      // Prevent concurrent checks
      if (checkInProgressRef.current) return;
      checkInProgressRef.current = true;

      try {
        // Simple auth check - doesn't query any table
        const { error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          setStatus('error');
        } else {
          setStatus('connected');
        }
      } catch {
        if (mounted) setStatus('offline');
      } finally {
        checkInProgressRef.current = false;
      }
    };

    // Initial check after a short delay
    const initialTimeout = setTimeout(checkConnection, 1000);
    
    // Check periodically but less frequently (every 60 seconds)
    const interval = setInterval(checkConnection, 60000);

    return () => {
      mounted = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Don't show anything when connected
  if (status === 'connected') {
    return null;
  }

  const statusConfig = {
    reconnecting: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      message: 'Reconnecting to server...',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      message: 'Connection error - using cached data',
    },
    offline: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      message: 'You appear to be offline',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-3 flex items-center gap-2 text-sm ${config.text}`}>
      <p>{config.message}</p>
      <button
        onClick={() => window.location.reload()}
        className={`ml-auto text-xs font-medium ${config.text} hover:opacity-70`}
      >
        Refresh
      </button>
    </div>
  );
}
