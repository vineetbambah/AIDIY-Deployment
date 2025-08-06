// src/pages/SignUpPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { tw } from '@twind/core';
import { API_BASE_URL } from '../api';

/* -------------------- CONFIG -------------------- */
const GOOGLE_CLIENT_ID =
  '670147633419-rebvnb3b4h848pipit4hv2q1s3u09ln2.apps.googleusercontent.com';

/* ------------------------------------------------ */
const SignUpPage = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();

  /* ------------- local state ------------- */
  const [formData, setFormData] = useState({
    firstName: '', lastName: '',
    email:     '', phoneNumber: '',
    password:  '', confirmPassword: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');      // Google-sign-up message
  const [avatarPreview, setAvatarPreview] = useState(null);


  /* ------------- client-side validation ------------- */
  const validateForm = () => {
    const e = {};
    if (!formData.firstName.trim())                e.firstName = 'First name is required';
    if (!formData.lastName.trim())                 e.lastName  = 'Last name is required';
    if (!formData.email.trim())                    e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email     = 'Email is invalid';
    if (!formData.phoneNumber.trim())              e.phoneNumber = 'Phone number is required';
    if (!formData.password)                        e.password  = 'Password is required';
    else if (formData.password.length < 6)         e.password  = 'Min 6 characters';
    if (!formData.confirmPassword)                 e.confirmPassword = 'Please confirm';
    else if (formData.password !== formData.confirmPassword)
                                                  e.confirmPassword = 'Passwords do not match';
    if (!agreedToTerms)                            e.terms     = 'Please accept the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ------------- text field change ------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  /* ------------- handle avatar upload ------------- */
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors({ ...errors, avatar: 'Image size should be less than 5MB' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      if (errors.avatar) {
        setErrors({ ...errors, avatar: '' });
      }
    }
  };

  /* ------------- form submit (email signup) ------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      /* 1️⃣  register (note: extra fields are auto-generated so backend is always happy) */
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName:   formData.firstName,
          lastName:    formData.lastName,
          email:       formData.email,
          phoneNumber: formData.phoneNumber,
          password:    formData.password,

          // ---- optional extras expected later in the pipeline ----
          birthDate: '2000-01-01',
          username:  `${formData.firstName.toLowerCase()}${Date.now().toString(36)}`,
          loginCode: `${Math.floor(1000 + Math.random() * 9000)}`,
          avatar:    '🙂',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ submit: data.error || 'Registration failed' });
        return;
      }

      /* 2️⃣  send OTP */
      await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      navigate('/otp-verification', { 
        state: { 
          email: formData.email,
          password: formData.password // Pass password for auto-login after verification
        } 
      });
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  /* ==================== GOOGLE SIGN-UP ==================== */
  const handleCredentialResponse = useCallback(
    async (resp) => {
      const idToken = resp.credential;
      setErrorMsg('');
      try {
        dispatch(loginStart());
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken }),
        });
        const data = await res.json();

        /* decode email so we can fall back to OTP */
        const payload = JSON.parse(atob(idToken.split('.')[1] || ''));
        const emailFromToken = payload?.email || '';

        if (data.otpRequired) {
          navigate('/otp-verification', { state: { email: emailFromToken } });
          return;
        }

        if (data.success) {
          sessionStorage.setItem('app_token', data.appToken);
          dispatch(loginSuccess({ user: data.user, token: data.appToken }));
          navigate('/profile');
        } else {
          dispatch(loginFailure(data.error || 'Google sign-up failed'));
          setErrorMsg(data.error || 'Google sign-up failed');
        }
      } catch (err) {
        console.error(err);
        dispatch(loginFailure('Network error'));
        setErrorMsg('Network error – please try again');
      }
    },
    [dispatch, navigate],
  );

  /* load + render Google button once */
  useEffect(() => {
    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
          });
          const div = document.getElementById('google-signup');
          if (div) {
            div.innerHTML = '';
            window.google.accounts.id.renderButton(div, {
              theme: 'outline',
              size:  'large',
            });
          }
        } catch (err) {
          console.error('Google init error:', err);
        }
      } else {
        setTimeout(initGoogle, 800);
      }
    };
    initGoogle();
  }, [handleCredentialResponse]);

  /* ============================ UI ============================ */
  return (
    <div className={tw(
        'min-h-screen bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center p-4',
      )}>
      <div className={tw(
          'w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden',
        )}>
        {/* banner */}
        <div className={tw('bg-gradient-to-r from-sky-100 to-teal-100 p-6')}>
          <h1 className={tw('text-4xl font-bold text-sky-400 text-center')}>
            AIDIY
          </h1>
        </div>

        <div className={tw('p-8 md:p-12')}>
          <div className={tw('grid md:grid-cols-2 gap-8 items-center')}>
            {/* ---------- FORM COLUMN ---------- */}
            <div>
              <h2 className={tw('text-3xl font-bold text-gray-800 mb-2')}>
                Sign Up
              </h2>
              <p className={tw('text-gray-600 mb-6')}>
                Let&apos;s get you set up to access your personal account
              </p>

              {/* SIGN-UP FORM */}
              <form onSubmit={handleSubmit} className={tw('space-y-4')}>
                {/* Avatar Upload */}
                <div className={tw('flex justify-center mb-6')}>
                  <div className={tw('relative')}>
                    <div className={tw(
                      'w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity'
                    )}>
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Avatar preview" 
                          className={tw('w-full h-full object-cover')}
                        />
                      ) : (
                        <div className={tw('text-center')}>
                          <span className={tw('text-3xl text-gray-400')}>📷</span>
                          <p className={tw('text-xs text-gray-500 mt-1')}>Upload</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className={tw('absolute inset-0 w-full h-full opacity-0 cursor-pointer')}
                    />
                  </div>
                </div>
                {errors.avatar && (
                  <p className={tw('text-red-500 text-xs text-center -mt-4 mb-4')}>{errors.avatar}</p>
                )}

                {/* first + last */}
                <div className={tw('grid grid-cols-2 gap-4')}>
                  {[
                    ['firstName', 'First name'],
                    ['lastName',  'Last name'],
                  ].map(([name, label]) => (
                    <div key={name}>
                      <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                        {label}
                      </label>
                      <input
                        type="text"
                        name={name}
                        value={formData[name]}
                        placeholder={`Enter your ${label.toLowerCase()}`}
                        onChange={handleChange}
                        className={tw('w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors')}
                      />
                      {errors[name] && (
                        <p className={tw('text-red-500 text-xs mt-1')}>{errors[name]}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* email */}
                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    placeholder="Enter your email id"
                    onChange={handleChange}
                    className={tw('w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors')}
                  />
                  {errors.email && (
                    <p className={tw('text-red-500 text-xs mt-1')}>{errors.email}</p>
                  )}
                </div>

                {/* phone */}
                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    placeholder="Enter your phone number"
                    onChange={handleChange}
                    className={tw('w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors')}
                  />
                  {errors.phoneNumber && (
                    <p className={tw('text-red-500 text-xs mt-1')}>{errors.phoneNumber}</p>
                  )}
                </div>

                {/* pwd + confirm */}
                {[
                  ['password',        'Password',         'Enter your new password'],
                  ['confirmPassword', 'Confirm Password', 'Confirm your password'],
                ].map(([name, label, ph]) => (
                  <div key={name}>
                    <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                      {label}
                    </label>
                    <input
                      type="password"
                      name={name}
                      value={formData[name]}
                      placeholder={ph}
                      onChange={handleChange}
                      className={tw('w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors')}
                    />
                    {errors[name] && (
                      <p className={tw('text-red-500 text-xs mt-1')}>{errors[name]}</p>
                    )}
                  </div>
                ))}

                {/* terms checkbox */}
                <div className={tw('flex items-center')}>
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className={tw('w-4 h-4 text-sky-400 border-gray-300 rounded focus:ring-sky-400')}
                  />
                  <label htmlFor="terms" className={tw('ml-2 text-sm text-gray-600')}>
                    I agree to all the Terms and Privacy Policies
                  </label>
                </div>
                {errors.terms && (
                  <p className={tw('text-red-500 text-xs')}>{errors.terms}</p>
                )}

                {errors.submit && (
                  <p className={tw('text-red-500 text-sm text-center')}>
                    {errors.submit}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={tw('w-full py-3 bg-gradient-to-r from-teal-400 to-purple-400 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed')}
                >
                  {loading ? 'Creating Account…' : 'Create Account'}
                </button>
              </form>

              {/* login link */}
              <div className={tw('mt-6 text-center')}>
                <p className={tw('text-gray-600')}>
                  Already have an account?{' '}
                  <Link to="/login" className={tw('text-purple-600 hover:underline font-semibold')}>
                    Login
                  </Link>
                </p>
              </div>

              {/* ---------- social sign-up ---------- */}
              <div className={tw('mt-6')}>
                <p className={tw('text-center text-gray-500 mb-4')}>or Sign up with</p>
                <div className={tw('grid grid-cols-2 gap-4')}>
                  {/* Google button mounts here */}
                  <div id="google-signup" className={tw('w-full')} />

                  {/* Facebook placeholder */}
                  <button
                    type="button"
                    className={tw('flex items-center justify-center py-3 px-4 bg-gradient-to-r from-teal-300 to-purple-300 text-gray-700 font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-300')}
                  >
                    <img
                      src="https://www.facebook.com/favicon.ico"
                      alt="Facebook"
                      className={tw('w-5 h-5 mr-2')}
                    />
                    Facebook
                  </button>
                </div>

                {errorMsg && (
                  <p className={tw('text-red-600 text-sm text-center mt-3')}>
                    {errorMsg}
                  </p>
                )}
              </div>
            </div>

            {/* ---------- IMAGE COLUMN ---------- */}
            <div className={tw('hidden md:flex items-center justify-center')}>
              <div className={tw('relative')}>
                <div className={tw('absolute inset-0 bg-gradient-to-br from-purple-200 to-teal-200 rounded-full blur-3xl opacity-50')} />
                <img
                  src="https://placehold.co/400x500/e0e7ff/7c3aed?text=AIDIY&font=roboto"
                  alt="AIDIY App"
                  className={tw('relative z-10 w-80 h-auto')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
