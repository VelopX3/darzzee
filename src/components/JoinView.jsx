import React, { useEffect, useRef, useState } from 'react';
import { cleanText, inRange, isValidEmail, isValidPhone, digitsOnly } from '../lib/validation';
import { friendlyError, submitTailorApplication, uploadUserFile, validateUpload, UPLOAD_RULES } from '../supabase';
import { hideBrokenImage, FieldError, FormError, PageLoader, SignInPrompt, Spinner } from './ui';

const GALLERY = [
  { src: 'https://images.unsplash.com/photo-1528570220977-cfc357f86f7b?auto=format&fit=crop&w=600&q=70', alt: 'Tailor workshop with fabric rolls' },
  { src: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=70', alt: 'Tailored suit jacket detail' },
  { src: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=70', alt: 'Tailor at work on a garment' }
];

const EMPTY = { fullName: '', email: '', phone: '', city: '', experience: '', portfolio: '', specialties: '' };

export default function JoinView({ user, authReady, showToast }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, email: user?.email || '' }));
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const submittingRef = useRef(false);
  const fileInputRef = useRef(null);

  // The session may resolve after first render: prefill the email once known.
  const userEmail = user?.email || '';
  useEffect(() => {
    if (userEmail) setForm((prev) => (prev.email ? prev : { ...prev, email: userEmail }));
  }, [userEmail]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const pickFile = (f) => {
    if (!f) return;
    const problem = validateUpload(f, 'document');
    if (problem) {
      setFile(null);
      setFileError(problem);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFileError('');
    setFile(f);
  };

  const validate = () => {
    if (cleanText(form.fullName, 80).length < 2) return 'Please enter your full name.';
    if (!isValidEmail(form.email)) return 'Please enter a valid email address.';
    if (!isValidPhone(form.phone)) return 'Please enter a valid phone number (10–15 digits).';
    if (cleanText(form.city, 60).length < 2) return 'Please enter your city of operations.';
    if (!inRange(form.experience, 0, 70)) return 'Years of experience must be between 0 and 70.';
    if (form.portfolio.trim()) {
      try {
        const u = new URL(form.portfolio.trim());
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error('bad');
      } catch {
        return 'Portfolio URL must start with http:// or https://';
      }
    }
    if (cleanText(form.specialties, 1000).length < 10) return 'Please describe your specialties (at least 10 characters).';
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

    let attachmentPath = null;
    if (file) {
      try {
        attachmentPath = await uploadUserFile('tailor-portfolios', user.id, file, 'document');
      } catch (err) {
        console.warn('[darzzee] portfolio upload failed', err?.message);
        showToast('Your file could not be uploaded — the application will be sent without it.', 'error');
      }
    }

    try {
      await submitTailorApplication(user.id, {
        full_name: cleanText(form.fullName, 80),
        email: form.email.trim().toLowerCase(),
        phone: digitsOnly(form.phone),
        city: cleanText(form.city, 60),
        experience_years: Number(form.experience),
        portfolio_url: form.portfolio.trim() || null,
        specialties: cleanText(form.specialties, 1000),
        attachment_path: attachmentPath
      });
      setSubmitted(true);
      setForm({ ...EMPTY, email: user?.email || '' });
      setFile(null);
      showToast(`Application submitted — thank you, ${cleanText(form.fullName, 40)}!`, 'success');
    } catch (err) {
      console.error('[darzzee] tailor application failed', err?.code);
      const msg = friendlyError(err, 'We could not submit your application right now. Please try again later.');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="join-page-container">
      <div className="page-header-container align-left">
        <h1 className="page-title">Join as a Tailor</h1>
        <p className="page-lede">Partner with DARZZEE, receive stitching orders from customers in your city and grow your tailoring business.</p>
      </div>

      <div className="join-form-wrapper">
        {!authReady ? (
          <PageLoader label="Checking your session…" />
        ) : !user ? (
          <SignInPrompt title="Apply to join DARZZEE" message="Sign in or create a free account to submit your tailor application." />
        ) : submitted ? (
          <div className="signin-prompt success-panel" role="status">
            <h2>Application received</h2>
            <p>Our partner team will review your details and contact you on the phone number or email you provided.</p>
            <button type="button" className="btn btn-secondary" onClick={() => setSubmitted(false)}>Submit another application</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
            <div className="form-row-2col">
              <div className="form-group-full">
                <label className="form-label" htmlFor="join-name">Full name</label>
                <input id="join-name" type="text" autoComplete="name" className="join-input" required maxLength={80} value={form.fullName} onChange={set('fullName')} />
              </div>
              <div className="form-group-full">
                <label className="form-label" htmlFor="join-email">Email address</label>
                <input id="join-email" type="email" autoComplete="email" className="join-input" required maxLength={254} value={form.email} onChange={set('email')} />
              </div>
            </div>
            <div className="form-row-2col">
              <div className="form-group-full">
                <label className="form-label" htmlFor="join-phone">Phone number</label>
                <input id="join-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="10-digit mobile number" className="join-input" required maxLength={20} value={form.phone} onChange={set('phone')} />
              </div>
              <div className="form-group-full">
                <label className="form-label" htmlFor="join-city">City of operations</label>
                <input id="join-city" type="text" autoComplete="address-level2" placeholder="E.g. Mumbai, Delhi, Pune…" className="join-input" required maxLength={60} value={form.city} onChange={set('city')} />
              </div>
            </div>
            <div className="form-row-2col">
              <div className="form-group-full">
                <label className="form-label" htmlFor="join-exp">Years of experience</label>
                <input id="join-exp" type="number" inputMode="numeric" min="0" max="70" className="join-input" required value={form.experience} onChange={set('experience')} />
              </div>
              <div className="form-group-full">
                <label className="form-label" htmlFor="join-portfolio">Portfolio website <span className="optional">(optional)</span></label>
                <input id="join-portfolio" type="url" inputMode="url" placeholder="https://myboutique.com" className="join-input" maxLength={300} value={form.portfolio} onChange={set('portfolio')} />
              </div>
            </div>
            <div className="form-group-full">
              <label className="form-label" htmlFor="join-specialties">Specialties &amp; stitching skills</label>
              <textarea
                id="join-specialties"
                placeholder="Describe what garments you stitch best (e.g. bespoke suits, bridal lehenga, kurta pajama)"
                className="join-input join-textarea"
                required
                maxLength={1000}
                value={form.specialties}
                onChange={set('specialties')}
              />
            </div>
            <div className="form-group-full">
              <label className="form-label" htmlFor="join-file">Portfolio, résumé or shop photo <span className="optional">(optional)</span></label>
              <div className="file-input-wrapper">
                <span className="file-input-display">{file ? file.name : 'Browse designs or résumé…'}</span>
                <span className="file-input-btn" aria-hidden="true">Browse</span>
                <input
                  id="join-file"
                  ref={fileInputRef}
                  type="file"
                  className="file-input-overlay"
                  accept={UPLOAD_RULES.document.accept}
                  onChange={(e) => pickFile(e.target.files?.[0])}
                  aria-describedby="join-file-hint"
                />
              </div>
              <span id="join-file-hint" className="upload-hint">{UPLOAD_RULES.document.hint}</span>
              <FieldError id="join-file-error">{fileError}</FieldError>
            </div>

            <FormError id="join-error">{formError}</FormError>
            <button type="submit" className="submit-app-btn" disabled={submitting}>
              {submitting ? <><Spinner /> Submitting…</> : 'Submit application'}
            </button>
          </form>
        )}
      </div>

      <div className="join-footer-gallery">
        <ul className="join-gallery-slider">
          {GALLERY.map((g) => (
            <li key={g.src}>
              <img className="join-gallery-img" src={g.src} alt={g.alt} loading="lazy" decoding="async" width="600" height="420" onError={hideBrokenImage} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
