import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LazyMotion, m } from 'framer-motion';

import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import TailorsView from './components/TailorsView';
import CustomCursor from './components/CustomCursor';
import { PageLoader, NotFound } from './components/ui';
import { RouterProvider, useRouter, safeNextPath } from './lib/router';
import { applyPageMeta } from './lib/seo';
import { loadTailors, saveTailors, TAILORS_DATA } from './data/tailors';
import { isAdminUser, friendlyError, initialUrl, loadApi } from './lib/auth-utils';

// Animation features are code-split and loaded after first paint.
const loadMotionFeatures = () => import('./lib/motion-features').then((mod) => mod.default);

// Route-level code splitting: the two main landing pages (home, tailors)
// ship in the initial bundle; everything else loads on demand.
const BookingView = lazy(() => import('./components/BookingView'));
const AlterationView = lazy(() => import('./components/AlterationView'));
const JoinView = lazy(() => import('./components/JoinView'));
const ProfileView = lazy(() => import('./components/ProfileView'));
const AdminView = lazy(() => import('./components/AdminView'));
const AuthView = lazy(() => import('./components/AuthView'));

const AUTH_ROUTES = {
  '/login': 'SIGN_IN',
  '/signup': 'SIGN_UP',
  '/forgot-password': 'FORGOT_PASSWORD',
  '/reset-password': 'RESET_PASSWORD'
};
const PROTECTED_ROUTES = ['/profile', '/admin'];

function matchRoute(pathname) {
  if (pathname === '/') return { name: 'home' };
  if (pathname === '/tailors') return { name: 'tailors' };
  if (pathname === '/alterations') return { name: 'alterations' };
  if (pathname === '/join') return { name: 'join' };
  if (pathname === '/profile') return { name: 'profile' };
  if (pathname === '/admin') return { name: 'admin' };
  if (AUTH_ROUTES[pathname]) return { name: 'auth', mode: AUTH_ROUTES[pathname] };
  const book = pathname.match(/^\/book\/([\w-]+)$/);
  if (book) return { name: 'booking', tailorId: book[1] };
  return { name: 'notfound' };
}

