export const SITE_URL = 'https://www.darzzee.com';
export const SITE_NAME = 'DARZZEE';
const DEFAULT_DESCRIPTION =
  'DARZZEE is a door-to-door custom tailoring marketplace in India. Choose a verified tailor, get measured at home, and receive your stitched outfit at your doorstep.';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Updates title, description, canonical and social tags for the current view. */
export function applyPageMeta({ title, description = DEFAULT_DESCRIPTION, path = '/', noindex = false }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Door-to-Door Custom Tailoring in India`;
  const url = SITE_URL + (path === '/' ? '/' : path);
  document.title = fullTitle;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  setMeta('property', 'og:title', fullTitle);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('name', 'twitter:title', fullTitle);
  setMeta('name', 'twitter:description', description);
  setCanonical(url);
}
