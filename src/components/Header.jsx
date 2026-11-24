import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Link } from '../lib/router';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/tailors', label: 'Book Tailor' },
  { to: '/alterations', label: 'Alter Service' },
  { to: '/join', label: 'Join as Tailor' }
];

/** Isolated so the per-second tick re-renders only this text, not the app. */
function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <time className="clock" dateTime={time.toISOString()}>
      {time.toLocaleTimeString('en-GB', { hour12: false })}
    </time>
  );
}

export default function Header({ pathname, user, authReady, isAdmin, bookingsCount }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef(null);
  const drawerRef = useRef(null);

  // Close the drawer whenever the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Drawer behaviour: Escape closes, focus is moved in and trapped, page
  // scrolling is paused, and focus returns to the toggle on close.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const drawer = drawerRef.current;
    const focusables = () => drawer?.querySelectorAll('a[href], button:not([disabled])') || [];
    (drawer?.querySelector('.mobile-menu-links a') || focusables()[0])?.focus();
    window.lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        return;
      }
      if (e.key === 'Tab') {
        const items = Array.from(focusables());
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const toggle = toggleRef.current;
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      window.lenis?.start();
      toggle?.focus();
    };
  }, [menuOpen]);

  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
  const bookingsBadge = (
    <span className="cart-count" aria-label={`${bookingsCount} bookings`}>{bookingsCount}</span>
  );

  const accountLinks = !authReady ? null : user ? (
    <>
      <Link to="/profile" className={pathname === '/profile' ? 'active' : ''} aria-current={pathname === '/profile' ? 'page' : undefined}>
        Profile
      </Link>
      <Link to="/profile#bookings">Bookings {bookingsBadge}</Link>
      {isAdmin && (
        <Link to="/admin" className={pathname === '/admin' ? 'active' : ''} aria-current={pathname === '/admin' ? 'page' : undefined}>
          Admin
        </Link>
      )}
    </>
  ) : (
    <Link to={`/login?next=${encodeURIComponent(pathname)}`} className="nav-signin">Sign in</Link>
  );

  return (
    <header className="site-header">
      <div className="header-top">
        <Link to="/" className="logo-container" aria-label="DARZZEE home">
          <span className="logo-text">DARZZEE</span>
        </Link>
        <div className="header-meta" aria-hidden="true">
          <div className="location">INDIA, IN</div>
          <LiveClock />
        </div>
        <button
          ref={toggleRef}
          type="button"
          className="mobile-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? 'Close' : 'Menu'}
          <span aria-hidden="true">{menuOpen ? ' ×' : ' ☰'}</span>
        </button>
      </div>

      <nav className="header-nav" aria-label="Main">
        <div className="nav-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={isActive(l.to) ? 'active' : ''} aria-current={isActive(l.to) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          <Link to="/tailors#search">Search</Link>
          {accountLinks}
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <>
            <m.div
              className="mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <m.div
              id="mobile-menu"
              ref={drawerRef}
              className="mobile-menu-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              data-lenis-prevent
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            >
              <div className="mobile-menu-header">
                <span className="mobile-menu-logo">DARZZEE</span>
                <button type="button" className="mobile-menu-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  ×
                </button>
              </div>
              <nav className="mobile-menu-links" aria-label="Mobile">
                {NAV_LINKS.map((l) => (
                  <Link key={l.to} to={l.to} className={isActive(l.to) ? 'active' : ''} aria-current={isActive(l.to) ? 'page' : undefined}>
                    {l.label}
                  </Link>
                ))}
                <div className="mobile-menu-divider" />
                <Link to="/tailors#search">Search</Link>
                {accountLinks}
              </nav>
              <div className="mobile-menu-footer" aria-hidden="true">
                <div>INDIA, IN</div>
                <LiveClock />
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