function parseAuthRedirect(url) {
  try {
    const u = new URL(url);
    const params = new URLSearchParams(u.hash.replace(/^#/, ''));
    u.searchParams.forEach((v, k) => { if (!params.has(k)) params.set(k, v); });
    return {
      type: params.get('type'),
      error: params.get('error'),
      errorCode: params.get('error_code'),
      hasTokens: params.has('access_token') || params.has('code')
    };
  } catch {
    return {};
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function App() {
  return (
    <RouterProvider>
      <LazyMotion features={loadMotionFeatures} strict>
        <AppShell />
      </LazyMotion>
    </RouterProvider>
  );
}

function AppShell() {
  const { pathname, search, hash, navigate } = useRouter();
  const route = matchRoute(pathname);

  // ---------------- Toasts ----------------
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const showToast = useCallback((message, tone = 'info') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  // ---------------- Smooth scrolling ----------------
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let lenis;
    let cancelled = false;
    // Loaded after first paint so it never delays rendering.
    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({ duration: 1.1, autoRaf: true, smoothWheel: true, syncTouch: false });
      window.lenis = lenis;
    });
    return () => {
      cancelled = true;
      lenis?.destroy();
      window.lenis = null;
    };
  }, []);

  // ---------------- Tailors catalogue ----------------
  const [tailors, setTailors] = useState(loadTailors);
  const updateTailors = useCallback((updater) => {
    setTailors((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveTailors(next);
      return next;
    });
  }, []);

  // ---------------- Authentication ----------------
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const handledInitialUrl = useRef(false);

  useEffect(() => {
    // Safety net: never leave protected pages spinning if the auth backend
    // is unreachable. Treat as signed-out after 8 seconds.
    const safety = setTimeout(() => setAuthReady(true), 8000);

    let unsubscribe = () => {};
    let cancelled = false;
    loadApi().then(({ subscribeToAuthChanges, consumeOAuthReturnPath }) => {
      if (cancelled) return;
      unsubscribe = subscribeToAuthChanges((event, session) => {
      const nextUser = session?.user ?? null;
      // Keep the same object when only the token refreshed, to avoid
      // re-rendering / refetching the whole app every hour.
      setUser((prev) => (prev && nextUser && prev.id === nextUser.id && event === 'TOKEN_REFRESHED' ? prev : nextUser));
      setAuthReady(true);
      clearTimeout(safety);

      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true });
        return;
      }

      if (!handledInitialUrl.current && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        handledInitialUrl.current = true;
        const info = parseAuthRedirect(initialUrl);
        if (info.error) {
          showToast(
            info.errorCode === 'otp_expired'
              ? 'That email link has expired. Please request a new one.'
              : 'That sign-in link is invalid. Please try again.',
            'error'
          );
          navigate(info.type === 'recovery' ? '/forgot-password' : '/login', { replace: true });
        } else if (info.type === 'recovery') {
          navigate(nextUser ? '/reset-password' : '/forgot-password', { replace: true });
          if (!nextUser) showToast('That reset link is invalid or has expired. Please request a new one.', 'error');
        } else if (nextUser && (info.type === 'signup' || info.type === 'email')) {
          showToast('Email verified — welcome to DARZZEE!', 'success');
          navigate('/', { replace: true });
        } else if (nextUser && info.hasTokens) {
          // OAuth (Google) return: go back to where the user started.
          navigate(safeNextPath(consumeOAuthReturnPath(), '/'), { replace: true });
        }
      }
      });
    }).catch((err) => {
      console.error('[darzzee] could not load auth module', err);
      setAuthReady(true);
    });
    return () => {
      cancelled = true;
      clearTimeout(safety);
      unsubscribe();
    };
  }, [navigate, showToast]);

  const userId = user?.id;
  const refreshBookings = useCallback(async () => {
    if (!userId) return;
    setBookingsLoading(true);
    try {
      const { getUserBookings } = await loadApi();
      setBookings(await getUserBookings(userId));
    } catch (err) {
      console.error('[darzzee] loading bookings failed', err);
    } finally {
      setBookingsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!user) {
      setProfile({ name: '', email: '', phone: '' });
      setBookings([]);
      return;
    }
    let active = true;
    loadApi()
      .then(({ getUserProfile }) => getUserProfile(user))
      .then((p) => active && setProfile(p))
      .catch((err) => console.error('[darzzee] loading profile failed', err));
    refreshBookings();
    return () => { active = false; };
    // Only reload when the signed-in account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const isAdmin = isAdminUser(user);

  const handleUpdateProfile = useCallback(async (next) => {
    if (!user) return false;
    try {
      const { saveUserProfile } = await loadApi();
      const saved = await saveUserProfile(user, next);
      setProfile(saved);
      showToast('Profile details saved.', 'success');
      return true;
    } catch (err) {
      console.error(err);
      showToast(friendlyError(err, 'Could not save your profile. Please try again.'), 'error');
      return false;
    }
  }, [user, showToast]);

  /** Persists a booking. Throws on failure so the form can show the error. */
  const handleAddBooking = useCallback(async (bookingData) => {
    if (!user) throw new Error('Not signed in');
    const { createBooking } = await loadApi();
    const saved = await createBooking(user.id, bookingData);
    await refreshBookings();
    return saved;
  }, [user, refreshBookings]);

  const handleSignOut = useCallback(async () => {
    try {
      const { logoutUser } = await loadApi();
      await logoutUser();
    } catch (err) {
      console.error(err);
    }
    // Local session is cleared regardless; make sure UI state follows.
    setUser(null);
    showToast('Signed out.', 'success');
    navigate('/', { replace: true });
  }, [navigate, showToast]);

  // ---------------- Route guards ----------------
  const isProtected = PROTECTED_ROUTES.includes(pathname);
  useEffect(() => {
    if (authReady && !user && isProtected) {
      navigate(`/login?next=${encodeURIComponent(pathname + search + hash)}`, { replace: true });
    }
  }, [authReady, user, isProtected, pathname, search, hash, navigate]);

  const nextParam = new URLSearchParams(search).get('next');
  useEffect(() => {
    if (authReady && user && route.name === 'auth' && route.mode !== 'RESET_PASSWORD') {
      navigate(safeNextPath(nextParam, '/'), { replace: true });
    }
  }, [authReady, user, route.name, route.mode, nextParam, navigate]);

  const isFirstView = useRef(true);
  const firstPath = useRef(pathname);
  if (pathname !== firstPath.current) isFirstView.current = false;

  // ---------------- Scroll restoration ----------------
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      let tries = 0;
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          if (window.lenis) window.lenis.scrollTo(el, { offset: -16 });
          else el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        } else if (tries++ < 20) {
          setTimeout(tryScroll, 100);
        }
      };
      tryScroll();
    } else if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  // ---------------- Page metadata ----------------
  const bookingTailor = route.name === 'booking' ? tailors.find((t) => t.id === route.tailorId) : null;
  useEffect(() => {
    const meta = {
      home: { path: '/' },
      tailors: {
        title: 'Book a Tailor',
        description: 'Browse expert tailors for suits, kurtas, sherwanis, blouses and lehengas. Compare ratings, experience and stitching prices, then book a home visit.',
        path: '/tailors'
      },
      alterations: {
        title: 'Alteration Service',
        description: 'Clothes that don’t fit? Describe the alteration, add a photo, and a DARZZEE tailor collects the garment from your door.',
        path: '/alterations'
      },
      join: {
        title: 'Join as a Tailor',
        description: 'Partner with DARZZEE to receive stitching orders from customers in your city and grow your tailoring business.',
        path: '/join'
      },
      booking: bookingTailor
        ? {
            title: `${bookingTailor.name} — Tailor in ${bookingTailor.city}`,
            description: `Book ${bookingTailor.name}, ${bookingTailor.mainSpecialtyBadge.toLowerCase()} in ${bookingTailor.city}. ${bookingTailor.experience} years of experience, rated ${bookingTailor.rating}/5. Home measurement and doorstep delivery.`,
            path: `/book/${bookingTailor.id}`
          }
        : { title: 'Tailor not found', path: pathname, noindex: true },
      profile: { title: 'Your Profile', path: '/profile', noindex: true },
      admin: { title: 'Admin', path: '/admin', noindex: true },
      auth: {
        title: { SIGN_IN: 'Sign In', SIGN_UP: 'Create Account', FORGOT_PASSWORD: 'Reset Password', RESET_PASSWORD: 'Set New Password' }[route.mode],
        path: pathname,
        noindex: true
      },
      notfound: { title: 'Page not found', path: pathname, noindex: true }
    }[route.name];
    applyPageMeta(meta);
  }, [route.name, route.mode, pathname, bookingTailor]);

  // ---------------- View rendering ----------------
  const renderView = () => {
    switch (route.name) {
      case 'home':
        return <HomeView tailors={tailors} />;
      case 'tailors':
        return <TailorsView tailors={tailors} />;
      case 'booking':
        return bookingTailor ? (
          <BookingView
            key={bookingTailor.id}
            tailor={bookingTailor}
            user={user}
            authReady={authReady}
            showToast={showToast}
            onSubmitBooking={handleAddBooking}
          />
        ) : (
          <NotFound title="Tailor not found" message="This tailor profile is no longer available." ctaTo="/tailors" ctaLabel="Browse tailors" />
        );
      case 'alterations':
        return <AlterationView user={user} authReady={authReady} showToast={showToast} onSubmitBooking={handleAddBooking} />;
      case 'join':
        return <JoinView user={user} authReady={authReady} showToast={showToast} />;
      case 'profile':
        if (!authReady || !user) return <PageLoader label="Checking your session…" />;
        return (
          <ProfileView
            user={user}
            profile={profile}
            onSaveProfile={handleUpdateProfile}
            bookings={bookings}
            bookingsLoading={bookingsLoading}
            onRefreshBookings={refreshBookings}
            onSignOut={handleSignOut}
          />
        );
      case 'admin':
        if (!authReady || !user) return <PageLoader label="Checking your session…" />;
        return (
          <AdminView
            isAdmin={isAdmin}
            tailors={tailors}
            onAddTailor={(t) => updateTailors((prev) => [...prev, t])}
            onEditTailor={(t) => updateTailors((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
            onDeleteTailor={(id) => updateTailors((prev) => prev.filter((x) => x.id !== id))}
            onResetTailors={() => updateTailors(TAILORS_DATA)}
            showToast={showToast}
          />
        );
      case 'auth':
        if (authReady && user && route.mode !== 'RESET_PASSWORD') return <PageLoader label="Signing you in…" />;
        return <AuthView mode={route.mode} user={user} authReady={authReady} showToast={showToast} />;
      default:
        return <NotFound />;
    }
  };

  const bannerText = useMemo(
    () =>
      route.name === 'home'
        ? 'Door-to-door tailor service · Now in alpha · Home measurements · Doorstep delivery'
        : 'Use code FIRSTORDER for ₹500 off your first stitching order · Standard delivery in 4–5 business days',
    [route.name]
  );

  return (
    <div id="app-container">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <CustomCursor />

      <div className={`announcement-banner ${route.name === 'home' ? 'dark' : ''}`} aria-label="Announcement">
        <div className="announcement-track" aria-hidden="true">
          <span>{bannerText}</span>
          <span>{bannerText}</span>
        </div>
        <span className="visually-hidden">{bannerText}</span>
      </div>

      <Header
        pathname={pathname}
        user={user}
        authReady={authReady}
        isAdmin={isAdmin}
        bookingsCount={bookings.length}
      />

      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <m.div
            key={pathname}
            className="view-section"
            // No fade on the very first page load: an opacity-0 start would
            // delay Largest Contentful Paint until animation code loads.
            initial={isFirstView.current || prefersReducedMotion() ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {renderView()}
          </m.div>
        </Suspense>
      </main>

      <Footer isAdmin={isAdmin} showToast={showToast} />

      <div id="toast-container" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
