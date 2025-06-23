// src/pages/ForgotPassword.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { tw } from '@twind/core';
import { API_BASE_URL } from '../api';

const ForgotPassword = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  /* ------------------- component state ------------------- */
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState(1); // 1 = email/OTP, 2 = reset pwd

  /* --------- land here FROM otp-verification page -------- */
  useEffect(() => {
    if (location.state?.allowReset) {
      setFormData((p) => ({ ...p, email: location.state.email }));
      setStep(2);
    }
  }, [location.state]);

  /* ------------------ helper validators ------------------ */
  const validateEmail = () => {
    const errs = {};
    if (!formData.email.trim())                    errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Email is invalid';
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const validatePassword = () => {
    const errs = {};
    if (!formData.newPassword)               errs.newPassword = 'Password is required';
    else if (formData.newPassword.length < 6) errs.newPassword = 'Min 6 characters';
    if (!formData.confirmPassword)            errs.confirmPassword = 'Confirm password';
    else if (formData.newPassword !== formData.confirmPassword)
                                              errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  /* ---------------- field change handler ----------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  /* --------------------- step-1: send OTP ---------------- */
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await r.json();

      if (r.ok) {
        navigate('/otp-verification', {
          state: { email: formData.email, isPasswordReset: true },
        });
      } else {
        setErrors({ submit: data.error || 'Failed to send OTP' });
      }
    } catch {
      setErrors({ submit: 'Network error. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  /* ------------------- step-2: reset pwd ----------------- */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          newPassword: formData.newPassword,
        }),
      });
      const data = await r.json();

      if (r.ok) {
        navigate('/login', {
          state: { message: 'Password reset! Please log in with your new password.' },
        });
      } else {
        setErrors({ submit: data.error || 'Failed to reset password' });
      }
    } catch {
      setErrors({ submit: 'Network error. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  /* =========================== UI =========================== */
  return (
    <div
      className={tw(
        'min-h-screen bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center p-4',
      )}
    >
      <div
        className={tw(
          'w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden',
        )}
      >
        {/* banner */}
        <div className={tw('bg-gradient-to-r from-sky-100 to-teal-100 p-6')}>
          <h1 className={tw('text-4xl font-bold text-sky-400 text-center')}>
            AIDIY
          </h1>
        </div>

        <div className={tw('p-8 md:p-12')}>
          <div className={tw('grid md:grid-cols-2 gap-8 items-center')}>
            {/* -------- form column -------- */}
            <div>
              <Link
                to="/login"
                className={tw(
                  'inline-flex items-center text-purple-600 hover:underline mb-6 font-medium',
                )}
              >
                ← Back to login
              </Link>

              <h2 className={tw('text-3xl font-bold text-gray-800 mb-3')}>
                Forgot Password
              </h2>
              <p className={tw('text-gray-600 mb-8')}>
                Forgot your password? Don't worry—let us help you reset it.
              </p>

              <form
                onSubmit={step === 1 ? handleSendOTP : handleResetPassword}
              >
                <div className={tw('space-y-4')}>
                  {/* EMAIL (always visible) */}
                  <div>
                    <label
                      className={tw(
                        'block text-sm font-medium text-gray-700 mb-1',
                      )}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      disabled={step === 2}
                      className={tw(
                        'w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors',
                      )}
                    />
                    {errors.email && (
                      <p className={tw('text-red-500 text-xs mt-1')}>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* NEW + CONFIRM PASSWORD (step 2 only) */}
                  {step === 2 && (
                    <>
                      <div>
                        <label
                          className={tw(
                            'block text-sm font-medium text-gray-700 mb-1',
                          )}
                        >
                          New password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          placeholder="Enter new password"
                          className={tw(
                            'w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors',
                          )}
                        />
                        {errors.newPassword && (
                          <p
                            className={tw('text-red-500 text-xs mt-1')}
                          >
                            {errors.newPassword}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          className={tw(
                            'block text-sm font-medium text-gray-700 mb-1',
                          )}
                        >
                          Confirm password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm password"
                          className={tw(
                            'w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors',
                          )}
                        />
                        {errors.confirmPassword && (
                          <p
                            className={tw('text-red-500 text-xs mt-1')}
                          >
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* SUBMIT-LEVEL ERRORS */}
                {errors.submit && (
                  <p
                    className={tw(
                      'text-red-500 text-sm text-center mt-4',
                    )}
                  >
                    {errors.submit}
                  </p>
                )}

                {/* ACTION BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className={tw(
                    'w-full mt-6 py-3 bg-gradient-to-r from-teal-400 to-purple-400 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {loading
                    ? 'Processing…'
                    : step === 1
                    ? 'Send OTP'
                    : 'Reset my password'}
                </button>
              </form>
            </div>

            {/* -------- illustration column (optional) -------- */}
            <div className={tw('hidden md:flex items-center justify-center')}>
              {/* decorative illustration or animation can go here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
