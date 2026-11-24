import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useRouter } from '../lib/router';
import { GARMENTS, tailorImgProps } from '../data/tailors';

const CATEGORIES = ['all', ...GARMENTS];

function Stars({ rating }) {
  const full = Math.floor(parseFloat(rating));
  return (
    <span className="tailor-stars" role="img" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" className={i < full ? 'star-on' : 'star-off'}>
          <path fill="currentColor" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" />
        </svg>
      ))}
    </span>
  );
}

export default function TailorsView({ tailors }) {
  const { search, hash, navigate, pathname } = useRouter();
  const params = new URLSearchParams(search);
  const categoryParam = params.get('category');
  const category = CATEGORIES.includes(categoryParam) ? categoryParam : 'all';
  const [query, setQuery] = useState(params.get('q') || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (hash === '#search') inputRef.current?.focus({ preventScroll: true });
  }, [hash]);

  // Keep the URL in sync so filtered views can be shared and survive refresh.
  const syncUrl = (nextCategory, nextQuery) => {
    const p = new URLSearchParams();
    if (nextCategory && nextCategory !== 'all') p.set('category', nextCategory);
    if (nextQuery.trim()) p.set('q', nextQuery.trim());
    const qs = p.toString();
    navigate(pathname + (qs ? `?${qs}` : '') + hash, { replace: true });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') || '') !== query.trim()) syncUrl(category, query);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tailors.filter((t) => {
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        (t.mainSpecialtyBadge || '').toLowerCase().includes(q) ||
        t.specialties.some((s) => s.toLowerCase().includes(q)) ||
        (t.tags || []).some((s) => s.toLowerCase().includes(q));
      const matchesTag = category === 'all' || t.specialties.includes(category);
      return matchesSearch && matchesTag;
    });
  }, [tailors, query, category]);

  const startingPrice = (t) => {
    const prices = t.specialties
      .map((s) => t.prices?.[s.charAt(0).toUpperCase() + s.slice(1)])
      .filter((v) => typeof v === 'number' && v > 0);
    return prices.length ? Math.min(...prices) : null;
  };

  return (
    <div className="tailors-listing-wrapper">
      <div className="page-header-container">
        <h1 className="page-title">Book a Tailor</h1>
        <p className="page-lede">Choose a specialist, then book a home measurement visit or send your measurements online.</p>

        <div className="search-filter-wrapper" role="search">
          <div className="search-box-container">
            <label htmlFor="tailor-search-input" className="visually-hidden">Search tailors</label>
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
            </svg>
            <input
              ref={inputRef}
              id="tailor-search-input"
              type="search"
              placeholder="Search by specialty, city or name…"
              className="search-input"
              value={query}
              maxLength={80}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="categories-tags" role="group" aria-label="Filter by garment">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`tag-btn ${category === cat ? 'active' : ''}`}
                aria-pressed={category === cat}
                onClick={() => syncUrl(cat, query)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="tailors-grid-section" aria-label="Tailors">
        <p className="results-count" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'tailor' : 'tailors'}
          {category !== 'all' ? ` for ${category}` : ''}
        </p>
        {filtered.length === 0 ? (
          <div className="no-results">
            <p>No tailors match your search.</p>
            <button type="button" className="btn btn-secondary" onClick={() => { setQuery(''); syncUrl('all', ''); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="tailors-grid">
            {filtered.map((tailor, i) => {
              const from = startingPrice(tailor);
              return (
                <li key={tailor.id} className="tailor-card">
                  <div className="tailor-card-img">
                    <img
                      {...tailorImgProps(tailor)}
                      sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
                      width="400"
                      height="400"
                      alt={`${tailor.name}, tailor in ${tailor.city}`}
                      loading={i < 3 ? 'eager' : 'lazy'}
                      fetchpriority={i < 2 ? 'high' : undefined}
                      decoding="async"
                    />
                  </div>
                  <div className="tailor-card-content">
                    <h2 className="tailor-card-name">{tailor.name}, {tailor.city}</h2>
                    <div className="tailor-card-badge">{tailor.mainSpecialtyBadge}</div>
                    <div className="tailor-card-meta">
                      <Stars rating={tailor.rating} />
                      <span>{tailor.rating} ({tailor.reviews})</span>
                      <span aria-hidden="true">•</span>
                      <span>{tailor.experience} yrs exp</span>
                    </div>
                    {from && <p className="tailor-card-price">Stitching from <strong>₹{from.toLocaleString('en-IN')}</strong></p>}
                    <Link to={`/book/${tailor.id}`} className="tailor-card-btn">
                      Book Now<span className="visually-hidden">: {tailor.name}</span>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
