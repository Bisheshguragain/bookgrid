// Debug utility to check environment variables
// NOTE: Only use in development - never log actual values in production
export function debugEnv() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Only show if variables are set, never log actual values
  return {
    urlSet: !!supabaseUrl,
    keySet: !!supabaseKey,
  };
}
