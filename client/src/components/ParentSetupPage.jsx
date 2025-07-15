import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUser } from '../store/authSlice';
import { tw } from '@twind/core';

const ParentSetupPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - Personal Information
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    avatar: '👩',
    
    // Step 2 - Family & Money Goals
    numberOfChildren: '',
    childrenAges: '',
    moneyLearningGoals: {
      teachingSavingHabits: false,
      learnToBudget: false,
      smartSpendingDecisions: false,
      understandingMoneyValue: false,
      earningThroughChores: false,
      bankingBasics: false
    },
    weeklyAllowance: '',
    learningFocus: {
      coinsAndBills: false,
      savingVsSpending: false,
      needsVsWants: false
    },
    choreCategories: {
      householdCleaning: false,
      petCare: false,
      kitchenHelp: false,
      gardenWork: false,
      organizingRooms: false,
      laundryHelp: false
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const avatarOptions = ['👩', '👨', '👩‍💼', '👨‍💼', '👩‍🏫', '👨‍🏫', '👩‍⚕️', '👨‍⚕️'];

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError('Please fill in all required fields');
        return;
      }
    }
    setError('');
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://aidiy-deployment-production.up.railway.app/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('app_token')}`
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.location, // Using location as phone for now
          avatar: formData.avatar
        })
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

  const handleCheckboxChange = (category, item) => {
    setFormData({
      ...formData,
      [category]: {
        ...formData[category],
        [item]: !formData[category][item]
      }
    });
  };

  return (
    <div className={tw('min-h-screen bg-gray-50')}>
      {/* Header */}
      <header className={tw('bg-white shadow-sm')}>
        <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
          <div className={tw('flex items-center justify-between h-20')}>
            <div className={tw('flex items-center space-x-2')}>
              <span className={tw('text-3xl font-bold text-primary-turquoise')}>AI</span>
              <span className={tw('text-3xl font-bold text-accent-purple')}>DIY</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className={tw('max-w-3xl mx-auto px-4 pt-8')}>
        <div className={tw('relative')}>
          <div className={tw('absolute top-5 left-0 right-0 h-1 bg-gray-200')}>
            <div 
              className={tw('h-full bg-gradient-to-r from-primary-turquoise to-accent-purple transition-all duration-300')}
              style={{ width: `${(currentStep / 2) * 100}%` }}
            />
          </div>
          <div className={tw('relative flex justify-between')}>
            <div className={tw(`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              currentStep >= 1 ? 'bg-gradient-to-r from-primary-turquoise to-accent-purple' : 'bg-gray-300'
            }`)}>
              1
            </div>
            <div className={tw(`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              currentStep >= 2 ? 'bg-gradient-to-r from-primary-turquoise to-accent-purple' : 'bg-gray-300'
            }`)}>
              2
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className={tw('max-w-3xl mx-auto px-4 py-8')}>
        <div className={tw('bg-white rounded-2xl shadow-xl p-8')}>
          {currentStep === 1 && (
            <>
              <h2 className={tw('text-2xl font-bold text-center mb-2')}>Personal Information</h2>
              <p className={tw('text-gray-600 text-center mb-8')}>Tell us about yourself</p>

              {/* Welcome Message */}
              <div className={tw('bg-primary-turquoise/10 rounded-xl p-6 mb-8')}>
                <p className={tw('text-gray-700')}>
                  Welcome to AIDIY!<br />
                  Lets set up your profile to help children learn about money through fun chores and education activities!
                </p>
              </div>

              {/* Avatar Selection */}
              {/* <div className={tw('flex justify-center mb-8')}>
                <div className={tw('relative')}>
                  <div className={tw('w-32 h-32 rounded-full bg-gradient-to-r from-primary-turquoise to-accent-purple p-1')}>
                    <div className={tw('w-full h-full rounded-full bg-white flex items-center justify-center')}>
                      <span className={tw('text-6xl')}>{formData.avatar}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = avatarOptions.indexOf(formData.avatar);
                      const nextIndex = (currentIndex + 1) % avatarOptions.length;
                      setFormData({ ...formData, avatar: avatarOptions[nextIndex] });
                    }}
                    className={tw('absolute bottom-0 right-0 w-10 h-10 bg-accent-purple rounded-full flex items-center justify-center text-white hover:bg-accent-purple-dark transition-colors')}
                  >
                    📷
                  </button>
                </div>
              </div> */}

              {/* Form Fields */}
              <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-6')}>
                <div>
                  <label className={tw('flex items-center gap-2 text-gray-700 font-medium mb-2')}>
                    <span>👤</span> First Name*
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                    className={tw('w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                    required
                  />
                </div>

                <div>
                  <label className={tw('flex items-center gap-2 text-gray-700 font-medium mb-2')}>
                    Last Name*
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                    className={tw('w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                    required
                  />
                </div>

                <div>
                  <label className={tw('flex items-center gap-2 text-gray-700 font-medium mb-2')}>
                    <span>✉️</span> Email Address*
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    className={tw('w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                    required
                  />
                </div>

                <div>
                  <label className={tw('flex items-center gap-2 text-gray-700 font-medium mb-2')}>
                    <span>📍</span> Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter your location"
                    className={tw('w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                  />
                </div>
              </div>

              {error && (
                <div className={tw('mt-4 text-red-600 text-sm text-center')}>
                  {error}
                </div>
              )}

              <div className={tw('mt-8 flex justify-end')}>
                <button
                  onClick={handleNext}
                  className={tw('px-8 py-3 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all')}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className={tw('text-2xl font-bold text-center mb-2')}>Family & Money Goals</h2>
              <p className={tw('text-gray-600 text-center mb-8')}>Help us understand your family's money learning goals</p>

              {/* AIDIY Logo */}
              <div className={tw('flex justify-center mb-6')}>
                <div className={tw('w-24 h-24 rounded-full bg-gradient-to-r from-primary-turquoise to-accent-purple flex items-center justify-center')}>
                  <span className={tw('text-4xl')}>🎯</span>
                </div>
              </div>
              <p className={tw('text-center text-lg font-semibold mb-8')}>
                AIDIY<br />
                Making kids money smart
              </p>

              {/* Your Children */}
              {/* <div className={tw('bg-blue-50 rounded-xl p-6 mb-6')}>
                <h3 className={tw('flex items-center gap-2 text-lg font-semibold mb-4')}>
                  <span>👶</span> Your Children
                </h3>
                <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-4')}>
                  <div>
                    <label className={tw('block text-sm text-gray-700 mb-2')}>
                      Number of Children*
                    </label>
                    <select
                      name="numberOfChildren"
                      value={formData.numberOfChildren}
                      onChange={handleChange}
                      className={tw('w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                    >
                      <option value="">Select number</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4+">4+</option>
                    </select>
                  </div>
                  <div>
                    <label className={tw('block text-sm text-gray-700 mb-2')}>
                      Children's Ages
                    </label>
                    <input
                      type="text"
                      name="childrenAges"
                      value={formData.childrenAges}
                      onChange={handleChange}
                      placeholder="e.g. 5, 8, 12"
                      className={tw('w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                    />
                  </div>
                </div>
              </div> */}

              {/* Money Learning Goals */}
              {/* <div className={tw('bg-green-50 rounded-xl p-6 mb-6')}>
                <h3 className={tw('flex items-center gap-2 text-lg font-semibold mb-4')}>
                  <span>🎯</span> Money Learning Goals
                </h3>
                <p className={tw('text-sm text-gray-600 mb-4')}>What money skills do you want your children to learn?</p>
                <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-3')}>
                  {Object.entries({
                    teachingSavingHabits: 'Teaching Saving Habits',
                    learnToBudget: 'Learn to Budget',
                    smartSpendingDecisions: 'Smart Spending Decisions',
                    understandingMoneyValue: 'Understanding Money Value',
                    earningThroughChores: 'Earning Through Chores',
                    bankingBasics: 'Banking Basics'
                  }).map(([key, label]) => (
                    <label key={key} className={tw('flex items-center gap-2 cursor-pointer')}>
                      <input
                        type="checkbox"
                        checked={formData.moneyLearningGoals[key]}
                        onChange={() => handleCheckboxChange('moneyLearningGoals', key)}
                        className={tw('w-5 h-5 text-primary-turquoise rounded focus:ring-primary-turquoise')}
                      />
                      <span className={tw('text-gray-700')}>{label}</span>
                    </label>
                  ))}
                </div>
              </div> */}

              {/* Weekly Allowance & Learning Focus */}
              {/* <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-6 mb-6')}>
                <div className={tw('bg-yellow-50 rounded-xl p-6')}>
                  <h3 className={tw('flex items-center gap-2 text-lg font-semibold mb-4')}>
                    <span>💰</span> Weekly Allowance
                  </h3>
                  <label className={tw('block text-sm text-gray-700 mb-2')}>
                    Amount per child (optional)
                  </label>
                  <div className={tw('relative')}>
                    <span className={tw('absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500')}>$</span>
                    <input
                      type="number"
                      name="weeklyAllowance"
                      value={formData.weeklyAllowance}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={tw('w-full pl-8 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                    />
                  </div>
                </div>

                <div className={tw('bg-purple-50 rounded-xl p-6')}>
                  <h3 className={tw('flex items-center gap-2 text-lg font-semibold mb-4')}>
                    <span>🎯</span> Learning Focus
                  </h3>
                  <div className={tw('space-y-2')}>
                    {Object.entries({
                      coinsAndBills: 'Coins & Bills Recognition',
                      savingVsSpending: 'Saving vs Spending',
                      needsVsWants: 'Needs vs Wants'
                    }).map(([key, label]) => (
                      <label key={key} className={tw('flex items-center gap-2 cursor-pointer')}>
                        <input
                          type="checkbox"
                          checked={formData.learningFocus[key]}
                          onChange={() => handleCheckboxChange('learningFocus', key)}
                          className={tw('w-5 h-5 text-primary-turquoise rounded focus:ring-primary-turquoise')}
                        />
                        <span className={tw('text-gray-700 text-sm')}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div> */}

              {/* Chore Categories */}
              <div className={tw('bg-blue-50 rounded-xl p-6 mb-8')}>
                <h3 className={tw('flex items-center gap-2 text-lg font-semibold mb-4')}>
                  <span>📋</span> Chore Categories
                </h3>
                <p className={tw('text-sm text-gray-600 mb-4')}>What type of chores would you like to suggest?</p>
                <div className={tw('grid grid-cols-2 md:grid-cols-3 gap-3')}>
                  {Object.entries({
                    householdCleaning: 'Household Cleaning',
                    petCare: 'Pet Care',
                    kitchenHelp: 'Kitchen Help',
                    gardenWork: 'Garden Work',
                    organizingRooms: 'Organizing Rooms',
                    laundryHelp: 'Laundry Help'
                  }).map(([key, label]) => (
                    <label key={key} className={tw('flex items-center gap-2 cursor-pointer')}>
                      <input
                        type="checkbox"
                        checked={formData.choreCategories[key]}
                        onChange={() => handleCheckboxChange('choreCategories', key)}
                        className={tw('w-5 h-5 text-primary-turquoise rounded focus:ring-primary-turquoise')}
                      />
                      <span className={tw('text-gray-700 text-sm')}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className={tw('text-red-600 text-sm text-center mb-4')}>
                  {error}
                </div>
              )}

              <div className={tw('flex justify-between')}>
                <button
                  onClick={handlePrevious}
                  className={tw('px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-primary-turquoise hover:text-primary-turquoise transition-colors')}
                >
                  ← Previous
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={tw('px-8 py-3 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed')}
                >
                  {loading ? 'Starting...' : 'Start AIDIY Journey'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentSetupPage; 