import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Minimal History-API router. Gives every view a real URL (shareable, works
// with refresh and the back button) without adding a routing dependency.
// vercel.json rewrites every path to index.html, so deep links resolve.

const RouterContext = createContext(null);

const readLocation = () => ({
  pathname: window.location.pathname.replace(/\/+$/, '') || '/',
  search: window.location.search,
  hash: window.location.hash
});

export function RouterProvider({ children }) {
  const [loc, setLoc] = useState(readLocation);

  useEffect(() => {
    const onPop = () => setLoc(readLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    const url = new URL(to, window.location.origin);
    const next = url.pathname + url.search + url.hash;
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (next !== current) {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', next);
    }
    setLoc(readLocation());
  }, []);

  const value = useMemo(() => ({ ...loc, navigate }), [loc, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside RouterProvider');
  return ctx;
}

export function useQueryParam(name) {
  const { search } = useRouter();
  return new URLSearchParams(search).get(name);
}

/** Accessible, crawlable link that navigates client-side. */
export function Link({ to, onClick, children, ...rest }) {
  const { navigate } = useRouter();
  const handleClick = (e) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    // Let the browser handle new-tab / modified clicks natively.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeNextPath(raw, fallback = '/') {
  if (!raw || typeof raw !== 'string') return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  if (/^\/(login|signup|forgot-password|reset-password)\b/.test(raw)) return fallback;
  return raw;
}
