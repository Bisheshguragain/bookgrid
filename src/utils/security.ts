/**
 * Security Utilities for BookGrid
 * Provides XSS protection, input sanitization, and security helpers
 */

// =====================================================
// XSS PROTECTION
// =====================================================

/**
 * Strip all HTML tags from a string
 * Use this for plain text fields that should never contain HTML
 * Note: For rich text, install and use DOMPurify
 */
export function stripHTML(str: string): string {
  // Basic HTML stripping - for production, use DOMPurify
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML special characters
 */
export function escapeHTML(str: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}

// =====================================================
// INPUT VALIDATION
// =====================================================

/**
 * Validate and sanitize username
 * Only allows alphanumeric, underscore, and hyphen
 */
export function sanitizeUsername(username: string): string {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 30);
}

/**
 * Validate email format (additional check beyond Zod)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Sanitize and truncate text input
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  return stripHTML(text).trim().slice(0, maxLength);
}

// =====================================================
// RATE LIMITING (CLIENT-SIDE)
// =====================================================

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  check(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(
      (timestamp) => now - timestamp < config.windowMs
    );
    
    if (recentAttempts.length >= config.maxAttempts) {
      return false; // Rate limit exceeded
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true; // Allow
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Rate limit for login attempts (5 per 15 minutes)
 */
export function checkLoginRateLimit(email: string): boolean {
  return rateLimiter.check(`login:${email}`, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Rate limit for signup attempts (3 per 60 minutes)
 */
export function checkSignupRateLimit(email: string): boolean {
  return rateLimiter.check(`signup:${email}`, {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 60 minutes
  });
}

/**
 * Rate limit for password reset (3 per 60 minutes)
 */
export function checkPasswordResetRateLimit(email: string): boolean {
  return rateLimiter.check(`reset:${email}`, {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 60 minutes
  });
}

// =====================================================
// TOKEN VALIDATION
// =====================================================

/**
 * Check if a booking token is expired
 */
export function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// =====================================================
// CONTENT SECURITY
// =====================================================

/**
 * Safe URL checker - prevents javascript:, data:, and other dangerous protocols
 */
export function isSafeURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    const safeProtocols = ['http:', 'https:', 'mailto:'];
    return safeProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize URL for safe use in links
 */
export function sanitizeURL(url: string): string {
  if (!url) return '#';
  
  // Remove any whitespace
  const trimmed = url.trim();
  
  // Check if it's a safe URL
  if (!isSafeURL(trimmed)) {
    return '#';
  }
  
  return trimmed;
}

// =====================================================
// LOGGING SANITIZATION
// =====================================================

/**
 * Mask sensitive data in logs
 */
export function maskSensitiveData(data: any): any {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key'];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const masked = { ...data };
  
  for (const key in masked) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      masked[key] = '***REDACTED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  
  return masked;
}

/**
 * Safe console.log for production
 * Only logs in development, masks sensitive data
 */
export function safeLog(message: string, data?: any): void {
  if (import.meta.env.DEV) {
    if (data) {
      console.log(message, maskSensitiveData(data));
    } else {
      console.log(message);
    }
  }
}

/**
 * Safe console.error for production
 * Logs to error tracking service in production
 */
export function safeError(message: string, error?: any): void {
  if (import.meta.env.DEV) {
    console.error(message, maskSensitiveData(error));
  } else {
    // TODO: Send to error tracking service (e.g., Sentry)
    // Sentry.captureException(error, { extra: { message } });
  }
}

// =====================================================
// CSRF PROTECTION
// =====================================================

/**
 * Generate CSRF token for forms
 * Note: Supabase handles most CSRF via JWT, but this adds extra layer
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in session storage
 */
export function setCSRFToken(): string {
  const token = generateCSRFToken();
  sessionStorage.setItem('csrf_token', token);
  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken === token;
}

// =====================================================
// FILE UPLOAD SECURITY (For future use)
// =====================================================

/**
 * Validate file type for uploads
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSizeMB: number): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Safe file name (remove special characters)
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 255);
}

// =====================================================
// EXPORTS
// =====================================================

export const SecurityUtils = {
  // XSS Protection
  stripHTML,
  escapeHTML,
  
  // Input Validation
  sanitizeUsername,
  isValidEmail,
  sanitizeText,
  
  // Rate Limiting
  checkLoginRateLimit,
  checkSignupRateLimit,
  checkPasswordResetRateLimit,
  
  // Token Validation
  isTokenExpired,
  isValidUUID,
  
  // URL Security
  isSafeURL,
  sanitizeURL,
  
  // Logging
  safeLog,
  safeError,
  maskSensitiveData,
  
  // CSRF
  setCSRFToken,
  validateCSRFToken,
  
  // File Uploads
  isValidFileType,
  isValidFileSize,
  sanitizeFileName,
};

export default SecurityUtils;
