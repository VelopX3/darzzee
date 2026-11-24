import React, { useEffect, useRef, useState } from 'react';
import { Link } from '../lib/router';
import { cleanText, isValidPhone } from '../lib/validation';
import { FormError, Spinner } from './ui';

const STATUS_STEPS = [
  { key: 'assigned', label: 'Booked' },
  { key: 'in_progress', label: 'Stitching' },
  { key: 'completed', label: 'Delivered' }
];

function StatusTracker({ status }) {
  if (status === 'cancelled') return <div className="status-badge cancelled">Cancelled</div>;
  const current = Math.max(0, STATUS_STEPS.findIndex((s) => s.key === status));
  return (
    <ol className="status-tracker" aria-label={`Order status: ${STATUS_STEPS[current].label}`}>
      {STATUS_STEPS.map((s, i) => (
        <li key={s.key} className={i <= current ? 'done' : ''} aria-current={i === current ? 'step' : undefined}>
          {s.label}
        </li>
      ))}
    </ol>
  );
}

export default function ProfileView({ user, profile, onSaveProfile, bookings, bookingsLoading, onRefreshBookings, onSignOut }) {
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);

  // Sync when the profile finishes loading asynchronously.
  useEffect(() => {
    setName(profile.name || '');
    setPhone(profile.phone || '');
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (savingRef.current) return;
    if (cleanText(name, 80).length < 2) return setError('Please enter your full name.');
    if (!isValidPhone(phone)) return setError('Please enter a valid phone number (10–15 digits).');
    setError('');
    savingRef.current = true;
    setSaving(true);
    await onSaveProfile({ name: cleanText(name, 80), email: user.email, phone: phone.trim() });
    savingRef.current = false;
    setSaving(false);
  };

  const dirty = name !== (profile.name || '') || phone !== (profile.phone || '');

  return (
    <div className="profile-page-container">
      <h1 className="page-title align-left">Your profile</h1>
      <div className="profile-grid">
        <section className="profile-card-brutalist" aria-labelledby="details-title">
          <div className="profile-card-header-flex">
            <h2 id="details-title" className="profile-card-title">User details</h2>
            <button type="button" className="profile-signout-btn" onClick={onSignOut}>
              Sign out
            </button>
          </div>

          <form onSubmit={handleSave} noValidate>
            <div className="profile-field-row">
              <label className="profile-field-label" htmlFor="profile-name">Full name</label>
              <input id="profile-name" type="text" autoComplete="name" className="profile-field-value" value={name} maxLength={80} onChange={(e) => setName(e.target.value.toUpperCase())} required />
            </div>
            <div className="profile-field-row">
              <label className="profile-field-label" htmlFor="profile-email">Email address</label>
              <input id="profile-email" type="email" className="profile-field-value is-readonly" value={(user.email || profile.email || '').toUpperCase()} readOnly aria-describedby="email-note" />
              <span id="email-note" className="field-note">Your sign-in email can’t be changed here.</span>
            </div>
            <div className="profile-field-row">
              <label className="profile-field-label" htmlFor="profile-phone">Phone number</label>
              <input id="profile-phone" type="tel" autoComplete="tel" inputMode="tel" className="profile-field-value" value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <FormError id="profile-error">{error}</FormError>
            <button type="submit" className="profile-save-btn" disabled={saving || !dirty}>
              {saving ? <><Spinner /> Saving…</> : 'Save details'}
            </button>
          </form>
        </section>

        <section className="profile-card-brutalist" aria-labelledby="coupons-title">
          <h2 id="coupons-title" className="profile-card-title">Active coupons</h2>
          <div className="coupon-details">
            <div className="coupon-code">FIRSTORDER</div>
            <p className="coupon-desc">₹500 off the stitching fee on your first order.</p>
          </div>
          <Link to="/tailors" className="btn btn-secondary">Book a tailor</Link>
        </section>
      </div>

      <section className="booking-history-section" aria-labelledby="bookings">
        <div className="booking-history-head">
          <h2 id="bookings" className="booking-history-title" tabIndex={-1}>Booking history</h2>
          <button type="button" className="text-link" onClick={onRefreshBookings} disabled={bookingsLoading}>
            {bookingsLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {bookingsLoading && bookings.length === 0 ? (
          <div className="page-loader" role="status"><Spinner /> Loading your bookings…</div>
        ) : bookings.length === 0 ? (
          <div className="no-bookings">
            <p>No bookings yet.</p>
            <Link to="/tailors" className="btn btn-primary">Find a tailor</Link>
          </div>
        ) : (
          <ul className="bookings-list">
            {bookings.map((b) => {
              const isAlteration = b.requestType === 'alteration' || b.measurements?.requestType === 'alteration' || b.garment === 'Alteration';
              const notes = b.notes || b.measurements?.notes;
              return (
                <li key={b.id} className="booking-item-card">
                  <div className="booking-item-details">
                    <h3>{isAlteration ? 'Alteration request' : `${b.garment} stitching — ${b.tailorName}`}</h3>
                    <p>
                      {b.date || ''}
                      {!isAlteration && b.fabric ? ` · Fabric: ${b.fabric}` : ''}
                      {b.speed === 'express' ? ' · Express' : ' · Standard delivery'}
                    </p>
                    <p>
                      {isAlteration
                        ? 'Doorstep pickup'
                        : b.consultationMode === 'home'
                          ? 'Home measurement visit'
                          : 'Measurements sent online'}
                      {b.address?.city ? ` · ${b.address.city}` : ''}
                    </p>
                    {notes && <p className="booking-notes">“{notes}”</p>}
                    <StatusTracker status={b.status} />
                  </div>
                  <div className="booking-item-price">
                    {isAlteration && !b.total ? 'Quote pending' : `₹${Number(b.total || 0).toLocaleString('en-IN')}`}
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
