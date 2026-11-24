import React, { useRef, useState } from 'react';
import { useRouter } from '../lib/router';
import { cleanText, isValidPincode } from '../lib/validation';
import { friendlyError, uploadUserFile, validateUpload, UPLOAD_RULES } from '../supabase';
import { FieldError, FormError, PageLoader, SignInPrompt, Spinner } from './ui';

export default function AlterationView({ user, authReady, showToast, onSubmitBooking }) {
  const { navigate } = useRouter();
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState({ street: '', city: '', state: '', pincode: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const submittingRef = useRef(false);
  const fileInputRef = useRef(null);

  const pickFile = (f) => {
    if (!f) return;
    const problem = validateUpload(f, 'photo');
    if (problem) {
      setFile(null);
      setFileError(problem);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFileError('');
    setFile(f);
  };

  const setAddr = (key, value) => setAddress((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    if (cleanText(description, 1000).length < 10) return 'Please describe the alteration (at least 10 characters).';
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

    let photoPath;
    if (file) {
      try {
        photoPath = await uploadUserFile('alteration-photos', user.id, file, 'photo');
      } catch (err) {
        console.warn('[darzzee] alteration photo upload failed', err?.message);
        showToast('Your photo could not be uploaded — the request will be sent without it.', 'error');
      }
    }

    const cleanAddress = {
      street: cleanText(address.street, 200),
      city: cleanText(address.city, 60),
      state: cleanText(address.state, 60),
      pincode: address.pincode.trim()
    };

    try {
      await onSubmitBooking({
        requestType: 'alteration',
        tailorName: 'Alteration desk',
        tailorCity: cleanAddress.city,
        garment: 'Alteration',
        fabric: 'Customer garment',
        notes: cleanText(description, 1000),
        photoPath,
        consultationMode: 'pickup',
        measurements: null,
        address: cleanAddress,
        speed: 'normal',
        paymentMethod,
        total: 0, // quoted after the tailor inspects the garment
        status: 'assigned',
        date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
      });
      showToast('Alteration request sent! We’ll contact you to schedule the pickup.', 'success');
      navigate('/profile#bookings');
    } catch (err) {
      console.error('[darzzee] alteration request failed', err);
      const msg = friendlyError(err, 'We could not send your request. Please try again.');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="alteration-page-container">
      <div className="page-header-container align-left">
        <h1 className="page-title">Alteration Service</h1>
        <p className="page-lede">
          Clothes that don’t fit? Describe the change and add a photo — our tailor collects the garment from your door, alters it and brings it back.
        </p>
      </div>

      {!authReady ? (
        <PageLoader label="Checking your session…" />
      ) : !user ? (
        <SignInPrompt title="Request an alteration" message="Sign in or create a free account to request a doorstep alteration pickup." />
      ) : (
        <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
          <div className="alteration-grid">
            <div className="stack">
              <div
                className={`upload-card-brutalist ${isDragOver ? 'is-dragover' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  pickFile(e.dataTransfer.files?.[0]);
                }}
              >
                <span className="upload-label-optional">Optional</span>
                <svg className="upload-icon-wrapper" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <label htmlFor="alteration-photo" className="upload-text">
                  {file ? <>Selected: <span className="file-name">{file.name}</span></> : <>Drag &amp; drop an outfit photo or <span className="underline">browse files</span></>}
                </label>
                <span className="upload-hint">{UPLOAD_RULES.photo.hint}</span>
                <input
                  id="alteration-photo"
                  ref={fileInputRef}
                  type="file"
                  className="file-input-overlay"
                  accept={UPLOAD_RULES.photo.accept}
                  onChange={(e) => pickFile(e.target.files?.[0])}
                  aria-describedby={fileError ? 'photo-error' : undefined}
                />
                {file && (
                  <button type="button" className="text-link remove-file" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                    Remove photo
                  </button>
                )}
              </div>
              <FieldError id="photo-error">{fileError}</FieldError>

              <div className="form-group-custom">
                <label htmlFor="alteration-desc">Describe the alteration</label>
                <textarea
                  id="alteration-desc"
                  className="alteration-textarea"
                  placeholder="E.g. shorten sleeves by 2 inches, tighten waist, taper trouser legs…"
                  required
                  minLength={10}
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="stack">
              <fieldset className="booking-form-card">
                <legend className="section-subtitle">Pickup address</legend>
                <div className="form-group-custom">
                  <label htmlFor="alt-street">Street address</label>
                  <input id="alt-street" type="text" autoComplete="street-address" placeholder="Apartment, street and area" required maxLength={200} value={address.street} onChange={(e) => setAddr('street', e.target.value)} />
                </div>
                <div className="form-group-custom">
                  <label htmlFor="alt-city">City</label>
                  <input id="alt-city" type="text" autoComplete="address-level2" required maxLength={60} value={address.city} onChange={(e) => setAddr('city', e.target.value)} />
                </div>
                <div className="form-row-2col">
                  <div className="form-group-custom">
                    <label htmlFor="alt-state">State</label>
                    <input id="alt-state" type="text" autoComplete="address-level1" required maxLength={60} value={address.state} onChange={(e) => setAddr('state', e.target.value)} />
                  </div>
                  <div className="form-group-custom">
                    <label htmlFor="alt-pincode">Pincode</label>
                    <input id="alt-pincode" type="text" inputMode="numeric" autoComplete="postal-code" maxLength={6} required value={address.pincode} onChange={(e) => setAddr('pincode', e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="booking-form-card">
                <legend className="section-subtitle">Payment method</legend>
                {[
                  { value: 'cod', title: 'Cash on collection', sub: 'Pay our agent when they collect the clothes' },
                  { value: 'online', title: 'Online payment', sub: 'Pay online using credit/debit card or UPI' }
                ].map((opt) => (
                  <label key={opt.value} className={`selectable-option-card payment-card ${paymentMethod === opt.value ? 'active' : ''}`}>
                    <input type="radio" name="alterPayment" value={opt.value} checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)} />
                    <span>
                      <span className="label">{opt.title}</span>
                      <span className="subtext">{opt.sub}</span>
                    </span>
                  </label>
                ))}
                <p className="form-note">The alteration price is quoted after the tailor inspects your garment.</p>
              </fieldset>

              <FormError id="alteration-error">{formError}</FormError>
              <button type="submit" className="send-request-btn" disabled={submitting}>
                {submitting ? <><Spinner /> Sending request…</> : 'Send request'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
