import React, { useRef, useState } from 'react';
import { Link } from '../lib/router';
import { isValidEmail } from '../lib/validation';
import { friendlyError, loadApi } from '../lib/auth-utils';

export default function Footer({ isAdmin, showToast }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');
  const busy = useRef(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy.current) return;
    const value = email.trim();
    if (!isValidEmail(value)) {
      setError('Enter a valid email address.');
      return;
    }
    busy.current = true;
    setError('');
    setStatus('sending');
    try {
      const { subscribeNewsletter } = await loadApi();
      await subscribeNewsletter(value);
      setStatus('done');
      setEmail('');
      showToast('You’re on the list — we’ll keep you posted.', 'success');
    } catch (err) {
      console.error('[darzzee] newsletter signup failed', err?.code);
      setStatus('error');
      setError(friendlyError(err, 'Could not subscribe right now. Please try again later.'));
    } finally {
      busy.current = false;
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-nav">
        <nav className="footer-links" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/tailors">Tailors</Link>
          <Link to="/alterations">Alterations</Link>
          <Link to="/join">Join Us</Link>
          <Link to="/profile">Profile</Link>
          {isAdmin && <Link to="/admin">Admin</Link>}
        </nav>
        <form className="footer-signup" onSubmit={onSubmit} noValidate>
          <label htmlFor="newsletter-email" className="visually-hidden">Email address for updates</label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Your email address"
            className="signup-input"
            value={email}
            maxLength={254}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'newsletter-error' : undefined}
          />
          <button type="submit" className="signup-btn" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Notify Me'}
          </button>
          {error && <span id="newsletter-error" className="field-error footer-error" role="alert">{error}</span>}
        </form>
      </div>
      <div className="footer-copyright">
        <div>DARZZEE © {new Date().getFullYear()}</div>
        <div className="footer-copyright-center">Boutique custom tailor service</div>
        <div>Made with care in India</div>
      </div>
    </footer>
  );
}
