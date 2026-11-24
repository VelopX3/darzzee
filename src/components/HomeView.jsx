import React, { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Link } from '../lib/router';
import { tailorImgProps } from '../data/tailors';
import heroVideo from '../assets/hero-loop.mp4';
// Served from /public (stable URLs) so index.html can preload the LCP image.
const heroPoster1280 = '/hero/hero-poster-1280.webp';
const heroPoster640 = '/hero/hero-poster-640.webp';
const heroPoster960 = '/hero/hero-poster-960.webp';
import kurta480 from '../assets/img/kurta-480.webp';
import kurta960 from '../assets/img/kurta-960.webp';
import sherwani480 from '../assets/img/sherwani-480.webp';
import sherwani960 from '../assets/img/sherwani-960.webp';
import blouse480 from '../assets/img/blouse-480.webp';
import blouse960 from '../assets/img/blouse-960.webp';
import lehenga480 from '../assets/img/lehenga-480.webp';
import lehenga960 from '../assets/img/lehenga-960.webp';

const CATEGORIES = [
  { key: 'kurta', label: 'Kurta', src: kurta960, srcSet: `${kurta480} 480w, ${kurta960} 960w`, alt: 'Embroidered ivory kurta on a hanger' },
  { key: 'sherwani', label: 'Sherwani', src: sherwani960, srcSet: `${sherwani480} 480w, ${sherwani960} 960w`, alt: 'Gold brocade sherwani on a dress form' },
  { key: 'blouse', label: 'Blouse', src: blouse960, srcSet: `${blouse480} 480w, ${blouse960} 960w`, alt: 'Pastel embroidered blouse on a hanger' },
  { key: 'lehenga', label: 'Lehenga', src: lehenga960, srcSet: `${lehenga480} 480w, ${lehenga960} 960w`, alt: 'Pink bridal lehenga on a dress form' }
];

const STEPS = [
  { n: '01', title: 'Choose your tailor', text: 'Compare specialists by garment, rating, experience and stitching price.' },
  { n: '02', title: 'Get measured', text: 'Book a home measurement visit, or send your own measurements online.' },
  { n: '03', title: 'Fabric pickup & stitching', text: 'Your tailor collects the fabric (or sources it) and starts stitching.' },
  { n: '04', title: 'Doorstep delivery', text: 'Standard delivery in 4–5 business days. Express delivery available.' }
];

const ITEMS_PER_SLIDE = 4;

/** Defer the hero video until the page has loaded, and skip it entirely for
 *  reduced-motion users or data-saver connections. The poster image is the
 *  LCP element, so first paint never waits for the video. */
function useDeferredVideo() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData;
    if (reduce || saveData) return undefined;
    let timer;
    const start = () => {
      timer = setTimeout(() => setEnabled(true), 300);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      clearTimeout(timer);
    };
  }, []);
  return enabled;
}

export default function HomeView({ tailors }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const videoEnabled = useDeferredVideo();

  const totalSlides = Math.max(1, Math.ceil(tailors.length / ITEMS_PER_SLIDE));
  const slide = Math.min(activeSlide, totalSlides - 1);
  const slideItems = tailors.slice(slide * ITEMS_PER_SLIDE, slide * ITEMS_PER_SLIDE + ITEMS_PER_SLIDE);

  return (
    <div className="home-view-wrapper">
      <section className="hero-section" aria-labelledby="hero-title">
        <img
          className="hero-media"
          src={heroPoster1280}
          srcSet={`${heroPoster640} 640w, ${heroPoster960} 960w, ${heroPoster1280} 1280w`}
          sizes="100vw"
          width="1280"
          height="720"
          alt=""
          fetchpriority="high"
          decoding="async"
        />
        {videoEnabled && (
          <video
            className={`hero-media hero-video ${videoReady ? 'is-ready' : ''}`}
            src={heroVideo}
            poster={heroPoster1280}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            onPlaying={() => setVideoReady(true)}
          />
        )}
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-title-group">
            <h1 id="hero-title">DARZZEE</h1>
            <p>Door to door custom tailor service</p>
          </div>
          <div className="hero-actions">
            <Link to="/tailors" className="hero-btn">Book Now</Link>
            <Link to="/alterations" className="hero-btn hero-btn-ghost">Alterations</Link>
          </div>
        </div>
      </section>

      <div className="sub-hero-ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((i) => (
            <React.Fragment key={i}>
              <span>— High-quality custom fitting</span>
              <span>— Doorstep consultation</span>
              <span>— Fabric pickup</span>
              <span>— Tailor delivery service</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <section className="welcome-section" aria-labelledby="welcome-title">
        <span className="welcome-logo" aria-hidden="true">[D]</span>
        <h2 id="welcome-title">Welcome to DARZZEE. Explore the catalog.</h2>
        <p>A premium custom tailoring service — from design to doorstep.</p>
      </section>

      <section aria-label="Shop by garment">
        <ul className="categories-container">
          {CATEGORIES.map((c, i) => (
            <li key={c.key}>
              <Link to={`/tailors?category=${c.key}`} className="category-card">
                <img
                  src={c.src}
                  srcSet={c.srcSet}
                  sizes="(max-width: 480px) 100vw, (max-width: 900px) 50vw, 25vw"
                  width="960"
                  height="1285"
                  alt={c.alt}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <span className="category-badge">{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="how-it-works" aria-labelledby="how-title">
        <h2 id="how-title" className="section-heading">How it works</h2>
        <ol className="steps-grid">
          {STEPS.map((s) => (
            <li key={s.n} className="step-card">
              <span className="step-number" aria-hidden="true">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="featured-tailors-section" aria-labelledby="featured-title">
        <div className="section-heading-row">
          <h2 id="featured-title" className="section-heading">Featured tailors</h2>
          <Link to="/tailors" className="text-link">View all →</Link>
        </div>

        <div className="featured-carousel-viewport">
          <AnimatePresence mode="wait" initial={false}>
            <m.ul
              key={slide}
              className="featured-carousel"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {slideItems.map((tailor) => (
                <li key={tailor.id}>
                  <Link to={`/book/${tailor.id}`} className="featured-item">
                    <img
                      {...tailorImgProps(tailor)}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      width="400"
                      height="400"
                      alt={`${tailor.name}, tailor in ${tailor.city}`}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="featured-caption">
                      <strong>{tailor.name}</strong>
                      <span>{tailor.city} · ★ {tailor.rating}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </m.ul>
          </AnimatePresence>
        </div>

        {totalSlides > 1 && (
          <div className="carousel-indicators" role="group" aria-label="Featured tailor pages">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`indicator ${slide === idx ? 'active' : ''}`}
                aria-label={`Show page ${idx + 1} of featured tailors`}
                aria-current={slide === idx ? 'true' : undefined}
                onClick={() => setActiveSlide(idx)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
