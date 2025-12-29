import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function SupabaseTest() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Check if Supabase is initialized
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }
        
        // Test 2: Try to get session
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }
        
        setStatus('connected');
        setError(null);
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Unknown error');
      }
    };

    testConnection();
  }, []);

  if (!show && status === 'connected') {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 max-w-xs">
      <button
        onClick={() => setShow(!show)}
        className={`w-full px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
          status === 'connected' ? 'bg-green-600 hover:bg-green-700' :
          status === 'error' ? 'bg-red-600 hover:bg-red-700' :
          'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {status === 'connected' && '✓ Connected'}
        {status === 'error' && '✗ Connection Error'}
        {status === 'checking' && '⏳ Checking...'}
      </button>
      
      {show && status === 'error' && (
        <div className="absolute top-full right-0 mt-2 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg w-80">
          <h4 className="font-bold text-red-900 mb-2">Supabase Connection Error</h4>
          <p className="text-sm text-red-800 mb-3">{error}</p>
          <div className="bg-white p-3 rounded border border-red-200 text-xs">
            <p className="text-red-700 mb-2 font-semibold">Troubleshooting:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Check your internet connection</li>
              <li>Verify .env.local has VITE_SUPABASE_URL</li>
              <li>Verify .env.local has VITE_SUPABASE_ANON_KEY</li>
              <li>Check if Supabase project is active</li>
              <li>Restart the dev server (npm run dev)</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
