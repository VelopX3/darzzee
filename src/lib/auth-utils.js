// Small, dependency-free auth helpers that are safe to ship in the initial
// bundle. The Supabase client itself (src/supabase.js) is loaded lazily.

// Captured at startup, before supabase-js consumes (and strips) auth tokens
// from the URL, so the app can tell which email link (signup / recovery /
// error) the user arrived from.
export const initialUrl = typeof window !== 'undefined' ? window.location.href : '';

const ADMIN_EMAILS = ['admin@darzzee.com'];

/**
 * UI-level admin check. This only controls what the interface shows — real
 * authorization MUST be enforced by Row Level Security policies in Supabase.
 * `app_metadata` can only be set server-side, so a role there is trusted.
 */
export function isAdminUser(user) {
  if (!user) return false;
  if (user.app_metadata?.role === 'admin') return true;
  return ADMIN_EMAILS.includes((user.email || '').toLowerCase());
}

/** Maps Supabase / network errors to short, user-safe messages. */
export function friendlyError(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  const code = err.code || err.error_code || '';
  const msg = (err.message || '').toLowerCase();
  if (code === 'not_configured') return 'Service is temporarily unavailable. Please try again later.';
  if (err.name === 'AbortError' || msg.includes('abort') || msg.includes('failed to fetch') || msg.includes('network') || msg.includes('load failed')) {
    return 'Network problem — check your connection and try again.';
  }
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'Please verify your email first — check your inbox for the confirmation link.';
  if (code === 'user_already_exists' || msg.includes('already registered')) return 'An account with this email already exists. Try signing in.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || err.status === 429 || msg.includes('rate limit')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (code === 'weak_password' || msg.includes('password should')) return 'Password is too weak. Use at least 8 characters with letters and numbers.';
  if (code === 'same_password') return 'Your new password must be different from the old one.';
  if (code === 'otp_expired' || msg.includes('expired')) return 'This link has expired. Please request a new one.';
  if (code === 'session_not_found' || code === 'bad_jwt' || msg.includes('jwt')) return 'Your session has expired. Please sign in again.';
  return fallback;
}

let apiPromise;
/** Lazily loads the Supabase-backed API module (kept off the critical path). */
export function loadApi() {
  if (!apiPromise) {
    apiPromise = import('../supabase').catch((err) => {
      apiPromise = undefined; // allow a retry after a failed chunk load
      throw err;
    });
  }
  return apiPromise;
}
