/**
 * Supabase Edge Function: Check Booking Rate Limit
 * 
 * This function captures the real client IP address and performs
 * comprehensive anti-spam checks before allowing a booking.
 * 
 * Deploy with: supabase functions deploy check-booking-limit
 * 
 * Note: This file uses Deno imports which are valid for Supabase Edge Functions
 * but may show errors in VS Code. Install the Deno extension for proper support.
 */

// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  guestEmail: string;
  fingerprint?: string;
  hostUserId: string;
  eventTypeId: string;
  formLoadTime?: string;
  honeypotValue?: string;
  userAgent?: string;
  turnstileToken?: string;  // Optional CAPTCHA token
}

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  attempt_id?: string;
  require_captcha?: boolean;
}

// Simple IP hash function (we don't store raw IPs for privacy)
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'ip_' + Math.abs(hash).toString(36);
}

// Get client IP from various headers
function getClientIP(req: Request): string {
  // Cloudflare
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;

  // X-Forwarded-For (may contain multiple IPs)
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const ips = xff.split(',').map(ip => ip.trim());
    return ips[0]; // First IP is the client
  }

  // X-Real-IP (nginx)
  const xRealIP = req.headers.get('x-real-ip');
  if (xRealIP) return xRealIP;

  // Fly.io
  const flyIP = req.headers.get('fly-client-ip');
  if (flyIP) return flyIP;

  // True-Client-IP (Akamai, Cloudflare Enterprise)
  const trueClientIP = req.headers.get('true-client-ip');
  if (trueClientIP) return trueClientIP;

  return 'unknown';
}

// Verify Cloudflare Turnstile CAPTCHA token
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
  
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY not set, skipping verification');
    return true;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json();
    const { 
      guestEmail, 
      fingerprint, 
      hostUserId, 
      eventTypeId,
      formLoadTime,
      honeypotValue,
      userAgent,
      turnstileToken,
    } = body;

    // Validate required fields
    if (!guestEmail || !hostUserId || !eventTypeId) {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'Missing required fields' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get client IP
    const clientIP = getClientIP(req);
    const ipHash = hashIP(clientIP);

    // Create Supabase client with service role (to bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // =============================================
    // LAYER 1: IP-based rate limiting
    // =============================================
    // Check IP rate limit before other checks
    const { data: ipCheckData, error: ipCheckError } = await supabase
      .from('booking_rate_limits')
      .select('id')
      .eq('identifier', ipHash)
      .eq('identifier_type', 'ip_hash')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

    if (!ipCheckError && ipCheckData && ipCheckData.length >= 15) {
      // Log this blocked attempt
      await supabase.from('booking_attempts_log').insert({
        guest_email: guestEmail.toLowerCase(),
        fingerprint,
        ip_hash: ipHash,
        event_type_id: eventTypeId,
        host_user_id: hostUserId,
        was_allowed: false,
        block_reason: 'ip_rate_limit',
        user_agent: userAgent,
      });

      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'Too many requests. Please try again later.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // =============================================
    // LAYER 2: Verify CAPTCHA if provided
    // =============================================
    if (turnstileToken) {
      const isValidCaptcha = await verifyTurnstile(turnstileToken, clientIP);
      
      if (!isValidCaptcha) {
        return new Response(
          JSON.stringify({ 
            allowed: false, 
            reason: 'CAPTCHA verification failed. Please try again.' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // =============================================
    // LAYER 3: Call comprehensive spam check
    // =============================================
    const { data, error } = await supabase.rpc('check_booking_allowed', {
      p_guest_email: guestEmail,
      p_fingerprint: fingerprint || null,
      p_host_user_id: hostUserId,
      p_event_type_id: eventTypeId,
      p_form_load_time: formLoadTime || null,
      p_honeypot_value: honeypotValue || null,
      p_ip_hash: ipHash,
      p_user_agent: userAgent || req.headers.get('user-agent'),
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow booking if check fails
      return new Response(
        JSON.stringify({ allowed: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data as RateLimitResult;

    // =============================================
    // LAYER 4: Record IP for rate limiting
    // =============================================
    if (result.allowed) {
      // Record IP-based attempt for future rate limiting
      await supabase.from('booking_rate_limits').insert({
        identifier: ipHash,
        identifier_type: 'ip_hash',
        host_user_id: hostUserId,
      });
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    // Fail open - allow booking if function fails
    return new Response(
      JSON.stringify({ allowed: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
