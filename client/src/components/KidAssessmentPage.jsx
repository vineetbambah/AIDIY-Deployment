import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AIAvatar from './AIAvatar';
import BellIcon from './BellIcon';

const KidAssessmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { parent, child } = location.state || {};

  const handleStartFromScratch = async () => {
    // Mark assessment as complete
    try {
      await fetch('https://web-production-a435c.up.railway.app/api/users/complete-assessment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('app_token')}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to mark assessment complete:', error);
    }

    navigate('/parent-dashboard', { 
      state: { 
        parent,
        child,
        assessmentType: 'scratch' 
      } 
    });
  };

  const handleTakeAssessment = () => {
    navigate('/assessment-quiz', { 
      state: { 
        parent,
        child 
      } 
    });
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
        <h1 className="text-gray-400 text-xl mb-8">Get Started</h1>
        
        <div className="bg-gradient-to-b from-gray-100 to-white rounded-2xl shadow-xl p-12">
          {/* AI Avatar */}
          <div className="flex justify-center mb-8">
            <AIAvatar size="large" />
          </div>

          <h2 className="text-3xl font-bold text-center mb-4">Let's Get Started!</h2>
          
          <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
            To provide the best learning experience for your child, we need to understand their current skill level.
          </p>

          {/* Options */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Start from scratch */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white rounded-full"></div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-center mb-4">Start from scratch</h3>
              
              <p className="text-gray-600 text-center mb-6">
                Begin with beginner - level tasks and gradually progress through each skill area.
              </p>
              
              <ul className="text-sm text-gray-600 space-y-2 mb-8">
                <li>• Perfect for younger children</li>
                <li>• Build foundation skills step by step</li>
                <li>• Safe and structured learning path</li>
              </ul>
              
              <button
                onClick={handleStartFromScratch}
                className="w-full py-4 bg-gradient-to-r from-primary-turquoise to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Start from scratch
              </button>
            </div>

            {/* Take Assessment Quiz */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <div className="text-white text-4xl font-bold">📖</div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-center mb-4">Take Assessment Quiz</h3>
              
              <p className="text-gray-600 text-center mb-6">
                Answer questions about your child's current abilities to get personalized task recommendations
              </p>
              
              <ul className="text-sm text-gray-600 space-y-2 mb-8">
                <li>• Perfect for younger children</li>
                <li>• Build foundation skills step by step</li>
                <li>• Safe and structured learning path</li>
              </ul>
              
              <button
                onClick={handleTakeAssessment}
                className="w-full py-4 bg-white border-2 border-gray-300 text-gray-800 font-semibold rounded-xl hover:border-primary-turquoise hover:text-primary-turquoise transition-all duration-300"
              >
                Take Assessment Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidAssessmentPage; 