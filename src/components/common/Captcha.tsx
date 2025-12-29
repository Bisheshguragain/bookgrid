/**
 * Turnstile CAPTCHA Component
 * 
 * Uses Cloudflare Turnstile - a free, privacy-friendly CAPTCHA alternative.
 * 
 * Setup:
 * 1. Go to https://dash.cloudflare.com/?to=/:account/turnstile
 * 2. Create a site and get your Site Key
 * 3. Add VITE_TURNSTILE_SITE_KEY to your .env file
 * 4. Add TURNSTILE_SECRET_KEY to your Supabase Edge Function secrets
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Turnstile types
interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: (error: Error) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  appearance?: 'always' | 'execute' | 'interaction-only';
}

interface TurnstileInstance {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
  getResponse: (widgetId: string) => string | undefined;
}

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileCaptchaProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: Error) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

export function TurnstileCaptcha({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  size = 'normal',
  className = '',
}: TurnstileCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Turnstile script
  useEffect(() => {
    if (window.turnstile) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (existingScript) {
      window.onTurnstileLoad = () => setIsLoaded(true);
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;

    window.onTurnstileLoad = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load CAPTCHA');
      onError?.(new Error('Failed to load CAPTCHA script'));
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup widget on unmount
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [onError]);

  // Render widget when loaded
  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile || !siteKey) {
      return;
    }

    // Clear any existing widget
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignore
      }
    }

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onVerify(token);
        },
        'expired-callback': () => {
          onExpire?.();
        },
        'error-callback': (err: Error) => {
          setError('Verification failed');
          onError?.(err);
        },
        theme,
        size,
      });
    } catch (err) {
      setError('Failed to render CAPTCHA');
      onError?.(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [isLoaded, siteKey, onVerify, onExpire, onError, theme, size]);

  if (error) {
    return (
      <div className={`text-red-500 text-sm p-2 ${className}`}>
        {error}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading verification...</span>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}

/**
 * Hook for managing CAPTCHA state
 */
export function useCaptcha(siteKey: string | undefined) {
  const [token, setToken] = useState<string | null>(null);
  const [isRequired, setIsRequired] = useState(false);

  const handleVerify = useCallback((newToken: string) => {
    setToken(newToken);
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
  }, []);

  const requireCaptcha = useCallback(() => {
    setIsRequired(true);
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setIsRequired(false);
  }, []);

  return {
    token,
    isVerified: !!token,
    isRequired,
    siteKey: siteKey || '',
    requireCaptcha,
    reset,
    handleVerify,
    handleExpire,
    // Render helper
    CaptchaComponent: isRequired && siteKey ? (
      <TurnstileCaptcha
        siteKey={siteKey}
        onVerify={handleVerify}
        onExpire={handleExpire}
        theme="light"
        size="normal"
      />
    ) : null,
  };
}

/**
 * Alternative: hCaptcha Component
 * If you prefer hCaptcha over Turnstile
 */
interface HCaptchaProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  className?: string;
}

export function HCaptcha({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  size = 'normal',
  className = '',
}: HCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if already loaded
    if ((window as any).hcaptcha) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
    script.async = true;
    script.defer = true;

    script.onload = () => setIsLoaded(true);
    script.onerror = () => onError?.('Failed to load hCaptcha');

    document.head.appendChild(script);
  }, [onError]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !siteKey) return;

    try {
      (window as any).hcaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'expired-callback': onExpire,
        'error-callback': onError,
        theme,
        size,
      });
    } catch {
      onError?.('Failed to render hCaptcha');
    }
  }, [isLoaded, siteKey, onVerify, onExpire, onError, theme, size]);

  return <div ref={containerRef} className={className} />;
}
