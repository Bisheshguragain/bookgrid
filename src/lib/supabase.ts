import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Note: Supabase URL and anon key are safe to expose client-side
// They are public and RLS policies protect data

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'calendly-clone/1.0.0',
    },
    fetch: (url, options = {}) => {
      // Fix for 406 errors - ensure proper Content-Type headers
      const headers = new Headers(options.headers || {});
      
      // Only set Content-Type if there's a body and no Content-Type is set
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      
      return fetch(url, {
        ...options,
        headers,
      });
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Test connection on initialization (silent - no console logs)
supabase.auth.getSession().catch(() => {
  // Silent fail - ConnectionStatus component will show errors
});

export default supabase;
