import React, { useState } from 'react';

export default function JoinView({ showToast }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [experience, setExperience] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [specialties, setSpecialties] = useState('');
  
  // Custom file browse state
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast(`Application Submitted! Thank you, ${fullName}.`);
    
    // Reset form
    setFullName('');
    setEmail('');
    setPhone('');
    setCity('');
    setExperience('');
    setPortfolio('');
    setSpecialties('');
    setUploadedFile(null);
  };

  return (
    <div className="join-page-container">
      {/* Page Header */}
      <div className="page-header-container" style={{ padding: '0 0 20px' }}>
        <h2 className="page-title">JOIN AS A TAILOR</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '-15px' }}>
          Partner with Darzzee, get stitching orders from your city & grow your tailor boutique.
        </p>
      </div>

      {/* Recruitment Form */}
      <div className="join-form-wrapper">
        <form onSubmit={handleSubmit}>
          
          <div className="form-row-2col">
            <div className="form-group-full">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="join-input"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="form-group-full">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="email@example.com"
                className="join-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group-full">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                className="join-input"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group-full">
              <label className="form-label">City of Operations</label>
              <input
                type="text"
                placeholder="E.g. Mumbai, Delhi, Pune..."
                className="join-input"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group-full">
              <label className="form-label">Years of Experience</label>
              <input
                type="number"
                placeholder="Years in tailoring"
                className="join-input"
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
            <div className="form-group-full">
              <label className="form-label">Portfolio Website URL (Optional)</label>
              <input
                type="url"
                placeholder="https://myboutique.com"
                className="join-input"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group-full">
            <label className="form-label">Specialties & Stitching Skills</label>
            <textarea
              placeholder="Describe what garments you stitch best (e.g. Bespoke Suits, Bridal Lehenga, Kurta Pajama, etc.)"
              className="join-input join-textarea"
              required
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
            />
          </div>

          {/* Custom File Browse wrapper */}
          <div className="form-group-full">
            <label className="form-label">Upload Portfolio Resume or Shop Photo (Optional)</label>
            <div className="file-input-wrapper">
              <div className="file-input-display" id="file-name-display">
                {uploadedFile ? uploadedFile.name : 'Browse designs or resume...'}
              </div>
              <div className="file-input-btn">BROWSE</div>
              <input
                type="file"
                className="file-input-hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <button type="submit" className="submit-app-btn">
            Submit Application
          </button>
        </form>
      </div>

      {/* Join Footer Gallery Slider */}
      <div className="join-footer-gallery">
        <div className="join-gallery-slider">
          <div 
            className="join-gallery-img" 
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1528570220977-cfc357f86f7b?auto=format&fit=crop&w=600&q=80')` }}
          />
          <div 
            className="join-gallery-img" 
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80')` }}
          />
          <div 
            className="join-gallery-img" 
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80')` }}
          />
        </div>
      </div>
    </div>
  );
}
