import React, { useEffect, useRef, useState } from 'react';
import { Link, useRouter, safeNextPath } from '../lib/router';
import { isValidEmail, isValidPhone, passwordStrength, passwordProblem, cleanText } from '../lib/validation';
import {
  loginUser,
  registerUser,
  resendConfirmation,
  signInWithGoogle,
  sendPasswordResetEmail,
  resetPassword,
  friendlyError,
  getRememberPreference,
  setRememberPreference
} from '../supabase';
import { FieldError, FormError, Spinner } from './ui';

const REMEMBERED_EMAIL_KEY = 'darzzee_remembered_email';
const RESEND_COOLDOWN = 60;

function PasswordInput({ id, value, onChange, autoComplete, describedBy, invalid }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-input-wrapper">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        maxLength={72}
        required
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

function StrengthMeter({ password }) {
  if (!password) return null;
  const s = passwordStrength(password);
  return (
    <div className="password-strength-container" aria-live="polite">
      <div className="password-strength-label">
        Strength: <span className={`strength-badge ${s.key}`}>{s.label}</span>
      </div>
      <div className="password-strength-bar-group" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`strength-bar ${s.score >= n ? `active ${s.key}` : ''}`} />
        ))}
      </div>
    </div>
  );
}

export default function AuthView({ mode, user, authReady, showToast }) {
  const { navigate, search } = useRouter();
  const next = safeNextPath(new URLSearchParams(search).get('next'), '/');
  const withNext = (path) => (next !== '/' ? `${path}?next=${encodeURIComponent(next)}` : path);

  const [view, setView] = useState(mode); // allows the local VERIFICATION step
  const [email, setEmail] = useState(() => {
    try {
      return mode === 'SIGN_IN' ? localStorage.getItem(REMEMBERED_EMAIL_KEY) || '' : '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(getRememberPreference);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [info, setInfo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const busy = useRef(false);
  const headingRef = useRef(null);

  // Route changed (e.g. /login → /signup): reset the transient form state.
  useEffect(() => {
    setView(mode);
    setPassword('');
    setConfirmPassword('');
    setFormError('');
    setFieldErrors({});
    setInfo('');
  }, [mode]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [view]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const run = async (fn) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setFormError('');
    try {
      await fn();
    } catch (err) {
      console.error('[darzzee] auth error', err?.code || err?.message);
      setFormError(friendlyError(err));
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  const validateEmailField = () => {
    if (!isValidEmail(email)) {
      setFieldErrors((f) => ({ ...f, email: 'Enter a valid email address.' }));
      return false;
    }
    return true;
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    setFieldErrors({});
    if (!validateEmailField()) return;
    if (!password) {
      setFieldErrors({ password: 'Enter your password.' });
      return;
    }
    run(async () => {
      setRememberPreference(rememberMe);
      try {
        if (rememberMe) localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
        else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      } catch { /* ignore */ }
      await loginUser(email.trim(), password);
      showToast('Signed in successfully.', 'success');
      navigate(next, { replace: true });
    });
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    const errs = {};
    if (cleanText(name, 80).length < 2) errs.name = 'Enter your full name.';
    if (!isValidPhone(phone)) errs.phone = 'Enter a valid phone number (10–15 digits).';
    if (!isValidEmail(email)) errs.email = 'Enter a valid email address.';
    const pwProblem = passwordProblem(password);
    if (pwProblem) errs.password = pwProblem;
    if (!errs.password && password !== confirmPassword) errs.confirm = 'Passwords do not match.';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    run(async () => {
      setRememberPreference(true);
      const result = await registerUser({ email: email.trim(), password, name: cleanText(name, 80), phone: phone.trim() });
      if (result.needsConfirmation) {
        setView('VERIFICATION');
        setCooldown(RESEND_COOLDOWN);
      } else {
        showToast('Account created — welcome to DARZZEE!', 'success');
        navigate(next, { replace: true });
      }
    });
  };

  const handleForgot = (e) => {
    e.preventDefault();
    setFieldErrors({});
    if (!validateEmailField()) return;
    run(async () => {
      await sendPasswordResetEmail(email.trim());
      // Same message whether or not the account exists (no account enumeration).
      setInfo('If an account exists for this email, a password reset link is on its way. Check your inbox and spam folder.');
      setCooldown(RESEND_COOLDOWN);
    });
  };

  const handleReset = (e) => {
    e.preventDefault();
    const errs = {};
    const pwProblem = passwordProblem(password);
    if (pwProblem) errs.password = pwProblem;
    if (!errs.password && password !== confirmPassword) errs.confirm = 'Passwords do not match.';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    run(async () => {
      await resetPassword(password);
      showToast('Password updated. You are signed in.', 'success');
      navigate('/profile', { replace: true });
    });
  };

  const handleResend = () =>
    run(async () => {
      await resendConfirmation(email.trim());
      setInfo('Verification email sent again.');
      setCooldown(RESEND_COOLDOWN);
    });

  const handleGoogle = () =>
    run(async () => {
      await signInWithGoogle(next);
      // Browser navigates away to Google; keep the loading state until then.
      busy.current = true;
    });

  const emailField = (autoComplete = 'email') => (
    <div className="auth-field-group">
      <label htmlFor="auth-email">Email address</label>
      <input
        id="auth-email"
        type="email"
        inputMode="email"
        autoComplete={autoComplete}
        value={email}
        maxLength={254}
        onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: undefined })); }}
        className={fieldErrors.email ? 'error-input' : ''}
        aria-invalid={Boolean(fieldErrors.email) || undefined}
        aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
        required
      />
      <FieldError id="auth-email-error">{fieldErrors.email}</FieldError>
    </div>
  );

  const submitLabel = (idle, busyLabel) => (loading ? <><Spinner /> {busyLabel}</> : idle);

  let title = '';
  let subtitle = '';
  let body = null;

  if (view === 'SIGN_IN') {
    title = 'Sign in';
    subtitle = 'Welcome back to DARZZEE';
    body = (
      <form onSubmit={handleSignIn} className="auth-form" noValidate aria-busy={loading}>
        {emailField('username')}
        <div className="auth-field-group">
          <label htmlFor="auth-password">Password</label>
          <PasswordInput
            id="auth-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: undefined })); }}
            autoComplete="current-password"
            invalid={Boolean(fieldErrors.password)}
            describedBy={fieldErrors.password ? 'auth-password-error' : undefined}
          />
          <FieldError id="auth-password-error">{fieldErrors.password}</FieldError>
        </div>
        <div className="auth-remember-row">
          <label className="checkbox-container-brutalist">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span className="checkbox-checkmark-brutalist" aria-hidden="true" />
            <span className="checkbox-label-text">Keep me signed in</span>
          </label>
          <Link to={withNext('/forgot-password')} className="auth-link-btn">Forgot password?</Link>
        </div>
        <FormError id="auth-form-error">{formError}</FormError>
        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {submitLabel('Sign in', 'Signing in…')}
        </button>
        <div className="auth-divider-text"><span>or</span></div>
        <button type="button" className="auth-social-btn" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1-.8 1.9-1.6 2.5v2.1h2.6c1.5-1.4 2.4-3.5 2.4-6.2z" />
            <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.6-2.1c-.7.5-1.7.8-2.9.8-2.3 0-4.1-1.5-4.8-3.6H2v2.2C3.5 16.1 6.1 18 9 18z" />
            <path fill="#FBBC05" d="M4.2 10.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V4.9H2C1.3 6.1 1 7.5 1 9s.3 2.9 1 4.1l2.2-2.2z" />
            <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.5-2.5C13.5 1 11.4 0 9 0 6.1 0 3.5 1.9 2 4.9l2.2 2.2C4.9 5.1 6.7 3.6 9 3.6z" />
          </svg>
          <span>Continue with Google</span>
        </button>
        <p className="auth-footer-prompt">
          Don’t have an account? <Link to={withNext('/signup')} className="auth-footer-link">Create account</Link>
        </p>
      </form>
    );
  } else if (view === 'SIGN_UP') {
    title = 'Create account';
    subtitle = 'Book tailors and track your orders';
    body = (
      <form onSubmit={handleSignUp} className="auth-form" noValidate aria-busy={loading}>
        <div className="auth-field-group">
          <label htmlFor="auth-name">Full name</label>
          <input id="auth-name" type="text" autoComplete="name" value={name} maxLength={80}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            className={fieldErrors.name ? 'error-input' : ''} aria-invalid={Boolean(fieldErrors.name) || undefined}
            aria-describedby={fieldErrors.name ? 'auth-name-error' : undefined} required />
          <FieldError id="auth-name-error">{fieldErrors.name}</FieldError>
        </div>
        <div className="auth-field-group">
          <label htmlFor="auth-phone">Phone number</label>
          <input id="auth-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} maxLength={20}
            placeholder="10-digit mobile number"
            onChange={(e) => setPhone(e.target.value)}
            className={fieldErrors.phone ? 'error-input' : ''} aria-invalid={Boolean(fieldErrors.phone) || undefined}
            aria-describedby={fieldErrors.phone ? 'auth-phone-error' : undefined} required />
          <FieldError id="auth-phone-error">{fieldErrors.phone}</FieldError>
        </div>
        {emailField()}
        <div className="auth-field-group">
          <label htmlFor="auth-password">Password</label>
          <PasswordInput id="auth-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
            invalid={Boolean(fieldErrors.password)} describedBy="auth-password-hint auth-password-error" />
          <span id="auth-password-hint" className="field-note">At least 8 characters, including a letter and a number.</span>
          <StrengthMeter password={password} />
          <FieldError id="auth-password-error">{fieldErrors.password}</FieldError>
        </div>
        <div className="auth-field-group">
          <label htmlFor="auth-confirm">Confirm password</label>
          <PasswordInput id="auth-confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password"
            invalid={Boolean(fieldErrors.confirm)} describedBy={fieldErrors.confirm ? 'auth-confirm-error' : undefined} />
          <FieldError id="auth-confirm-error">{fieldErrors.confirm}</FieldError>
        </div>
        <FormError id="auth-form-error">{formError}</FormError>
        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {submitLabel('Create account', 'Creating account…')}
        </button>
        <p className="auth-footer-prompt">
          Already have an account? <Link to={withNext('/login')} className="auth-footer-link">Sign in</Link>
        </p>
      </form>
    );
  } else if (view === 'FORGOT_PASSWORD') {
    title = 'Reset password';
    subtitle = 'We’ll email you a secure reset link';
    body = (
      <form onSubmit={handleForgot} className="auth-form" noValidate aria-busy={loading}>
        {emailField()}
        {info && <p className="form-success" role="status">{info}</p>}
        <FormError id="auth-form-error">{formError}</FormError>
        <button type="submit" className="auth-submit-btn" disabled={loading || cooldown > 0}>
          {cooldown > 0 && !loading ? `Resend in ${cooldown}s` : submitLabel('Send reset link', 'Sending…')}
        </button>
        <p className="auth-footer-prompt">
          Remembered it? <Link to={withNext('/login')} className="auth-footer-link">Back to sign in</Link>
        </p>
      </form>
    );
  } else if (view === 'RESET_PASSWORD') {
    title = 'Set a new password';
    subtitle = 'Choose a strong password you haven’t used before';
    body = !authReady ? (
      <div className="auth-form"><p className="auth-info-desc"><Spinner /> Verifying your reset link…</p></div>
    ) : !user ? (
      <div className="auth-form">
        <p className="auth-info-desc">This reset link is invalid or has expired. Request a new one to continue.</p>
        <Link to="/forgot-password" className="auth-submit-btn as-link">Request a new link</Link>
      </div>
    ) : (
      <form onSubmit={handleReset} className="auth-form" noValidate aria-busy={loading}>
        <input type="email" autoComplete="username" value={user.email || ''} readOnly hidden />
        <div className="auth-field-group">
          <label htmlFor="auth-password">New password</label>
          <PasswordInput id="auth-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
            invalid={Boolean(fieldErrors.password)} describedBy="auth-password-hint auth-password-error" />
          <span id="auth-password-hint" className="field-note">At least 8 characters, including a letter and a number.</span>
          <StrengthMeter password={password} />
          <FieldError id="auth-password-error">{fieldErrors.password}</FieldError>
        </div>
        <div className="auth-field-group">
          <label htmlFor="auth-confirm">Confirm new password</label>
          <PasswordInput id="auth-confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password"
            invalid={Boolean(fieldErrors.confirm)} describedBy={fieldErrors.confirm ? 'auth-confirm-error' : undefined} />
          <FieldError id="auth-confirm-error">{fieldErrors.confirm}</FieldError>
        </div>
        <FormError id="auth-form-error">{formError}</FormError>
        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {submitLabel('Update password', 'Updating…')}
        </button>
      </form>
    );
  } else if (view === 'VERIFICATION') {
    title = 'Check your inbox';
    subtitle = 'One more step to activate your account';
    body = (
      <div className="auth-form auth-verification">
        <div className="verification-icon-circle" aria-hidden="true">✉</div>
        <p className="auth-info-desc">
          We sent a verification link to <strong>{email}</strong>. Click the link in that email to activate your account — you’ll be signed in automatically.
        </p>
        {info && <p className="form-success" role="status">{info}</p>}
        <FormError id="auth-form-error">{formError}</FormError>
        <button type="button" className="auth-social-btn" onClick={handleResend} disabled={loading || cooldown > 0}>
          {cooldown > 0 ? `Resend email in ${cooldown}s` : submitLabel('Resend verification email', 'Sending…')}
        </button>
        <Link to={withNext('/login')} className="auth-link-btn center">Return to sign in</Link>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-modal-card">
        <div className="auth-header">
          <p className="auth-brand" aria-hidden="true">DARZZEE</p>
          <h1 ref={headingRef} tabIndex={-1}>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {body}
      </div>
    </div>
  );
}
