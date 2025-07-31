import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUser } from '../store/authSlice';
import { tw } from '@twind/core';
import { API_BASE_URL } from '../api';

const ParentSetupPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    birthDate: '',
    parentRole: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.parentRole) {
      setError('Please select if you are Dad or Mom');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://web-production-a435c.up.railway.app/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('app_token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Update Redux user state
        dispatch(updateUser({ isProfileComplete: true }));
        // Navigate to profile page
        navigate('/profile');
      } else {
        setError(data.error || 'Update failed, please try again');
      }
    } catch (err) {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={tw('min-h-screen bg-gradient-to-br from-primary-turquoise to-primary-turquoise-dark flex items-center justify-center p-4')}>
      <div className={tw('max-w-md w-full')}>
        <div className={tw('bg-white rounded-2xl shadow-xl p-8')}>
          <div className={tw('text-center mb-8')}>
            <h1 className={tw('text-3xl font-bold text-gray-800 mb-2')}>Welcome to AIDIY!</h1>
            <p className={tw('text-gray-600')}>Please complete your parent profile first</p>
          </div>

          <form onSubmit={handleSubmit} className={tw('space-y-6')}>
            <div>
              <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                I am a
              </label>
              <div className={tw('grid grid-cols-2 gap-4')}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, parentRole: 'dad' })}
                  className={tw(
                    `py-3 px-4 border-2 rounded-lg font-semibold transition-all ${
                      formData.parentRole === 'dad'
                        ? 'border-primary-turquoise bg-primary-turquoise text-white'
                        : 'border-gray-200 text-gray-700 hover:border-primary-turquoise'
                    }`
                  )}
                >
                  👨 Dad
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, parentRole: 'mom' })}
                  className={tw(
                    `py-3 px-4 border-2 rounded-lg font-semibold transition-all ${
                      formData.parentRole === 'mom'
                        ? 'border-primary-turquoise bg-primary-turquoise text-white'
                        : 'border-gray-200 text-gray-700 hover:border-primary-turquoise'
                    }`
                  )}
                >
                  👩 Mom
                </button>
              </div>
            </div>

            <div>
              <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                placeholder="Enter your first name"
                required
              />
            </div>

            <div>
              <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                placeholder="Enter your last name"
                required
              />
            </div>

            <div>
              <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                Date of Birth
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
              />
            </div>

            {error && (
              <div className={tw('text-red-600 text-sm text-center')}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={tw(
                'w-full py-3 px-4 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParentSetupPage; 