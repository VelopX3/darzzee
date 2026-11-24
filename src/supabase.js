import { createClient } from '@supabase/supabase-js';
import { friendlyError, isAdminUser, initialUrl } from './lib/auth-utils';

export { friendlyError, isAdminUser, initialUrl };

// Public, browser-safe values only (Supabase URL + anon/publishable key).
// Row Level Security on the database is what protects data — never put a
// service-role key in a VITE_ variable.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);


if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn('[darzzee] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. Copy .env.example to .env.local.');
}

// ---------------------------------------------------------------------------
// "Remember me": persist the session in localStorage, otherwise only for the
// lifetime of the browser tab (sessionStorage).
// ---------------------------------------------------------------------------
const REMEMBER_KEY = 'darzzee_remember_session';

function safeStorage(kind) {
  try {
    const s = window[kind];
    const probe = '__darzzee_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

const local = typeof window !== 'undefined' ? safeStorage('localStorage') : null;
const session = typeof window !== 'undefined' ? safeStorage('sessionStorage') : null;
const memory = new Map();

export function getRememberPreference() {
  return local?.getItem(REMEMBER_KEY) !== 'false';
}

export function setRememberPreference(remember) {
  local?.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
}

const authStorage = {
  getItem(key) {
    return local?.getItem(key) ?? session?.getItem(key) ?? memory.get(key) ?? null;
  },
  setItem(key, value) {
    const target = getRememberPreference() ? local : session;
    if (target) {
      target.setItem(key, value);
      // Make sure a stale copy does not linger in the other store.
      (target === local ? session : local)?.removeItem(key);
    } else {
      memory.set(key, value);
    }
  },
  removeItem(key) {
    local?.removeItem(key);
    session?.removeItem(key);
    memory.delete(key);
  }
};

// Every Supabase request gets a timeout so the UI can never hang forever on
// a stalled network request. Respects any abort signal supabase-js passes in.
const REQUEST_TIMEOUT_MS = 15000;
const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const upstream = options.signal;
  if (upstream) {
    if (upstream.aborted) controller.abort();
    else upstream.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
};

export const supabase = createClient(
  // createClient throws on an empty URL; a non-routable placeholder keeps the
  // app rendering (public pages still work) when env vars are missing.
  isSupabaseConfigured ? supabaseUrl : 'https://not-configured.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'not-configured',
  {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: { fetch: fetchWithTimeout }
  }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function assertConfigured() {
  if (!isSupabaseConfigured) {
    const err = new Error('Service is not configured.');
    err.code = 'not_configured';
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Subscribes to auth state. The callback receives (event, session).
 * Supabase emits INITIAL_SESSION on subscribe, so no separate getSession call
 * is needed. The callback is deferred so that any Supabase call made inside
 * it cannot deadlock on the auth lock (documented supabase-js pitfall).
 */
export function subscribeToAuthChanges(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, sess) => {
    setTimeout(() => callback(event, sess), 0);
  });
  return () => data?.subscription?.unsubscribe();
}

export async function registerUser({ email, password, name, phone }) {
  assertConfigured();
  const cleanName = name.trim().toUpperCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: cleanName,
        phone,
        profile: { name: cleanName, email: email.toUpperCase(), phone }
      }
    }
  });
  if (error) throw error;

  // With email confirmation enabled, Supabase does not reveal whether the
  // address is taken: it returns a user with no identities instead.
  if (!data?.user || (Array.isArray(data.user.identities) && data.user.identities.length === 0)) {
    const err = new Error('User already registered');
    err.code = 'user_already_exists';
    throw err;
  }

  if (data.session) {
    // Confirmation disabled: the user is signed in immediately.
    await upsertProfileRow(data.user.id, { name: cleanName, email, phone });
  }
  return { user: data.user, session: data.session, needsConfirmation: !data.session };
}

export async function resendConfirmation(email) {
  assertConfigured();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
}

export async function loginUser(email, password) {
  assertConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signInWithGoogle(returnTo = '/') {
  assertConfigured();
  try {
    sessionStorage.setItem('darzzee_oauth_return', returnTo);
  } catch { /* storage unavailable — fall back to home */ }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) throw error;
  // The browser now navigates to Google; nothing else to do here.
}

export function consumeOAuthReturnPath() {
  try {
    const p = sessionStorage.getItem('darzzee_oauth_return');
    sessionStorage.removeItem('darzzee_oauth_return');
    return p;
  } catch {
    return null;
  }
}

export async function logoutUser() {
  // Local scope: always clears this browser's session, even if the network
  // call to revoke the refresh token fails.
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function sendPasswordResetEmail(email) {
  assertConfigured();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '?type=recovery'
  });
  if (error) throw error;
}

export async function resetPassword(newPassword) {
  assertConfigured();
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
async function upsertProfileRow(userId, { name, email, phone }) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    name: name.toUpperCase(),
    email: email.toUpperCase(),
    phone,
    updated_at: new Date().toISOString()
  });
  if (error) {
    console.warn('[darzzee] profiles upsert failed, metadata fallback in use:', error.code);
    return false;
  }
  return true;
}

export async function getUserProfile(user) {
  const meta = user?.user_metadata || {};
  const fromMeta = {
    name: meta.profile?.name || meta.full_name || meta.name || '',
    email: (user?.email || meta.profile?.email || '').toUpperCase(),
    phone: meta.profile?.phone || meta.phone || ''
  };
  if (!user?.id) return fromMeta;

  const { data, error } = await supabase.from('profiles').select('name, email, phone').eq('id', user.id).maybeSingle();
  if (error || !data) return fromMeta;
  return {
    name: data.name || fromMeta.name,
    email: (user.email || data.email || '').toUpperCase(),
    phone: data.phone || fromMeta.phone
  };
}

