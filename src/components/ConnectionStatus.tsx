import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check connection status with longer timeout
    const checkConnection = async () => {
      try {
        // Increase timeout for slow connections
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );
        
        const sessionCheck = supabase.auth.getSession();
        
        await Promise.race([sessionCheck, timeout]);
        
        setIsConnected(true);
        setErrorMessage('');
      } catch (error: any) {
        console.error('Connection check failed:', error);
        setIsConnected(false);
        setErrorMessage(error?.message || 'Connection failed');
      }
    };

    checkConnection();
    
    // Check every 15 seconds (less frequent to reduce noise)
    const interval = setInterval(checkConnection, 15000);

    return () => clearInterval(interval);
  }, []);

  if (isConnected) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg flex items-start space-x-3 cursor-pointer hover:shadow-xl transition-shadow max-w-sm"
        onClick={() => setShowStatus(!showStatus)}
      >
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900 text-sm">Connection Slow</h3>
          {showStatus && (
            <div className="text-xs text-yellow-800 mt-2 bg-yellow-100 p-2 rounded">
              <p>Network may be slow. Retrying connection...</p>
              {errorMessage && <p className="mt-1 text-red-700">Error: {errorMessage}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
