import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BellIcon from './BellIcon';
import { API_BASE_URL } from '../api';

const KidSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { parent } = location.state || {};
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [parentProfile, setParentProfile] = useState(null);
  const [children, setChildren] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('app_token');
        
        const profileResponse = await fetch(`${API_BASE_URL}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setParentProfile(profileData.user);
          setHasCompletedAssessment(profileData.user.hasCompletedAssessment || false);
        }

        const response = await fetch(`${API_BASE_URL}/api/users/children`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setChildren(data.children || []);
          setKids(data.children);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleKidSelect = (kid) => {
    // If user has completed assessment before, go directly to dashboard
    if (hasCompletedAssessment) {
      navigate('/parent-dashboard', { 
        state: { 
          parent,
          child: {
            id: kid.id,
            name: kid.nickName || kid.firstName,
            avatar: kid.avatar || '👧',
            age: kid.age || calculateAge(kid.birthDate)
          }
        } 
      });
    } else {
      // First time users go to assessment page
      navigate('/kid-assessment', { 
        state: { 
          parent,
          child: {
            id: kid.id,
            name: kid.nickName || kid.firstName,
            avatar: kid.avatar || '👧',
            age: kid.age || calculateAge(kid.birthDate)
          }
        } 
      });
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate.year, birthDate.month - 1, birthDate.day);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleAddKid = () => {
    navigate('/profile', { state: { openAddKid: true } });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-4xl font-bold text-white">AI</span>
            <span className="text-4xl font-bold text-accent-purple">DIY</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <BellIcon className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-xl">{parent?.avatar || '👩‍💼'}</span>
              </div>
              <span className="text-white font-medium">{parent?.name || 'Parent'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-gray-400 text-xl mb-8">Select a Child</h1>
        
        <div className="bg-gradient-to-b from-gray-100 to-white rounded-2xl shadow-xl p-12">
          <h2 className="text-3xl font-bold text-center mb-4">Which child would you like to assess?</h2>
          
          <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
            Choose a child profile to begin their personalized learning journey
          </p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-turquoise"></div>
            </div>
          ) : (
            <>
              {/* Kids Grid */}
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
                {kids.map((kid) => (
                  <button
                    key={kid.id}
                    onClick={() => handleKidSelect(kid)}
                    className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-primary-turquoise hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="w-24 h-24 bg-accent-pink rounded-full flex items-center justify-center">
                        <span className="text-5xl">{kid.avatar || '👧'}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-center mb-2">{kid.nickName || kid.firstName}</h3>
                    {calculateAge(kid.birthDate) && (
                      <p className="text-gray-600 text-center">Age {calculateAge(kid.birthDate)}</p>
                    )}
                  </button>
                ))}

                {/* Add New Kid Button */}
                <button
                  onClick={handleAddKid}
                  className="bg-white rounded-2xl shadow-lg p-8 border-2 border-dashed border-gray-300 hover:border-primary-turquoise hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-4xl text-gray-400">+</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-center mb-2 text-gray-600">Add New Child</h3>
                  <p className="text-gray-500 text-center">Create a profile</p>
                </button>
              </div>
            </>
          )}

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-primary-turquoise transition-colors inline-flex items-center gap-2"
            >
              <span>←</span> Back to Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidSelectionPage; 