export async function saveUserProfile(user, profileData) {
  assertConfigured();
  const name = profileData.name.trim().toUpperCase();
  const phone = profileData.phone.trim();
  const email = user.email || profileData.email;

  const tableOk = await upsertProfileRow(user.id, { name, email, phone });
  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: name,
      phone,
      profile: { name, email: email.toUpperCase(), phone }
    }
  });
  if (error && !tableOk) throw error;
  return { name, email: email.toUpperCase(), phone };
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------
// Fields added after the original bookings table was created. If the live
// table does not have these columns yet, they are nested inside the
// `measurements` JSON so nothing the customer typed is lost.
const EXTENDED_BOOKING_FIELDS = ['notes', 'requestType', 'photoPath'];

function isMissingColumnError(error) {
  return error && (error.code === 'PGRST204' || error.code === '42703');
}

export async function getUserBookings(userId) {
  if (!userId || !isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('userId', userId)
    .order('timestamp', { ascending: false });

  const tableRows = !error && Array.isArray(data) ? data : [];

  // Legacy fallback: bookings saved in user_metadata when the table insert failed.
  const { data: userData } = await supabase.auth.getUser();
  const metaRows = Array.isArray(userData?.user?.user_metadata?.bookings) ? userData.user.user_metadata.bookings : [];

  const seen = new Set(tableRows.map((b) => b.id));
  const merged = [...tableRows, ...metaRows.filter((b) => b && !seen.has(b.id))];
  return merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

export async function createBooking(userId, bookingData) {
  assertConfigured();
  if (!userId) throw new Error('Not signed in');

  const record = {
    ...bookingData,
    id: bookingData.id || `bk-${crypto.randomUUID()}`,
    userId,
    timestamp: Date.now()
  };

  let { data, error } = await supabase.from('bookings').insert([record]).select();

  if (isMissingColumnError(error)) {
    const legacy = { ...record };
    const extras = {};
    for (const f of EXTENDED_BOOKING_FIELDS) {
      if (legacy[f] !== undefined) {
        extras[f] = legacy[f];
        delete legacy[f];
      }
    }
    legacy.measurements = { ...(legacy.measurements || {}), ...extras };
    ({ data, error } = await supabase.from('bookings').insert([legacy]).select());
  }

  if (!error && data?.[0]) return data[0];

  // Last resort (pre-existing behaviour): keep the booking on the user's
  // account metadata so it is not lost if the bookings table is unavailable.
  console.warn('[darzzee] bookings insert failed, saving to account metadata:', error?.code);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const existing = userData?.user?.user_metadata || {};
  const current = Array.isArray(existing.bookings) ? existing.bookings : [];
  const { error: updateError } = await supabase.auth.updateUser({
    data: { ...existing, bookings: [record, ...current] }
  });
  if (updateError) throw updateError;
  return record;
}

export async function getAllBookings() {
  assertConfigured();
  const { data, error } = await supabase.from('bookings').select('*').order('timestamp', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateBookingStatus(bookingId, status) {
  assertConfigured();
  const { data, error } = await supabase.from('bookings').update({ status }).eq('id', bookingId).select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    const err = new Error('No booking updated (missing permission or booking not found).');
    err.code = 'not_updated';
    throw err;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Uploads (alteration photos, tailor portfolios)
// ---------------------------------------------------------------------------
const IMAGE_TYPES = { 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'] };
export const UPLOAD_RULES = {
  photo: {
    types: IMAGE_TYPES,
    maxBytes: 5 * 1024 * 1024,
    accept: 'image/jpeg,image/png,image/webp',
    hint: 'JPG, PNG or WEBP, up to 5 MB'
  },
  document: {
    types: { ...IMAGE_TYPES, 'application/pdf': ['pdf'] },
    maxBytes: 25 * 1024 * 1024,
    accept: 'image/jpeg,image/png,image/webp,application/pdf',
    hint: 'PDF, JPG, PNG or WEBP, up to 25 MB'
  }
};

/** Returns an error message, or null when the file is acceptable. */
export function validateUpload(file, kind = 'photo') {
  if (!file) return null;
  const rule = UPLOAD_RULES[kind];
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const allowedExts = rule.types[file.type];
  if (!allowedExts || !allowedExts.includes(ext)) return `Unsupported file type. Allowed: ${rule.hint}.`;
  if (file.size > rule.maxBytes) return `File is too large. Allowed: ${rule.hint}.`;
  return null;
}

/**
 * Uploads to a private Storage bucket under the user's own folder, renamed to
 * a random UUID (the original filename is never used). Bucket-level MIME/size
 * limits and storage policies must also be configured in Supabase.
 */
export async function uploadUserFile(bucket, userId, file, kind = 'photo') {
  assertConfigured();
  const problem = validateUpload(file, kind);
  if (problem) throw new Error(problem);
  const ext = UPLOAD_RULES[kind].types[file.type][0];
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false
  });
  if (error) throw error;
  return path;
}

// ---------------------------------------------------------------------------
// Tailor applications & newsletter
// ---------------------------------------------------------------------------
export async function submitTailorApplication(userId, application) {
  assertConfigured();
  const { error } = await supabase.from('tailor_applications').insert([{ ...application, user_id: userId }]);
  if (error) throw error;
}

export async function subscribeNewsletter(email) {
  assertConfigured();
  const { error } = await supabase.from('newsletter_subscribers').insert([{ email: email.toLowerCase() }]);
  if (error && error.code !== '23505') throw error; // duplicate = already subscribed
}
