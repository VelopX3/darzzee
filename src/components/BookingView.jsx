import React, { useRef, useState } from 'react';
import { Link, useRouter } from '../lib/router';
import { capitalize, tailorImgProps } from '../data/tailors';
import { cleanText, inRange, isValidPincode } from '../lib/validation';
import { friendlyError } from '../supabase';
import { hideBrokenImage, FormError, SignInPrompt, Spinner, PageLoader } from './ui';

const FALLBACK_GALLERY = [
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1597983073492-bc24058b8785?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=70'
];

const PLATFORM_FEE = 200;
const HOME_VISIT_FEE = 500;
const EXPRESS_FEE = 1000;
const COUPONS = { FIRSTORDER: 500 };
const MEASUREMENTS = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'length', label: 'Length' }
];

function OptionCard({ name, value, checked, onChange, title, subtitle, price }) {
  return (
    <label className={`selectable-option-card ${checked ? 'active' : ''}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="visually-hidden-input" />
      <span>
        <span className="label">{title}</span>
        {subtitle && <span className="subtext">{subtitle}</span>}
      </span>
      {price && <span className="price-tag">{price}</span>}
    </label>
  );
}

export default function BookingView({ tailor, user, authReady, showToast, onSubmitBooking }) {
  const { navigate } = useRouter();
  const specialties = tailor.specialties.length ? tailor.specialties : ['suit'];

  const [garmentType, setGarmentType] = useState(capitalize(specialties[0]));
  const [fabricType, setFabricType] = useState('Cotton');
  const [notes, setNotes] = useState('');
  const [consultationMode, setConsultationMode] = useState('home');
  const [measurements, setMeasurements] = useState({ chest: '', waist: '', hips: '', length: '' });
  const [address, setAddress] = useState({ street: '', city: '', state: '', pincode: '' });
  const [serviceSpeed, setServiceSpeed] = useState('normal');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('FIRSTORDER');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const submittingRef = useRef(false);

  const stitchingFee = tailor.prices?.[garmentType] || 1500;
  const speedFee = serviceSpeed === 'express' ? EXPRESS_FEE : 0;
  const discount = appliedCoupon ? COUPONS[appliedCoupon] : 0;
  const total = Math.max(0, stitchingFee + PLATFORM_FEE + speedFee - discount);

  const gallery = [0, 1, 2, 3, 4].map((i) => tailor.gallery?.[i] || FALLBACK_GALLERY[i]);

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setAppliedCoupon(null);
      setCouponMsg('');
    } else if (COUPONS[code]) {
      setAppliedCoupon(code);
      setCouponMsg(`${code} applied — ₹${COUPONS[code]} off.`);
    } else {
      setAppliedCoupon(null);
      setCouponMsg('That code is not valid.');
    }
  };

  const validate = () => {
    if (consultationMode === 'measurements') {
      for (const m of MEASUREMENTS) {
        if (!inRange(measurements[m.key], 5, 90)) return `${m.label} must be a number between 5 and 90 inches.`;
      }
    }
    if (cleanText(address.street, 200).length < 5) return 'Please enter your full street address.';
    if (cleanText(address.city, 60).length < 2) return 'Please enter your city.';
    if (cleanText(address.state, 60).length < 2) return 'Please enter your state.';
    if (!isValidPincode(address.pincode)) return 'Please enter a valid 6-digit pincode.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError('');
    submittingRef.current = true;
    setSubmitting(true);

    const booking = {
      requestType: 'stitching',
      tailorName: tailor.name,
      tailorCity: tailor.city,
      garment: garmentType,
      fabric: fabricType,
      notes: cleanText(notes, 500) || undefined,
      consultationMode,
      measurements: consultationMode === 'measurements'
        ? Object.fromEntries(MEASUREMENTS.map((m) => [m.key, Number(measurements[m.key])]))
        : null,
      address: {
        street: cleanText(address.street, 200),
        city: cleanText(address.city, 60),
        state: cleanText(address.state, 60),
        pincode: address.pincode.trim()
      },
      speed: serviceSpeed,
      paymentMethod,
      total,
      status: 'assigned',
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    };

    try {
      await onSubmitBooking(booking);
      showToast('Booking placed successfully!', 'success');
      navigate('/profile#bookings');
    } catch (err) {
      console.error('[darzzee] booking failed', err);
      const msg = friendlyError(err, 'We could not place your booking. Please try again.');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const setMeasure = (key, value) => setMeasurements((prev) => ({ ...prev, [key]: value }));
  const setAddr = (key, value) => setAddress((prev) => ({ ...prev, [key]: value }));
  const step = (n) => (consultationMode === 'measurements' ? n + 1 : n);

  return (
    <div className="booking-page-container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/tailors">Tailors</Link> <span aria-hidden="true">/</span> <span aria-current="page">{tailor.name}</span>
      </nav>

      <section className="profile-card" aria-labelledby="tailor-name">
        <div className="profile-header-info">
          <img className="profile-avatar" {...tailorImgProps(tailor)} sizes="72px" width="72" height="72" alt="" />
          <div className="profile-names-tags">
            <h1 id="tailor-name">{tailor.name}</h1>
            <p>{tailor.city} · ★ {tailor.rating} ({tailor.reviews} reviews) · {tailor.experience} yrs experience</p>
            <div className="profile-tags-row">
              {(tailor.tags || []).map((tag) => (
                <span key={tag} className="profile-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <h2 className="visually-hidden">Portfolio</h2>
        <div className="profile-gallery-grid">
          {gallery.map((src, i) => (
            <img
              key={i}
              className={`gallery-item gallery-item-${i + 1}`}
              src={src}
              alt={`${tailor.name} portfolio piece ${i + 1}`}
              loading="lazy"
              decoding="async"
              width="400"
              height="400"
              onError={hideBrokenImage}
            />
          ))}
        </div>

        <h2 className="price-list-title">Stitching prices</h2>
        <ul className="price-list">
          {specialties.map((s) => (
            <li key={s}>
              <span>{capitalize(s)}</span>
              <strong>{tailor.prices?.[capitalize(s)] ? `₹${tailor.prices[capitalize(s)].toLocaleString('en-IN')}` : 'On consultation'}</strong>
            </li>
          ))}
        </ul>
      </section>

      {!authReady ? (
        <PageLoader label="Checking your session…" />
      ) : !user ? (
        <SignInPrompt
          title={`Book ${tailor.name}`}
          message="Sign in or create a free account to book a home measurement visit or send your measurements online."
        />
      ) : (
        <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
          <fieldset className="service-mode-tabs">
            <legend className="visually-hidden">Consultation type</legend>
            <label className={`mode-tab ${consultationMode === 'home' ? 'active' : ''}`}>
              <input type="radio" name="mode" value="home" checked={consultationMode === 'home'} onChange={() => setConsultationMode('home')} className="visually-hidden-input" />
              <span className="mode-tab-details">
                <span className="mode-tab-title">Call tailor home</span>
                <span className="mode-tab-desc">Tailor visits, takes measurements and carries fabric catalogues.</span>
                <span className="fee">Visit fee: ₹{HOME_VISIT_FEE}</span>
              </span>
            </label>
            <label className={`mode-tab ${consultationMode === 'measurements' ? 'active' : ''}`}>
              <input type="radio" name="mode" value="measurements" checked={consultationMode === 'measurements'} onChange={() => setConsultationMode('measurements')} className="visually-hidden-input" />
              <span className="mode-tab-details">
                <span className="mode-tab-title">Send my measurements</span>
                <span className="mode-tab-desc">Submit details online and hand over fabric at pickup, or let the tailor source it.</span>
                <span className="fee">Visit fee: Free</span>
              </span>
            </label>
          </fieldset>

          <div className="booking-form-summary-wrapper">
            <div className="booking-form-card">
              <h2 className="section-subtitle">1. Garment selection</h2>
              <div className="garment-fabric-grid">
                <div className="form-group-custom">
                  <label htmlFor="garment-type">Garment</label>
                  <select id="garment-type" value={garmentType} onChange={(e) => setGarmentType(e.target.value)}>
                    {specialties.map((spec) => (
                      <option key={spec} value={capitalize(spec)}>{capitalize(spec)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group-custom">
                  <label htmlFor="fabric-type">Fabric source</label>
                  <select id="fabric-type" value={fabricType} onChange={(e) => setFabricType(e.target.value)}>
                    <option value="Cotton">Cotton (I will provide)</option>
                    <option value="Silk">Silk (I will provide)</option>
                    <option value="Linen">Linen (I will provide)</option>
                    <option value="Tailor Sourced">Let tailor source fabric</option>
                  </select>
                </div>
              </div>

              <div className="form-group-custom">
                <label htmlFor="booking-notes">Special notes / styling request <span className="optional">(optional)</span></label>
                <textarea
                  id="booking-notes"
                  placeholder="E.g. full sleeves, V-neck, specific pocket requirements…"
                  className="notes-textarea"
                  value={notes}
                  maxLength={500}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {consultationMode === 'measurements' && (
                <fieldset className="plain-fieldset">
                  <legend className="section-subtitle">2. Body measurements (inches)</legend>
                  <div className="measurements-inputs-grid">
                    {MEASUREMENTS.map((m) => (
                      <div key={m.key} className="form-group-custom">
                        <label htmlFor={`measure-${m.key}`}>{m.label}</label>
                        <input
                          id={`measure-${m.key}`}
                          type="number"
                          inputMode="decimal"
                          min="5"
                          max="90"
                          step="0.25"
                          placeholder="in"
                          required
                          value={measurements[m.key]}
                          onChange={(e) => setMeasure(m.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </fieldset>
              )}

              <fieldset className="plain-fieldset">
                <legend className="section-subtitle">
                  {step(2)}. {consultationMode === 'home' ? 'Consultation & pickup address' : 'Pickup & delivery address'}
                </legend>
                <div className="address-grid">
                  <div className="form-group-custom street-col">
                    <label htmlFor="addr-street">Street address</label>
                    <input id="addr-street" type="text" autoComplete="street-address" placeholder="Apartment, street and area" required maxLength={200} value={address.street} onChange={(e) => setAddr('street', e.target.value)} />
                  </div>
                  <div className="form-group-custom">
                    <label htmlFor="addr-city">City</label>
                    <input id="addr-city" type="text" autoComplete="address-level2" required maxLength={60} value={address.city} onChange={(e) => setAddr('city', e.target.value)} />
                  </div>
                  <div className="form-group-custom">
                    <label htmlFor="addr-state">State</label>
                    <input id="addr-state" type="text" autoComplete="address-level1" required maxLength={60} value={address.state} onChange={(e) => setAddr('state', e.target.value)} />
                  </div>
                  <div className="form-group-custom">
                    <label htmlFor="addr-pincode">Pincode</label>
                    <input id="addr-pincode" type="text" inputMode="numeric" autoComplete="postal-code" pattern="[1-9][0-9]{5}" maxLength={6} required value={address.pincode} onChange={(e) => setAddr('pincode', e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="plain-fieldset">
                <legend className="section-subtitle">{step(3)}. Delivery speed</legend>
                <div className="speed-payment-options">
                  <OptionCard name="speed" value="normal" checked={serviceSpeed === 'normal'} onChange={setServiceSpeed} title="Standard" subtitle="4–5 business days" price="Free" />
                  <OptionCard name="speed" value="express" checked={serviceSpeed === 'express'} onChange={setServiceSpeed} title="Express" subtitle="2–3 business days" price={`+₹${EXPRESS_FEE}`} />
                </div>
              </fieldset>

              <fieldset className="plain-fieldset">
                <legend className="section-subtitle">{step(4)}. Payment method</legend>
                <div className="speed-payment-options">
                  <OptionCard name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={setPaymentMethod} title="Cash on delivery" subtitle="Pay at doorstep" />
                  <OptionCard name="payment" value="online" checked={paymentMethod === 'online'} onChange={setPaymentMethod} title="Online payment" subtitle="Pay via card / UPI" />
                </div>
              </fieldset>
            </div>

            <aside className="summary-card" aria-labelledby="summary-title">
              <h2 id="summary-title" className="summary-title">Order summary</h2>
              <div className="summary-row">
                <span>Stitching fee ({garmentType})</span>
                <span>₹{stitchingFee.toLocaleString('en-IN')}</span>
              </div>
              {consultationMode === 'home' && (
                <div className="summary-row">
                  <span>Home visit fee</span>
                  <span>₹{HOME_VISIT_FEE} <small>(paid at visit)</small></span>
                </div>
              )}
              {speedFee > 0 && (
                <div className="summary-row">
                  <span>Express delivery</span>
                  <span>+₹{speedFee.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Platform fee</span>
                <span>₹{PLATFORM_FEE}</span>
              </div>
              {discount > 0 && (
                <div className="summary-row discount-row">
                  <span>Coupon {appliedCoupon}</span>
                  <span>−₹{discount}</span>
                </div>
              )}
              <div className="summary-divider" />
              <div className="summary-total">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>

              <div className="coupon-input-group">
                <label htmlFor="coupon-field" className="visually-hidden">Promo code</label>
                <input
                  id="coupon-field"
                  type="text"
                  placeholder="Promo code"
                  className="coupon-input"
                  value={couponCode}
                  maxLength={20}
                  autoCapitalize="characters"
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                />
                <button type="button" className="coupon-btn" onClick={handleApplyCoupon}>Apply</button>
              </div>
              {couponMsg && <p className={`coupon-msg ${appliedCoupon ? 'ok' : 'bad'}`} role="status">{couponMsg}</p>}

              <FormError id="booking-error">{formError}</FormError>

              <button type="submit" className="place-order-btn" disabled={submitting}>
                {submitting ? <><Spinner /> Placing booking…</> : 'Place booking'}
              </button>
            </aside>
          </div>
        </form>
      )}
    </div>
  );
}
