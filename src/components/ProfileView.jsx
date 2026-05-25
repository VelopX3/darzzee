import React, { useState, useEffect } from 'react';

export default function ProfileView({ profile, setProfile, bookings, showToast, onSignOut }) {
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');

  // Keep internal state in sync with async Firebase profile prop updates
  useEffect(() => {
    setName(profile.name || '');
    setEmail(profile.email || '');
    setPhone(profile.phone || '');
  }, [profile]);

  const handleSave = (e) => {
    e.preventDefault();
    setProfile({ name, email, phone });
  };

  return (
    <div className="profile-page-container">
      <div className="profile-grid">
        
        {/* Left Column: User Details Card */}
        <div className="profile-card-brutalist">
          <div className="profile-card-header-flex">
            <h4 className="profile-card-title" style={{ margin: 0, border: 'none', padding: 0 }}>USER DETAILS</h4>
            {onSignOut && (
              <button 
                type="button" 
                className="profile-signout-btn"
                onClick={onSignOut}
              >
                SIGN OUT
              </button>
            )}
          </div>
          
          <form onSubmit={handleSave}>
            <div className="profile-field-row">
              <label className="profile-field-label">Full Name</label>
              <input
                id="profile-name"
                type="text"
                className="profile-field-value"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="profile-field-row">
              <label className="profile-field-label">Email Address</label>
              <input
                id="profile-email"
                type="email"
                className="profile-field-value"
                value={email}
                onChange={(e) => setEmail(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="profile-field-row">
              <label className="profile-field-label">Phone Number</label>
              <input
                id="profile-phone"
                type="tel"
                className="profile-field-value"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="profile-save-btn">
              Save Details
            </button>
          </form>
        </div>

        {/* Right Column: Active Coupons Card */}
        <div className="profile-card-brutalist">
          <h4 className="profile-card-title">ACTIVE COUPONS</h4>
          <div className="coupon-details">
            <div className="coupon-code">FIRSTORDER</div>
            <div className="coupon-desc" style={{ fontSize: '13px', lineHeight: '1.4', marginTop: '5px' }}>
              ₹500 off on your first order stitch booking fee.
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Booking History */}
      <div className="booking-history-section" style={{ marginTop: '40px' }}>
        <h4 className="booking-history-title">
          BOOKING HISTORY
        </h4>
        
        {bookings.length === 0 ? (
          <div className="no-bookings">NO BOOKINGS YET.</div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-item-card">
                <div className="booking-item-details">
                  <h5>{booking.garment} Stitching - {booking.tailorName}</h5>
                  <p>Fabric: {booking.fabric} | Date: {booking.date}</p>
                  <p>
                    Consultation:{' '}
                    {booking.consultationMode === 'home'
                      ? 'Call Tailor Home (visit scheduled)'
                      : 'Sent Measurements'}
                  </p>
                  <div className="status-badge">{booking.status}</div>
                </div>
                <div className="booking-item-price">
                  ₹{booking.total}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
