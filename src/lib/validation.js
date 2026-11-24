// Client-side validation is for user experience only. Every rule here must
// also be enforced server-side (database constraints / RLS / storage policies).

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value || '').trim()) && String(value).length <= 254;
}

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

/** Accepts Indian and international numbers: 10–15 digits after stripping. */
export function isValidPhone(value) {
  const d = digitsOnly(value);
  return d.length >= 10 && d.length <= 15;
}

export function isValidPincode(value) {
  return /^[1-9][0-9]{5}$/.test(String(value || '').trim());
}

/** Trim, collapse control characters and cap length of free text. */
export function cleanText(value, max = 500) {
  return String(value || '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export const PASSWORD_MIN = 8;

export function passwordStrength(pwd) {
  if (!pwd) return { score: 0, label: 'EMPTY', key: 'empty' };
  if (pwd.length < PASSWORD_MIN) return { score: 1, label: 'TOO SHORT', key: 'too_short' };
  let score = 1;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score += 1;
  const key = score >= 4 ? 'strong' : score >= 3 ? 'medium' : 'weak';
  return { score, label: key.toUpperCase(), key };
}

/** Minimum acceptable password: 8+ chars, at least one letter and one number. */
export function passwordProblem(pwd) {
  if (!pwd || pwd.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (!/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd)) return 'Password must include at least one letter and one number.';
  if (pwd.length > 72) return 'Password must be 72 characters or fewer.';
  return null;
}

export function inRange(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}
