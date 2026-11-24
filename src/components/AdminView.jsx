import React, { useState, useEffect, useCallback } from 'react';
import { getAllBookings, updateBookingStatus, friendlyError } from '../supabase';
import { GARMENTS as AVAILABLE_SPECIALTIES, TAILOR_IMAGES } from '../data/tailors';
import { Link } from '../lib/router';

// Access to this view is decided by the signed-in account (see isAdminUser).
// It only controls the UI — the bookings table itself must be protected by
// Row Level Security so that only admins can read or update every booking.
export default function AdminView({
  isAdmin,
  tailors,
  onAddTailor,
  onEditTailor,
  onDeleteTailor,
  onResetTailors,
  showToast
}) {
  const showDashboard = isAdmin;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'tailors', 'bookings'
  const [allBookings, setAllBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Form states for adding/editing tailors
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTailor, setEditingTailor] = useState(null); // Null for Add, Tailor object for Edit

  // Form Fields
  const [tName, setTName] = useState('');
  const [tCity, setTCity] = useState('');
  const [tBadge, setTBadge] = useState('');
  const [tRating, setTRating] = useState('4.8');
  const [tReviews, setTReviews] = useState('0');
  const [tExp, setTExp] = useState('5');
  const [tImageIndex, setTImageIndex] = useState(0); // Index for local images
  const [tCustomImage, setTCustomImage] = useState('');
  const [tSelectedSpecialties, setTSelectedSpecialties] = useState([]);
  const [tTags, setTTags] = useState('');
  const [tPrices, setTPrices] = useState({
    Suit: 4000, Kurta: 1200, Blouse: 1000, Sherwani: 4800, Lehenga: 5000, Pants: 800, Shirt: 700, Sari: 800
  });

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    setBookingsError('');
    try {
      setAllBookings(await getAllBookings());
    } catch (err) {
      console.error('[darzzee] admin bookings load failed', err?.code);
      setBookingsError(friendlyError(err, 'Could not load bookings. Check that your account has admin access in Supabase.'));
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    // Remove the legacy client-side unlock flag from older builds.
    try { localStorage.removeItem('darzzee_admin_unlocked'); } catch { /* ignore */ }
    if (showDashboard) loadBookings();
  }, [showDashboard, loadBookings]);

  // Open form modal for adding a new tailor
  const handleOpenAddForm = () => {
    setEditingTailor(null);
    setTName('');
    setTCity('Mumbai');
    setTBadge('EXPERT CUSTOM TAILOR');
    setTRating('4.8');
    setTReviews('10');
    setTExp('5');
    setTImageIndex(0);
    setTCustomImage('');
    setTSelectedSpecialties(['shirt', 'pants']);
    setTTags('Custom Suits, Formal Wear');
    setTPrices({
      Suit: 4000, Kurta: 1200, Blouse: 1000, Sherwani: 4800, Lehenga: 5000, Pants: 800, Shirt: 700, Sari: 800
    });
    setIsFormOpen(true);
  };

  // Open form modal for editing an existing tailor
  const handleOpenEditForm = (tailor) => {
    setEditingTailor(tailor);
    setTName(tailor.name);
    setTCity(tailor.city);
    setTBadge(tailor.mainSpecialtyBadge);
    setTRating(tailor.rating);
    setTReviews(tailor.reviews);
    setTExp(tailor.experience);
    
    // Check if the tailor image matches one of the local variables
    const localIdx = TAILOR_IMAGES.findIndex((img) => img.src === tailor.image);
    if (localIdx !== -1) {
      setTImageIndex(localIdx);
      setTCustomImage('');
    } else {
      setTImageIndex(-1); // Custom URL
      setTCustomImage(tailor.image || '');
    }

    setTSelectedSpecialties(tailor.specialties || []);
    setTTags(tailor.tags ? tailor.tags.join(', ') : '');
    setTPrices({
      ...tPrices,
      ...(tailor.prices || {})
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!tName.trim()) {
      showToast('NAME IS REQUIRED.');
      return;
    }

    if (tSelectedSpecialties.length === 0) {
      showToast('SELECT AT LEAST ONE SPECIALTY.');
      return;
    }

    if (tImageIndex < 0) {
      try {
        const u = new URL(tCustomImage);
        if (u.protocol !== 'https:') throw new Error('insecure');
      } catch {
        showToast('Custom image must be a valid https:// URL.', 'error');
        return;
      }
    }
    const selectedImage = tImageIndex >= 0 ? TAILOR_IMAGES[tImageIndex].src : tCustomImage.trim();
    const selectedSrcSet = tImageIndex >= 0 ? TAILOR_IMAGES[tImageIndex].srcSet : undefined;

    const tailorPayload = {
      name: tName.trim().slice(0, 80),
      city: tCity,
      mainSpecialtyBadge: tBadge.toUpperCase(),
      rating: parseFloat(tRating).toFixed(1),
      reviews: parseInt(tReviews, 10).toString(),
      experience: parseInt(tExp, 10).toString(),
      image: selectedImage,
      imageSrcSet: selectedSrcSet,
      specialties: tSelectedSpecialties,
      tags: tTags.split(',').map(tag => tag.trim().slice(0, 40)).filter(Boolean).slice(0, 6),
      prices: tPrices,
      gallery: [
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1597983073492-bc24058b8785?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80'
      ]
    };

    if (editingTailor) {
      // Edit mode
      const { gallery, ...withoutGallery } = tailorPayload;
      onEditTailor({
        ...editingTailor,
        ...withoutGallery,
        gallery: editingTailor.gallery || gallery
      });
      showToast(`TAILOR "${tName.toUpperCase()}" UPDATED SUCCESSFULLY.`);
    } else {
      // Add mode
      onAddTailor({
        id: `tailor-${Date.now()}`,
        ...tailorPayload
      });
      showToast(`TAILOR "${tName.toUpperCase()}" ADDED SUCCESSFULLY.`);
    }

    setIsFormOpen(false);
  };

  const handleDeleteClick = (tailorId, name) => {
    if (window.confirm(`ARE YOU SURE YOU WANT TO REMOVE TAILOR "${name.toUpperCase()}"?`)) {
      onDeleteTailor(tailorId);
      showToast(`TAILOR "${name.toUpperCase()}" REMOVED.`);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
      setAllBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)));
      showToast(`Status updated to ${newStatus.replace('_', ' ')}.`, 'success');
    } catch (err) {
      console.error('[darzzee] status update failed', err?.code);
      showToast(err?.code === 'not_updated' ? 'Status not updated — your account may lack admin permission.' : friendlyError(err, 'Failed to update status.'), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSpecialtySelection = (spec) => {
    if (tSelectedSpecialties.includes(spec)) {
      setTSelectedSpecialties(tSelectedSpecialties.filter(s => s !== spec));
    } else {
      setTSelectedSpecialties([...tSelectedSpecialties, spec]);
    }
  };

  const handlePriceChange = (garment, val) => {
    setTPrices({
      ...tPrices,
      [garment]: parseInt(val, 10) || 0
    });
  };

  // Metric Calculation
  const totalRevenue = allBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  const averageRating = tailors.length
    ? (tailors.reduce((sum, t) => sum + (parseFloat(t.rating) || 0), 0) / tailors.length).toFixed(2)
    : '—';

  if (!showDashboard) {
    return (
      <div className="admin-gate-wrapper">
        <div className="admin-gate-card">
          <div className="admin-gate-badge">Restricted</div>
          <h1 className="admin-gate-title">Admin access only</h1>
          <p className="admin-gate-desc">Your account does not have administrator access. If you believe this is a mistake, contact the DARZZEE team.</p>
          <Link to="/" className="btn btn-primary">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      {/* Admin Header */}
      <div className="admin-header-row">
        <div>
          <h1 className="admin-title">ADMIN CONTROL CENTER</h1>
          <p className="admin-subtitle">Manage tailors, customer orders and shop stats.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          OVERVIEW
        </button>
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'tailors'}
          className={`admin-tab-btn ${activeTab === 'tailors' ? 'active' : ''}`}
          onClick={() => setActiveTab('tailors')}
        >
          MANAGE TAILORS
        </button>
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'bookings'}
          className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          MANAGE BOOKINGS
        </button>
      </div>

      {/* VIEW CONTENTS */}

      {/* 1. OVERVIEW VIEW */}
      {activeTab === 'overview' && (
        <div className="admin-overview-grid">
          <div className="metric-card">
            <div className="metric-card-icon bookings">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
              </svg>
            </div>
            <div className="metric-card-text">
              <div className="metric-label">TOTAL BOOKINGS:</div>
              <div className="metric-val">{allBookings.length}</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-card-icon revenue">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
              </svg>
            </div>
            <div className="metric-card-text">
              <div className="metric-label">ESTIMATED REVENUE:</div>
              <div className="metric-val">₹{totalRevenue.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-icon tailors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div className="metric-card-text">
              <div className="metric-label">REGISTERED TAILORS:</div>
              <div className="metric-val">{tailors.length}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-icon rating">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.173-.439.743-.439.916 0l1.86 4.702 5.064.408c.47.038.658.621.298.924l-3.834 3.238.868 4.96c.08.455-.42.818-.813.568L12 16.924l-4.437 2.378c-.393.25-.893-.113-.813-.568l.868-4.96-3.834-3.238c-.36-.303-.172-.886.298-.924l5.064-.408 1.86-4.702Z" />
              </svg>
            </div>
            <div className="metric-card-text">
              <div className="metric-label">AVERAGE RATING:</div>
              <div className="metric-val">{averageRating}★</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANAGE TAILORS VIEW */}
      {activeTab === 'tailors' && (
        <div className="admin-tailors-section">
          <div className="action-row">
            <button type="button" className="admin-reset-btn" onClick={() => {
              if (window.confirm('Restore the original tailor catalogue? Your local edits will be lost.')) {
                onResetTailors();
                showToast('Tailor catalogue restored.', 'success');
              }
            }}>
              RESTORE DEFAULTS
            </button>
            <button type="button" className="add-tailor-btn" onClick={handleOpenAddForm}>
              + ADD NEW TAILOR
            </button>
          </div>

          <div className="admin-tailors-grid">
            {tailors.map((tailor) => (
              <div key={tailor.id} className="admin-tailor-card">
                <img className="admin-tailor-img" src={tailor.image} srcSet={tailor.imageSrcSet} sizes="140px" alt="" loading="lazy" />
                <div className="admin-tailor-info">
                  <h4 className="tailor-name">{tailor.name}</h4>
                  <div className="tailor-meta">{tailor.city} • {tailor.experience} Yrs Exp • {tailor.rating}★ ({tailor.reviews} reviews)</div>
                  <div className="tailor-badge">{tailor.mainSpecialtyBadge}</div>
                  <div className="tailor-specs">
                    {tailor.specialties.map(s => (
                      <span key={s} className="spec-badge">{s}</span>
                    ))}
                  </div>
                  <div className="tailor-card-actions">
                    <button type="button" className="edit-btn" onClick={() => handleOpenEditForm(tailor)} aria-label={`Edit ${tailor.name}`}>EDIT</button>
                    <button type="button" className="delete-btn" onClick={() => handleDeleteClick(tailor.id, tailor.name)} aria-label={`Delete ${tailor.name}`}>DELETE</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MANAGE BOOKINGS VIEW */}
      {activeTab === 'bookings' && (
        <div className="admin-bookings-section">
          <div className="bookings-header">
            <h4>CUSTOMER BOOKINGS LOG</h4>
            <button type="button" className="refresh-bookings-btn" onClick={loadBookings} disabled={loadingBookings}>
              {loadingBookings ? 'REFRESHING...' : 'REFRESH LIST'}
            </button>
          </div>

          {bookingsError ? (
            <div className="no-bookings-brutalist" role="alert">{bookingsError}</div>
          ) : allBookings.length === 0 ? (
            <div className="no-bookings-brutalist">
              NO BOOKINGS FOUND IN SYSTEM.
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-bookings-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>ORDER ID</th>
                    <th>CLIENT EMAIL</th>
                    <th>TAILOR</th>
                    <th>GARMENT</th>
                    <th>MODE</th>
                    <th>DETAILS</th>
                    <th>TOTAL</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings.map((bk) => (
                    <tr key={bk.id}>
                      <td className="date-col">{bk.date || 'N/A'}</td>
                      <td className="id-col">{bk.id}</td>
                      <td className="email-col">{bk.userId ? String(bk.userId).substring(0, 8) + '…' : '—'}</td>
                      <td>{bk.tailorName} ({bk.tailorCity})</td>
                      <td className="capitalize">{bk.garment}</td>
                      <td className="capitalize">{bk.consultationMode === 'home' ? 'Home Visit' : bk.consultationMode === 'pickup' ? 'Pickup' : 'Online'}</td>
                      <td className="details-col">
                        {bk.address?.city ? `${bk.address.city}${bk.address.pincode ? ` ${bk.address.pincode}` : ''}` : ''}
                        {(bk.notes || bk.measurements?.notes) && <div className="muted">“{bk.notes || bk.measurements?.notes}”</div>}
                        {(bk.photoPath || bk.measurements?.photoPath) && <div className="muted">Photo attached</div>}
                      </td>
                      <td>₹{bk.total}</td>
                      <td>
                        <span className={`status-pill ${bk.status}`}>
                          {bk.status}
                        </span>
                      </td>
                      <td>
                        <select
                          className="admin-status-dropdown"
                          value={bk.status}
                          aria-label={`Status for booking ${bk.id}`}
                          disabled={updatingId === bk.id}
                          onChange={(e) => handleStatusChange(bk.id, e.target.value)}
                        >
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD/EDIT FORM MODAL */}
      {isFormOpen && (
        <div className="admin-modal-overlay" onKeyDown={(e) => { if (e.key === 'Escape') setIsFormOpen(false); }}>
          <div className="admin-modal-card" role="dialog" aria-modal="true" aria-labelledby="tailor-form-title" data-lenis-prevent>
            <div className="modal-header">
              <h2 id="tailor-form-title">{editingTailor ? 'EDIT PARTNER TAILOR' : 'ADD PARTNER TAILOR'}</h2>
              <button type="button" className="close-modal-btn" onClick={() => setIsFormOpen(false)} aria-label="Close">×</button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-form-grid">
                
                {/* Basic Details */}
                <div className="form-group-custom">
                  <label htmlFor="t-name">Full Name</label>
                  <input id="t-name" 
                    type="text" 
                    placeholder="E.g. Arjun Sharma" 
                    value={tName} 
                    onChange={(e) => setTName(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group-custom">
                  <label htmlFor="t-city">City</label>
                  <select id="t-city" value={tCity} onChange={(e) => setTCity(e.target.value)}>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Pune">Pune</option>
                    <option value="Jaipur">Jaipur</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Lucknow">Lucknow</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>

                <div className="form-group-custom">
                  <label htmlFor="t-badge">Specialty Badge</label>
                  <input id="t-badge" 
                    type="text" 
                    placeholder="E.g. MASTER OF BESPOKE SUITS" 
                    value={tBadge} 
                    onChange={(e) => setTBadge(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-row-3col">
                  <div className="form-group-custom">
                    <label htmlFor="t-rating">Rating</label>
                    <input id="t-rating" 
                      type="number" 
                      step="0.1" 
                      min="1.0" 
                      max="5.0" 
                      value={tRating} 
                      onChange={(e) => setTRating(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group-custom">
                    <label htmlFor="t-reviews">Reviews</label>
                    <input id="t-reviews" 
                      type="number" 
                      value={tReviews} 
                      onChange={(e) => setTReviews(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group-custom">
                    <label htmlFor="t-exp">Experience (Yrs)</label>
                    <input id="t-exp" 
                      type="number" 
                      value={tExp} 
                      onChange={(e) => setTExp(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                {/* Profile Image selector */}
                <div className="form-group-custom">
                  <label htmlFor="t-image">Profile Image Source</label>
                  <select id="t-image" value={tImageIndex} onChange={(e) => setTImageIndex(parseInt(e.target.value, 10))}>
                    <option value={-1}>Custom URL (Paste below)</option>
                    {TAILOR_IMAGES.map((_, idx) => (
                      <option key={idx} value={idx}>Local Tailor Image {idx + 1}</option>
                    ))}
                  </select>
                </div>

                {tImageIndex === -1 && (
                  <div className="form-group-custom">
                    <label htmlFor="t-image-url">Custom Image URL</label>
                    <input id="t-image-url" 
                      type="url" 
                      placeholder="Paste image link..." 
                      value={tCustomImage} 
                      onChange={(e) => setTCustomImage(e.target.value)}
                      required={tImageIndex === -1}
                    />
                  </div>
                )}

                {/* Tags */}
                <div className="form-group-custom">
                  <label htmlFor="t-tags">Tags (Comma-separated)</label>
                  <input id="t-tags" 
                    type="text" 
                    placeholder="Bespoke Suits, Wedding Wear, Indian Ethnic" 
                    value={tTags} 
                    onChange={(e) => setTTags(e.target.value)} 
                  />
                </div>

                {/* Specialties Selection */}
                <div className="form-group-custom full-width">
                  <span className="form-label-text" id="t-specs-label">Garment Specialties</span>
                  <div className="specialties-checkbox-grid" role="group" aria-labelledby="t-specs-label">
                    {AVAILABLE_SPECIALTIES.map(spec => (
                      <label key={spec} className="brutalist-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={tSelectedSpecialties.includes(spec)}
                          onChange={() => toggleSpecialtySelection(spec)}
                        />
                        <span className="capitalize">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dynamic Pricing settings for checked specialties */}
                {tSelectedSpecialties.length > 0 && (
                  <div className="form-group-custom full-width">
                    <span className="form-label-text">Stitching Prices (₹)</span>
                    <div className="prices-input-grid">
                      {tSelectedSpecialties.map(spec => {
                        const capitalized = spec.charAt(0).toUpperCase() + spec.slice(1);
                        return (
                          <div key={spec} className="price-input-row">
                            <span className="capitalize label">{spec}</span>
                            <input 
                              type="number"
                              min="0"
                              max="200000"
                              aria-label={`${capitalized} price in rupees`}
                              value={tPrices[capitalized] || 1000}
                              onChange={(e) => handlePriceChange(capitalized, e.target.value)}
                              required
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              <div className="form-modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsFormOpen(false)}>CANCEL</button>
                <button type="submit" className="save-btn">SAVE TAILOR DETAILS</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
