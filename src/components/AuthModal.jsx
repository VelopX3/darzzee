import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  loginUser, 
  registerUser, 
  signInWithGoogle, 
  sendPasswordResetEmail, 
  resetPassword, 
  isMock,
  verifyMockUser
} from '../supabase';

export default function AuthModal({ onAuthSuccess, showToast, initialMode = 'SIGN_IN', onCloseMode }) {
  const [mode, setMode] = useState(initialMode); // 'SIGN_IN', 'SIGN_UP', 'FORGOT_PASSWORD', 'RESET_PASSWORD', 'VERIFICATION'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Strength score & checks
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: 'TOO SHORT' });
  const [emailValid, setEmailValid] = useState(true);

  // Keep mode in sync with parent redirect hooks (e.g. for reset link redirection)
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Read email from local storage if Remember Me was checked previously
  useEffect(() => {
    if (mode === 'SIGN_IN') {
      const savedEmail = localStorage.getItem('darzzee_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, [mode]);

  // Email validator
  const validateEmail = (input) => {
    setEmail(input);
    if (input === '') {
      setEmailValid(true);
      return;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(regex.test(input));
  };

  // Password strength checker
  const checkPasswordStrength = (pwd) => {
    setPassword(pwd);
    if (pwd.length === 0) {
      setPasswordStrength({ score: 0, text: 'EMPTY' });
      return;
    }
    if (pwd.length < 6) {
      setPasswordStrength({ score: 1, text: 'TOO SHORT' });
      return;
    }

    let score = 2; // length >= 6 is weak baseline
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    if (hasUpper) score += 1;
    if (hasNum) score += 1;
    if (hasSpecial) score += 1;

    let text = 'WEAK';
    if (score >= 5) {
      text = 'STRONG';
    } else if (score >= 3) {
      text = 'MEDIUM';
    }

    setPasswordStrength({ score: score - 1, text }); // normalize score to 1-4 scale
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!emailValid) {
      showToast("PLEASE ENTER A VALID EMAIL ADDRESS!");
      return;
    }

    // REMEMBER ME handling
    if (mode === 'SIGN_IN') {
      if (rememberMe) {
        localStorage.setItem('darzzee_remembered_email', email);
      } else {
        localStorage.removeItem('darzzee_remembered_email');
      }
    }

    switch (mode) {
      case 'SIGN_IN':
        setLoading(true);
        try {
          await loginUser(email, password);
          showToast("LOGGED IN SUCCESSFULLY!");
          onAuthSuccess();
        } catch (err) {
          console.error(err);
          if (err.message?.toLowerCase().includes('invalid login credentials') || err.message?.toLowerCase().includes('wrong-password') || err.message?.toLowerCase().includes('user-not-found')) {
            showToast("INCORRECT PASSWORD OR EMAIL!");
          } else {
            showToast(err.message || "LOGIN FAILED!");
          }
        } finally {
          setLoading(false);
        }
        break;

      case 'SIGN_UP':
        if (password !== confirmPassword) {
          showToast("PASSWORDS DO NOT MATCH!");
          return;
        }
        if (passwordStrength.score < 2) {
          showToast("PASSWORD IS TOO WEAK!");
          return;
        }
        setLoading(true);
        try {
          await registerUser(email, password, name, phone);
          showToast("VERIFICATION CODE SENT!");
          setMode('VERIFICATION');
        } catch (err) {
          console.error(err);
          if (err.message?.toLowerCase().includes('already registered') || err.code === '23505') {
            showToast("ACCOUNT ALREADY EXISTS!");
          } else {
            showToast(err.message || "REGISTRATION FAILED!");
          }
        } finally {
          setLoading(false);
        }
        break;

      case 'FORGOT_PASSWORD':
        setLoading(true);
        try {
          await sendPasswordResetEmail(email);
          showToast("PASSWORD RESET EMAIL SENT!");
          setMode('SIGN_IN');
        } catch (err) {
          console.error(err);
          showToast(err.message || "FAILED TO SEND RESET LINK!");
        } finally {
          setLoading(false);
        }
        break;

      case 'RESET_PASSWORD':
        if (password !== confirmPassword) {
          showToast("PASSWORDS DO NOT MATCH!");
          return;
        }
        if (password.length < 6) {
          showToast("PASSWORD MUST BE AT LEAST 6 CHARACTERS!");
          return;
        }
        setLoading(true);
        try {
          await resetPassword(password);
          showToast("PASSWORD RESET SUCCESSFUL!");
          // Clean recovery hash from URL query parameter
          if (onCloseMode) onCloseMode();
          setMode('SIGN_IN');
        } catch (err) {
          console.error(err);
          showToast(err.message || "PASSWORD RESET FAILED!");
        } finally {
          setLoading(false);
        }
        break;

      default:
        break;
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithGoogle();
      showToast("GOOGLE LOGIN SUCCESSFUL!");
      onAuthSuccess();
    } catch (err) {
      console.error(err);
      showToast("GOOGLE LOGIN FAILED!");
    } finally {
      setLoading(false);
    }
  };

  // Switch modes helper
  const changeMode = (targetMode) => {
    setMode(targetMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhone('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const renderContent = () => {
    switch (mode) {
      case 'SIGN_IN':
        return (
          <>
            <div className="auth-header">
              <h2>DARZZEE</h2>
              <p>SIGN IN TO YOUR PROFILE</p>
            </div>

            <form onSubmit={handleAction} className="auth-form">
              <div className="auth-field-group">
                <label>EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL" 
                  className={!emailValid ? 'error-input' : ''}
                  required
                />
                {!emailValid && <span className="input-err-text">PLEASE ENTER A VALID EMAIL</span>}
              </div>

              <div className="auth-field-group">
                <label>PASSWORD</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ENTER YOUR PASSWORD" 
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              <div className="auth-remember-row">
                <label className="checkbox-container-brutalist">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-checkmark-brutalist" />
                  <span className="checkbox-label-text">REMEMBER ME</span>
                </label>

                <button 
                  type="button" 
                  className="auth-link-btn"
                  onClick={() => changeMode('FORGOT_PASSWORD')}
                >
                  FORGOT PASSWORD?
                </button>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'LOGGING IN...' : 'SIGN IN'}
              </button>

              <div className="auth-divider-text">OR</div>

              <button type="button" className="auth-social-btn" onClick={handleGoogleLogin} disabled={loading}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1-.8 1.9-1.6 2.5v2.1h2.6c1.5-1.4 2.4-3.5 2.4-6.2z"/>
                  <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.6-2.1c-.7.5-1.7.8-2.9.8-2.3 0-4.1-1.5-4.8-3.6H2v2.2C3.5 16.1 6.1 18 9 18z"/>
                  <path fill="#FBBC05" d="M4.2 10.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V4.9H2C1.3 6.1 1 7.5 1 9s.3 2.9 1 4.1l2.2-2.2z"/>
                  <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.5-2.5C13.5 1 11.4 0 9 0 6.1 0 3.5 1.9 2 4.9l2.2 2.2C4.9 5.1 6.7 3.6 9 3.6z"/>
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </button>

              <div className="auth-footer-prompt">
                DON'T HAVE AN ACCOUNT?{' '}
                <button type="button" className="auth-footer-link" onClick={() => changeMode('SIGN_UP')}>
                  CREATE ACCOUNT
                </button>
              </div>
            </form>
          </>
        );

      case 'SIGN_UP':
        return (
          <>
            <div className="auth-header">
              <h2>DARZZEE</h2>
              <p>CREATE A NEW ACCOUNT</p>
            </div>

            <form onSubmit={handleAction} className="auth-form scrollable-form">
              <div className="auth-field-group">
                <label>FULL NAME</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="ARNA B HAZARIKA" 
                  required
                />
              </div>

              <div className="auth-field-group">
                <label>PHONE NUMBER</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210" 
                  required
                />
              </div>

              <div className="auth-field-group">
                <label>EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL" 
                  className={!emailValid ? 'error-input' : ''}
                  required
                />
                {!emailValid && <span className="input-err-text">PLEASE ENTER A VALID EMAIL</span>}
              </div>

              <div className="auth-field-group">
                <label>PASSWORD</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => checkPasswordStrength(e.target.value)}
                    placeholder="ENTER YOUR PASSWORD" 
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>

                {password.length > 0 && (
                  <div className="password-strength-container">
                    <div className="password-strength-label">
                      STRENGTH: <span className={`strength-badge ${passwordStrength.text.toLowerCase()}`}>{passwordStrength.text}</span>
                    </div>
                    <div className="password-strength-bar-group">
                      <div className={`strength-bar ${passwordStrength.score >= 1 ? 'active ' + passwordStrength.text.toLowerCase() : ''}`} />
                      <div className={`strength-bar ${passwordStrength.score >= 2 ? 'active ' + passwordStrength.text.toLowerCase() : ''}`} />
                      <div className={`strength-bar ${passwordStrength.score >= 3 ? 'active ' + passwordStrength.text.toLowerCase() : ''}`} />
                      <div className={`strength-bar ${passwordStrength.score >= 4 ? 'active ' + passwordStrength.text.toLowerCase() : ''}`} />
                    </div>
                  </div>
                )}
              </div>

              <div className="auth-field-group">
                <label>CONFIRM PASSWORD</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'REGISTERING...' : 'CREATE ACCOUNT'}
              </button>

              <div className="auth-footer-prompt">
                ALREADY HAVE AN ACCOUNT?{' '}
                <button type="button" className="auth-footer-link" onClick={() => changeMode('SIGN_IN')}>
                  SIGN IN
                </button>
              </div>
            </form>
          </>
        );

      case 'FORGOT_PASSWORD':
        return (
          <>
            <div className="auth-header">
              <h2>DARZZEE</h2>
              <p>PASSWORD RECOVERY</p>
            </div>

            <form onSubmit={handleAction} className="auth-form">
              <p className="auth-info-desc">
                ENTER YOUR EMAIL ADDRESS BELOW AND WE'LL SEND YOU A LINK TO RESET YOUR PASSWORD.
              </p>

              <div className="auth-field-group">
                <label>EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL" 
                  className={!emailValid ? 'error-input' : ''}
                  required
                />
                {!emailValid && <span className="input-err-text">PLEASE ENTER A VALID EMAIL</span>}
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'SENDING...' : 'SEND RESET LINK'}
              </button>

              <div className="auth-footer-prompt">
                RETURN TO{' '}
                <button type="button" className="auth-footer-link" onClick={() => changeMode('SIGN_IN')}>
                  SIGN IN
                </button>
              </div>
            </form>
          </>
        );

      case 'RESET_PASSWORD':
        return (
          <>
            <div className="auth-header">
              <h2>DARZZEE</h2>
              <p>RESET YOUR PASSWORD</p>
            </div>

            <form onSubmit={handleAction} className="auth-form">
              <div className="auth-field-group">
                <label>NEW PASSWORD</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              <div className="auth-field-group">
                <label>CONFIRM NEW PASSWORD</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'RESETTING...' : 'UPDATE PASSWORD'}
              </button>
            </form>
          </>
        );

      case 'VERIFICATION':
        return (
          <>
            <div className="auth-header">
              <h2>DARZZEE</h2>
              <p>VERIFICATION SENT</p>
            </div>

            <div className="auth-form" style={{ textAlign: 'center', gap: '25px' }}>
              <div className="verification-icon-circle">
                ✉️
              </div>
              
              <p className="auth-info-desc" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                WE HAVE SENT A VERIFICATION EMAIL TO YOUR INBOX. PLEASE CLICK ON THE LINK IN THE EMAIL TO ACTIVATE YOUR ACCOUNT.
              </p>

              {isMock && (
                <div className="demo-verification-helper" style={{ border: '2px dashed var(--color-orange)', padding: '10px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800 }}>DEMO MODE HELPER:</p>
                  <button 
                    type="button" 
                    className="auth-submit-btn" 
                    style={{ marginTop: '5px', padding: '8px' }}
                    onClick={() => {
                      verifyMockUser(email);
                      onAuthSuccess();
                    }}
                  >
                    AUTO VERIFY & ENTER SITE
                  </button>
                </div>
              )}

              <button 
                type="button" 
                className="auth-link-btn"
                style={{ alignSelf: 'center', textDecoration: 'underline' }}
                onClick={() => changeMode('SIGN_IN')}
              >
                RETURN TO LOGIN
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="auth-overlay">
      <motion.div 
        className="auth-modal-card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {isMock && (
          <div className="demo-banner">
            RUNNING IN DEMO MODE — ANY MOCK ACCOUNT IS ACCEPTED
          </div>
        )}
        
        {renderContent()}
      </motion.div>
    </div>
  );
}
