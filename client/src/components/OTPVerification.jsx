// src/pages/OTPVerification.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import { tw } from '@twind/core';
import { API_BASE_URL } from '../api';

const OTPVerification = () => {
  /* ---------------- router state ---------------- */
  const location           = useLocation();
  const navigate           = useNavigate();
  const dispatch           = useDispatch();
  const email              = location.state?.email || '';
  const isPasswordReset    = !!location.state?.isPasswordReset;

  /* ---------------- local state ----------------- */
  const [otp, setOtp]           = useState(Array(6).fill(''));
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [resendTimer, setTimer] = useState(60);

  /* refs so we can focus boxes programmatically */
  const inputsRef = useRef([]);

  /* redirect if opened directly */
  useEffect(() => {
    if (!email) navigate('/signup');
    else inputsRef.current[0]?.focus();
  }, [email, navigate]);

  /* simple countdown ▾ */
  useEffect(() => {
    if (resendTimer === 0) return;
    const t = setTimeout(() => setTimer(resendTimer - 1), 1_000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  /* -------------- helpers ----------------------- */
  const updateChar = (idx, value) => {
    if (!/^\d?$/.test(value)) return;                       // numbers only
    const next = [...otp];
    next[idx] = value;
    setOtp(next);

    if (value && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const keyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const allFilled = otp.every((c) => c);

  /* -------------- verify OTP -------------------- */
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!allFilled) return setError('Enter the 6-digit code');

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          email,
          otp     : otp.join(''),
          purpose : isPasswordReset ? 'reset' : 'verify',  // backend ignore ok
        }),
      });
      const data = await res.json();

      if (!res.ok) return setError(data.error || 'Invalid OTP');

      // success – route according to flow
      if (isPasswordReset) {
        navigate('/forgot-password', {
          state: { email, allowReset: true },
        });
      } else {
        // After successful verification, log the user in
        try {
          const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email, 
              password: location.state?.password || '' // Pass the password from signup
            }),
          });
          
          const loginData = await loginRes.json();
          
          if (loginData.success) {
            sessionStorage.setItem('app_token', loginData.appToken);
            dispatch(loginSuccess({ user: loginData.user, token: loginData.appToken }));
            
            // Check if profile is complete
            if (loginData.user.isProfileComplete === false) {
              navigate('/parent-setup');
            } else {
              navigate('/profile');
            }
          } else {
            // If auto-login fails, redirect to login page
            navigate('/login', {
              state: { message: 'Email verified successfully! Please log in.' },
            });
          }
        } catch (err) {
          // If auto-login fails, redirect to login page
          navigate('/login', {
            state: { message: 'Email verified successfully! Please log in.' },
          });
        }
      }
    } catch (_) {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  /* -------------- resend OTP -------------------- */
  const resend = async () => {
    if (resendTimer > 0) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setOtp(Array(6).fill(''));
      inputsRef.current[0]?.focus();
      setTimer(60);
    } catch {
      setError('Failed to resend code');
    }
  };

  /* =================== UI ======================= */
  return (
    <div className={tw('min-h-screen bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center p-4')}>
      <div className={tw('w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden')}>
        <div className={tw('bg-gradient-to-r from-sky-100 to-teal-100 p-6')}>
          <h1 className={tw('text-4xl font-bold text-sky-400 text-center')}>AIDIY</h1>
        </div>

        <div className={tw('p-8 md:p-12')}>
          <div className={tw('grid md:grid-cols-2 gap-8 items-center')}>
            {/* ------------- form column ------------- */}
            <div className={tw('max-w-md mx-auto w-full')}>
              <h2 className={tw('text-3xl font-bold text-gray-800 mb-3')}>Verify code</h2>
              <p className={tw('text-gray-600 mb-8')}>
                An authentication code has been sent to <b>{email}</b>.
              </p>

              <form onSubmit={handleVerify}>
                <div className={tw('flex justify-center gap-2 mb-6')}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputsRef.current[i] = el)}
                      id={`otp-${i}`}
                      maxLength="1"
                      value={digit}
                      onChange={(e) => updateChar(i, e.target.value)}
                      onKeyDown={(e) => keyDown(i, e)}
                      className={tw(
                        'w-12 h-14 text-center text-xl font-semibold border-2',
                        'border-gray-300 rounded-lg',
                        'focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200',
                        'transition-all duration-300'
                      )}
                    />
                  ))}
                </div>

                {error && <p className={tw('text-red-500 text-sm text-center mb-4')}>{error}</p>}

                <p className={tw('text-gray-600 text-center mb-6')}>
                  Didn't receive a code?{' '}
                  <button
                    type="button"
                    disabled={resendTimer > 0}
                    onClick={resend}
                    className={tw(
                      'ml-1 font-semibold',
                      resendTimer > 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-purple-600 hover:underline'
                    )}
                  >
                    {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend'}
                  </button>
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className={tw(
                    'w-full py-3 bg-gradient-to-r from-teal-400 to-purple-400',
                    'text-white font-semibold rounded-full shadow-lg',
                    'hover:shadow-xl transform hover:scale-105',
                    'transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {loading ? 'Verifying…' : 'Verify'}
                </button>
              </form>
            </div>

            {/* ------------- illustration column ------------- */}
            <div className={tw('hidden md:flex items-center justify-center')}>
              {/* decorative illustration or animation */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
