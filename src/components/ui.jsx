import React from 'react';
import { Link, useRouter } from '../lib/router';

/** onError handler for remote images: swap in a blank pixel so the tile keeps
 *  its neutral placeholder background instead of a broken-image icon. */
export function hideBrokenImage(e) {
  const img = e.currentTarget;
  if (img.dataset.failed) return;
  img.dataset.failed = '1';
  img.removeAttribute('srcset');
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
}

export function Spinner({ size = 16 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <Spinner size={22} />
      <span>{label}</span>
    </div>
  );
}

export function NotFound({
  title = 'Page not found',
  message = 'The page you are looking for does not exist or has moved.',
  ctaTo = '/',
  ctaLabel = 'Back to home'
}) {
  return (
    <section className="empty-state-page">
      <p className="eyebrow">404</p>
      <h1 className="page-title">{title}</h1>
      <p className="page-lede">{message}</p>
      <Link to={ctaTo} className="btn btn-primary">{ctaLabel}</Link>
    </section>
  );
}

/** Shown in place of a form that requires an account. */
export function SignInPrompt({ title = 'Sign in to continue', message }) {
  const { pathname, search } = useRouter();
  const next = encodeURIComponent(pathname + search);
  return (
    <div className="signin-prompt">
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      <div className="signin-prompt-actions">
        <Link to={`/login?next=${next}`} className="btn btn-primary">Sign in</Link>
        <Link to={`/signup?next=${next}`} className="btn btn-secondary">Create account</Link>
      </div>
    </div>
  );
}

export function FormError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="form-error" role="alert">
      {children}
    </p>
  );
}

export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <span id={id} className="field-error">
      {children}
    </span>
  );
}
