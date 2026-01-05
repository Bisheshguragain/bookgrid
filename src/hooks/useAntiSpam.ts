/**
 * Anti-Spam Protection Hook
 * 
 * Multi-layer protection against spam bookings including:
 * - Browser fingerprinting
 * - Honeypot detection
 * - Time-based bot detection
 * - Rate limiting
 * - CAPTCHA integration for high-risk scenarios
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// FingerprintJS integration (optional - uses fallback if not installed)
let fingerprintPromise: Promise<string> | null = null;

async function getFingerprint(): Promise<string> {
  if (fingerprintPromise) return fingerprintPromise;

  fingerprintPromise = (async () => {
    try {
      // Create a fingerprint from browser properties (no external dependency)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let canvasHash = 'no-canvas';
      
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('BookAgreed', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('BookAgreed', 4, 17);
        canvasHash = canvas.toDataURL();
      }

      // WebGL fingerprint
      const gl = canvas.getContext('webgl');
      const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
      const renderer = gl ? gl.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL || 0) : 'no-webgl';
      
      // Combine multiple signals
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
        new Date().getTimezoneOffset().toString(),
        navigator.hardwareConcurrency?.toString() || 'unknown',
        renderer?.toString() || 'unknown',
        navigator.platform,
        (navigator as any).deviceMemory?.toString() || 'unknown',
        canvasHash.slice(-50), // Last 50 chars of canvas hash
      ];
      
      // Generate hash from components
      const str = components.join('|||');
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return 'fp_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36).slice(-4);
    } catch {
      // Fallback if anything fails
      return 'fp_fallback_' + Math.random().toString(36).substring(2, 15);
    }
  })();

  return fingerprintPromise;
}

interface AntiSpamState {
  isReady: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  requiresCaptcha: boolean;
  attemptId: string | null;
}

interface AntiSpamConfig {
  enableCaptcha?: boolean;
  captchaSiteKey?: string;
}

interface CheckResult {
  allowed: boolean;
  reason?: string;
  attempt_id?: string;
  require_captcha?: boolean;
}

export function useAntiSpam(_config: AntiSpamConfig = {}) {
  const [state, setState] = useState<AntiSpamState>({
    isReady: false,
    isBlocked: false,
    blockReason: null,
    requiresCaptcha: false,
    attemptId: null,
  });

  // Track form load time for bot detection
  const formLoadTime = useRef<string>(new Date().toISOString());
  const fingerprint = useRef<string | null>(null);
  const honeypotValue = useRef<string>('');

  // Initialize fingerprint on mount
  useEffect(() => {
    const init = async () => {
      try {
        fingerprint.current = await getFingerprint();
        formLoadTime.current = new Date().toISOString();
        setState(prev => ({ ...prev, isReady: true }));
      } catch {
        // Still allow booking even if fingerprint fails
        fingerprint.current = 'fp_error_' + Date.now();
        setState(prev => ({ ...prev, isReady: true }));
      }
    };

    init();
  }, []);

  /**
   * Update honeypot value - call this when the hidden field changes
   */
  const setHoneypotValue = useCallback((value: string) => {
    honeypotValue.current = value;
  }, []);

  /**
   * Reset form timing - call when navigating back to form
   */
  const resetFormTiming = useCallback(() => {
    formLoadTime.current = new Date().toISOString();
  }, []);

  /**
   * Check if booking is allowed before submitting
   */
  const checkBookingAllowed = useCallback(async (
    guestEmail: string,
    hostUserId: string,
    eventTypeId: string
  ): Promise<{ allowed: boolean; reason?: string }> => {
    try {
      // Call the comprehensive spam check function
      const { data, error } = await supabase.rpc('check_booking_allowed', {
        p_guest_email: guestEmail,
        p_fingerprint: fingerprint.current,
        p_host_user_id: hostUserId,
        p_event_type_id: eventTypeId,
        p_form_load_time: formLoadTime.current,
        p_honeypot_value: honeypotValue.current,
        p_user_agent: navigator.userAgent,
      });

      if (error) {
        console.error('Anti-spam check error:', error);
        // On error, allow booking (fail open for UX)
        return { allowed: true };
      }

      const result = data as CheckResult;

      setState(prev => ({
        ...prev,
        isBlocked: !result.allowed,
        blockReason: result.reason || null,
        requiresCaptcha: result.require_captcha || false,
        attemptId: result.attempt_id || null,
      }));

      return {
        allowed: result.allowed,
        reason: result.reason,
      };
    } catch (err) {
      console.error('Anti-spam check failed:', err);
      // On error, allow booking (fail open for UX)
      return { allowed: true };
    }
  }, []);

  /**
   * Mark booking as successful - call after booking is created
   */
  const markBookingSuccess = useCallback(async (
    guestEmail: string,
    hostUserId: string,
    bookingId?: string
  ) => {
    try {
      // Mark the attempt as successful
      if (state.attemptId) {
        await supabase.rpc('mark_booking_success', {
          p_attempt_id: state.attemptId,
        });
      }

      // Record the booking for rate limiting
      await supabase.rpc('record_booking_attempt', {
        p_guest_email: guestEmail,
        p_fingerprint: fingerprint.current,
        p_host_user_id: hostUserId,
        p_booking_id: bookingId,
      });
    } catch (err) {
      console.error('Failed to mark booking success:', err);
      // Non-critical, don't throw
    }
  }, [state.attemptId]);

  /**
   * Get honeypot field props - add this hidden field to your form
   */
  const getHoneypotFieldProps = useCallback(() => ({
    name: 'website',
    type: 'text' as const,
    autoComplete: 'off',
    tabIndex: -1,
    'aria-hidden': true,
    style: {
      opacity: 0,
      position: 'absolute' as const,
      top: 0,
      left: 0,
      height: 0,
      width: 0,
      zIndex: -1,
      pointerEvents: 'none' as const,
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setHoneypotValue(e.target.value);
    },
  }), [setHoneypotValue]);

  return {
    // State
    isReady: state.isReady,
    isBlocked: state.isBlocked,
    blockReason: state.blockReason,
    requiresCaptcha: state.requiresCaptcha,
    
    // Methods
    checkBookingAllowed,
    markBookingSuccess,
    resetFormTiming,
    getHoneypotFieldProps,
    
    // For debugging
    fingerprint: fingerprint.current,
  };
}

/**
 * CAPTCHA Component Props
 */
export interface CaptchaProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Turnstile CAPTCHA verification hook
 * Uses Cloudflare Turnstile (free, privacy-friendly alternative to reCAPTCHA)
 */
export function useTurnstileCaptcha(siteKey: string) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) {
      setIsLoading(false);
      return;
    }

    // Load Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoading(false);
    };

    script.onerror = () => {
      setError('Failed to load CAPTCHA');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [siteKey]);

  const render = useCallback((container: HTMLDivElement) => {
    if (!siteKey || !(window as any).turnstile) return;

    widgetRef.current = container;
    
    widgetId.current = (window as any).turnstile.render(container, {
      sitekey: siteKey,
      callback: (token: string) => {
        setToken(token);
      },
      'expired-callback': () => {
        setToken(null);
      },
      'error-callback': () => {
        setError('CAPTCHA verification failed');
      },
      theme: 'light',
      size: 'normal',
    });
  }, [siteKey]);

  const reset = useCallback(() => {
    if (widgetId.current && (window as any).turnstile) {
      (window as any).turnstile.reset(widgetId.current);
      setToken(null);
    }
  }, []);

  return {
    token,
    isLoading,
    error,
    isVerified: !!token,
    render,
    reset,
  };
}
