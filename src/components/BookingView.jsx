import React, { useState, useEffect } from 'react';

export default function BookingView({ tailor, showToast, addBooking, navigateTo }) {
  if (!tailor) return null;

  // Selected Garment state, default to first specialty
  const defaultGarment = tailor.specialties[0]
    ? tailor.specialties[0].charAt(0).toUpperCase() + tailor.specialties[0].slice(1)
    : 'Suit';

  const [garmentType, setGarmentType] = useState(defaultGarment);
  const [fabricType, setFabricType] = useState('Cotton');
  const [notes, setNotes] = useState('');
  
  // Consultation & Measurements state
  const [consultationMode, setConsultationMode] = useState('home'); // 'home' or 'measurements'
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [length, setLength] = useState('');

  // Address state
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Service options state
  const [serviceSpeed, setServiceSpeed] = useState('normal'); // 'normal' or 'express'
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'online'
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('FIRSTORDER');
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  // Recalculate default garment if active tailor changes
  useEffect(() => {
    if (tailor) {
      setGarmentType(tailor.specialties[0]
        ? tailor.specialties[0].charAt(0).toUpperCase() + tailor.specialties[0].slice(1)
        : 'Suit'
      );
    }
  }, [tailor]);

  // Pricing calculations
  const stitchingFee = tailor.prices[garmentType] || 1500;
  const consultationFee = consultationMode === 'home' ? 500 : 0;
  const platformFee = 200;
  const speedFee = serviceSpeed === 'express' ? 1000 : 0;
  const discount = isCouponApplied ? 500 : 0;
  const total = stitchingFee + platformFee + speedFee - discount;

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'FIRSTORDER') {
      setIsCouponApplied(true);
      showToast('Coupon Applied: FIRSTORDER (₹500 Discount)');
    } else if (couponCode.trim() === '') {
      setIsCouponApplied(false);
    } else {
      showToast('Invalid Coupon Code');
      setIsCouponApplied(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Collect measurements
    const measurements = consultationMode === 'measurements' ? { chest, waist, hips, length } : null;

    // Create booking record
    const booking = {
      id: `bk-${Date.now()}`,
      tailorName: tailor.name,
      tailorCity: tailor.city,
      garment: garmentType,
      fabric: fabricType,
      consultationMode,
      measurements,
      address: { street, city, state, pincode },
      speed: serviceSpeed,
      paymentMethod,
      total: total < 0 ? 0 : total,
      status: 'assigned',
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    };

    addBooking(booking);

    // Reset fields
    setNotes('');
    setChest('');
    setWaist('');
    setHips('');
    setLength('');
    setStreet('');
    setCity('');
    setState('');
    setPincode('');
    setConsultationMode('home');
    setServiceSpeed('normal');
    setPaymentMethod('cod');
    setIsCouponApplied(false);
    setCouponCode('FIRSTORDER');

    showToast('Booking Placed Successfully!');
    navigateTo('profile', true); // Navigate to bookings list
  };

  return (
    <div className="booking-page-container">
      {/* Dynamic Profile Card */}
      <div className="profile-card">
        <div className="profile-header-info">
          <div className="profile-avatar" style={{ backgroundImage: `url('${tailor.image}')` }} />
          <div className="profile-names-tags">
            <h3>{tailor.name}</h3>
            <p>{tailor.city}</p>
            <div className="profile-tags-row">
              {tailor.tags.map((tag, idx) => (
                <span key={idx} className="profile-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="profile-gallery-grid">
          <div className="gallery-item gallery-item-1" style={{ backgroundImage: `url('${tailor.gallery[0] || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80'}')` }} />
          <div className="gallery-item gallery-item-2" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=400&q=80')` }} />
          <div className="gallery-item gallery-item-3" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80')` }} />
          <div className="gallery-item gallery-item-4" style={{ backgroundImage: `url('${tailor.gallery[2] || 'https://images.unsplash.com/photo-1597983073492-bc24058b8785?auto=format&fit=crop&w=600&q=80'}')` }} />
          <div className="gallery-item gallery-item-5" style={{ backgroundImage: `url('${tailor.gallery[3] || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80'}')` }} />
        </div>
      </div>

      {/* Consultation Selector */}
      <div className="service-mode-tabs">
        <div 
          id="mode-tab-home"
          className={`mode-tab ${consultationMode === 'home' ? 'active' : ''}`}
          onClick={() => setConsultationMode('home')}
        >
          <div className="mode-tab-details">
            <h4>Call Tailor Home</h4>
            <p>Tailor visits, takes measurements & carries fabric catalogues</p>
            <div className="fee">VISIT FEE: ₹500</div>
          </div>
        </div>

        <div 
          id="mode-tab-measure"
          className={`mode-tab ${consultationMode === 'measurements' ? 'active' : ''}`}
          onClick={() => setConsultationMode('measurements')}
        >
          <div className="mode-tab-details">
            <h4>Send My Measurements</h4>
            <p>Submit details online & ship fabric or let tailor source it</p>
            <div className="fee">VISIT FEE: FREE</div>
          </div>
        </div>
      </div>

      {/* Form and Checkout */}
      <form onSubmit={handleSubmit}>
        <div className="booking-form-summary-wrapper">
          {/* Inputs Section */}
          <div className="booking-form-card">
            
            <h4 className="section-subtitle">1. GARMENT SELECTION</h4>
            <div className="garment-fabric-grid">
              <div className="form-group-custom">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Select Garment</label>
                <select 
                  id="garment-type"
                  value={garmentType} 
                  onChange={(e) => setGarmentType(e.target.value)}
                >
                  {tailor.specialties.map((spec) => {
                    const formatted = spec.charAt(0).toUpperCase() + spec.slice(1);
                    return (
                      <option key={spec} value={formatted}>
                        {formatted}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group-custom">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Select Fabric Source</label>
                <select 
                  id="fabric-type"
                  value={fabricType} 
                  onChange={(e) => setFabricType(e.target.value)}
                >
                  <option value="Cotton">Cotton (I will provide)</option>
                  <option value="Silk">Silk (I will provide)</option>
                  <option value="Linen">Linen (I will provide)</option>
                  <option value="Tailor Sourced">Let Tailor Source Fabric</option>
                </select>
              </div>
            </div>

            <div className="form-group-custom">
              <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Special Notes / Styling Request</label>
              <textarea 
                placeholder="E.g. full sleeves, V-neck, specific pocket requirements..." 
                className="notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Conditional Measurements */}
            {consultationMode === 'measurements' && (
              <div id="measurements-input-section">
                <h4 className="section-subtitle">2. BODY MEASUREMENTS (IN INCHES)</h4>
                <div className="measurements-inputs-grid">
                  <div className="form-group-custom">
                    <label style={{ fontSize: '10px', fontWeight: 600 }}>Chest</label>
                    <input 
                      id="measure-chest"
                      type="number" 
                      placeholder="in" 
                      required 
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                    />
                  </div>
                  <div className="form-group-custom">
                    <label style={{ fontSize: '10px', fontWeight: 600 }}>Waist</label>
                    <input 
                      id="measure-waist"
                      type="number" 
                      placeholder="in" 
                      required 
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                    />
                  </div>
                  <div className="form-group-custom">
                    <label style={{ fontSize: '10px', fontWeight: 600 }}>Hips</label>
                    <input 
                      id="measure-hips"
                      type="number" 
                      placeholder="in" 
                      required 
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                    />
                  </div>
                  <div className="form-group-custom">
                    <label style={{ fontSize: '10px', fontWeight: 600 }}>Length</label>
                    <input 
                      id="measure-length"
                      type="number" 
                      placeholder="in" 
                      required 
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            <h4 className="section-subtitle">
              {consultationMode === 'home' ? '2. CONSULTATION ADDRESS' : '3. DELIVERY ADDRESS'}
            </h4>
            <div className="address-grid">
              <div className="form-group-custom street-col">
                <label style={{ fontSize: '10px', fontWeight: 600 }}>Street Address</label>
                <input 
                  id="addr-street"
                  type="text" 
                  placeholder="Apartment, Street and Area" 
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div className="form-group-custom">
                <label style={{ fontSize: '10px', fontWeight: 600 }}>City</label>
                <input 
                  id="addr-city"
                  type="text" 
                  placeholder="City" 
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="form-group-custom">
                <label style={{ fontSize: '10px', fontWeight: 600 }}>State</label>
                <input 
                  id="addr-state"
                  type="text" 
                  placeholder="State" 
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
              <div className="form-group-custom">
                <label style={{ fontSize: '10px', fontWeight: 600 }}>Pincode</label>
                <input 
                  id="addr-pincode"
                  type="text" 
                  placeholder="Pincode" 
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
              </div>
            </div>

            {/* Service speed */}
            <h4 className="section-subtitle">
              {consultationMode === 'home' ? '3. VISIT SPEED' : '4. PRODUCTION SPEED'}
            </h4>
            <div className="speed-payment-options">
              <div 
                id="speed-normal"
                className={`selectable-option-card ${serviceSpeed === 'normal' ? 'active' : ''}`}
                onClick={() => setServiceSpeed('normal')}
              >
                <div>
                  <div className="label">STANDARD</div>
                  <div className="subtext">7-10 Days Delivery</div>
                </div>
                <div className="price-tag">FREE</div>
              </div>

              <div 
                id="speed-express"
                className={`selectable-option-card ${serviceSpeed === 'express' ? 'active' : ''}`}
                onClick={() => setServiceSpeed('express')}
              >
                <div>
                  <div className="label">EXPRESS SPEED</div>
                  <div className="subtext">2-3 Days Delivery</div>
                </div>
                <div className="price-tag">+₹1000</div>
              </div>
            </div>

            {/* Payment Method */}
            <h4 className="section-subtitle">
              {consultationMode === 'home' ? '4. PAYMENT METHOD' : '5. PAYMENT METHOD'}
            </h4>
            <div className="speed-payment-options">
              <div 
                id="payment-cod"
                className={`selectable-option-card ${paymentMethod === 'cod' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <div>
                  <div className="label">CASH ON DELIVERY</div>
                  <div className="subtext">Pay at doorstep</div>
                </div>
              </div>

              <div 
                id="payment-online"
                className={`selectable-option-card ${paymentMethod === 'online' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('online')}
              >
                <div>
                  <div className="label">ONLINE PAYMENT</div>
                  <div className="subtext">Pay via Card/UPI</div>
                </div>
              </div>
            </div>

          </div>

          {/* Checkout Card */}
          <div className="summary-card">
            <h4 className="summary-title">ORDER SUMMARY</h4>
            
            <div className="summary-row">
              <span>Stitching Fee ({garmentType})</span>
              <span id="summary-stitching-fee">₹{stitchingFee}</span>
            </div>

            {consultationFee > 0 && (
              <div id="consultation-fee-row" className="summary-row">
                <span>Consultation Fee</span>
                <span id="summary-consultation-fee">₹{consultationFee} (payable at visit)</span>
              </div>
            )}

            {speedFee > 0 && (
              <div id="speed-fee-row" className="summary-row">
                <span>Speed Surcharge</span>
                <span id="summary-speed-fee">+₹{speedFee}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Platform Fee</span>
              <span id="summary-platform-fee">₹{platformFee}</span>
            </div>

            {isCouponApplied && (
              <div id="summary-discount-row" className="summary-row discount-row">
                <span>Coupon Applied</span>
                <span id="summary-discount-val">-₹{discount}</span>
              </div>
            )}

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Line Total</span>
              <span id="summary-line-total">₹{total < 0 ? 0 : total}</span>
            </div>

            {/* Coupon Entry */}
            <div className="coupon-input-group">
              <input
                id="coupon-field"
                type="text"
                placeholder="PROMO CODE"
                className="coupon-input"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button 
                type="button" 
                className="coupon-btn" 
                onClick={handleApplyCoupon}
              >
                Apply
              </button>
            </div>

            <button type="submit" className="place-order-btn">
              Place Booking
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
