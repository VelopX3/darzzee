import React, { useState, useRef } from 'react';

export default function AlterationView({ showToast, navigateTo }) {
  const [description, setDescription] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'online'
  
  // Drag and drop states
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
      showToast(`Selected file: ${e.dataTransfer.files[0].name}`);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      showToast(`Selected file: ${e.target.files[0].name}`);
    }
  };

  const triggerFileBrowser = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulate submission
    showToast(`Alteration Request Sent successfully! Method: ${paymentMethod.toUpperCase()}`);
    
    // Reset fields
    setDescription('');
    setStreet('');
    setCity('');
    setState('');
    setPincode('');
    setUploadedFile(null);
    setPaymentMethod('cod');

    // Route to profile page after order placement
    navigateTo('profile', true);
  };

  return (
    <div className="alteration-page-container">
      <div className="page-header-container" style={{ padding: '0 0 30px' }}>
        <h2 className="page-title">ALTERATION SERVICE</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '-15px' }}>
          Have clothes that don't fit? Send photo & description, our tailor will collect it.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="alteration-grid">
          
          {/* Left Column: File Upload & Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Drag & Drop Card */}
            <div 
              className="upload-card-brutalist"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileBrowser}
              style={{
                borderColor: isDragOver ? 'var(--color-orange)' : 'var(--color-border)',
                backgroundColor: isDragOver ? 'var(--color-gray-light)' : '#ffffff',
                borderStyle: isDragOver ? 'solid' : 'dashed',
                borderWidth: isDragOver ? 'var(--border-width-thick)' : 'var(--border-width-thin)'
              }}
            >
              <div className="upload-label-optional">OPTIONAL</div>
              
              <div className="upload-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>

              <div className="upload-text">
                {uploadedFile ? (
                  <span>File: {uploadedFile.name}</span>
                ) : (
                  <>Drag & drop outfit photo or <span>Browse files</span></>
                )}
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Description box */}
            <div className="form-group-custom">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                Describe alteration details
              </label>
              <textarea 
                className="alteration-textarea"
                placeholder="E.g. shorten sleeves by 2 inches, tighten waist, taper trouser legs..."
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column: Address & Payments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Address inputs */}
            <div className="booking-form-card">
              <h4 className="section-subtitle" style={{ marginTop: 0 }}>PICKUP ADDRESS</h4>
              
              <div className="form-group-custom" style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '10px', fontWeight: 600 }}>Street Address</label>
                <input 
                  type="text" 
                  placeholder="Apartment, Street and Area" 
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>

              <div className="form-group-custom" style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '10px', fontWeight: 600 }}>City</label>
                <input 
                  type="text" 
                  placeholder="City" 
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="form-row-2col" style={{ margin: 0, gap: '8px' }}>
                <div className="form-group-custom">
                  <label style={{ fontSize: '10px', fontWeight: 600 }}>State</label>
                  <input 
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
                    type="text" 
                    placeholder="Pincode" 
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Payment options */}
            <div className="booking-form-card">
              <h4 className="section-subtitle" style={{ marginTop: 0 }}>PAYMENT METHOD</h4>
              
              {/* COD Radio Card */}
              <div 
                className={`selectable-option-card payment-card ${paymentMethod === 'cod' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <input 
                  type="radio" 
                  name="alterPayment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <div>
                  <div className="label">CASH ON COLLECTION</div>
                  <div style={{ fontSize: '9px', textTransform: 'none', fontWeight: 500 }}>
                    Pay our agent when they collect the clothes
                  </div>
                </div>
              </div>

              {/* Online Payment Radio Card */}
              <div 
                className={`selectable-option-card payment-card ${paymentMethod === 'online' ? 'active-online' : ''}`}
                onClick={() => setPaymentMethod('online')}
              >
                <input 
                  type="radio" 
                  name="alterPayment"
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                  style={{ accentColor: '#000' }}
                />
                <div>
                  <div className="label">ONLINE PAYMENT</div>
                  <div style={{ fontSize: '9px', textTransform: 'none', fontWeight: 500 }}>
                    Pay securely online using Credit/Debit Card/UPI
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="send-request-btn">
              Send Request
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
