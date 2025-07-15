import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AIAvatar from './AIAvatar';
import BellIcon from './BellIcon';

const AssessmentQuiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { parent, child } = location.state || {};
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState('');

  const questions = [
    {
      id: 1,
      category: "Money Smarts",
      icon: "💰",
      question: "Can your child count and recognize coins and bills?",
      options: [
        "Not at all",
        "Some coins only",
        "Most coins and small bills",
        "All coins and bills confidently"
      ]
    },
    {
      id: 2,
      category: "Money Smarts",
      icon: "💰",
      question: "How does your child handle saving money?",
      options: [
        "Spends immediately when given money",
        "Sometimes saves but often forgets",
        "Has a piggy bank and saves occasionally",
        "Regularly saves and understands saving goals"
      ]
    },
    {
      id: 3,
      category: "Money Smarts",
      icon: "💰",
      question: "Does your child understand the concept of earning money?",
      options: [
        "No understanding yet",
        "Knows parents work for money",
        "Understands work equals money",
        "Has done small tasks to earn money"
      ]
    },
    {
      id: 4,
      category: "Money Smarts",
      icon: "💰",
      question: "How well does your child manage wants vs needs?",
      options: [
        "Wants everything they see",
        "Starting to understand but struggles",
        "Can identify needs vs wants with help",
        "Makes good decisions independently"
      ]
    },
    {
      id: 5,
      category: "Money Smarts",
      icon: "💰",
      question: "Can your child make simple purchasing decisions?",
      options: [
        "No experience with purchases",
        "Picks items but doesn't consider price",
        "Compares prices with assistance",
        "Can budget and make smart choices"
      ]
    },
    {
      id: 6,
      category: "Money Smarts",
      icon: "💰",
      question: "How responsible is your child with money-related tasks?",
      options: [
        "Needs constant reminders",
        "Completes tasks with some reminders",
        "Usually responsible without reminders",
        "Very responsible and takes initiative"
      ]
    }
  ];

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleContinue = async () => {
    if (selectedAnswer) {
      setAnswers({ ...answers, [currentQuestion]: selectedAnswer });
      setSelectedAnswer('');
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Mark assessment as complete
        try {
          await fetch('https://aidiy-deployment-production.up.railway.app/api/users/complete-assessment', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('app_token')}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error('Failed to mark assessment complete:', error);
        }

        // Finish assessment
        navigate('/parent-dashboard', {
          state: {
            parent,
            child,
            assessmentResults: { ...answers, [currentQuestion]: selectedAnswer }
          }
        });
      }
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || '');
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-4xl font-bold text-white">AI</span>
            <span className="text-4xl font-bold text-accent-purple">DIY</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="relative">
              <BellIcon className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-xl">{parent?.avatar || '👩‍💼'}</span>
              </div>
              <span className="text-white font-medium">{parent?.name || 'Sarah'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8 relative">
        {/* AI Avatar positioned at top right with animation */}
        <div className="absolute -top-4 right-8 z-10">
          <div className="relative animate-bounce">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
              <AIAvatar size="medium" animated={true} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-purple-400 rounded-full animate-ping"></div>
          </div>
        </div>

        <div className="mb-8">
          {/* Back button and progress */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={currentQuestion === 0}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-turquoise to-green-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Card */}
        <div className="bg-gradient-to-b from-gray-100 to-white rounded-3xl shadow-xl p-8">
          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">{currentQ.icon}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{currentQ.category}</h3>
                <p className="text-sm text-gray-500">Question {currentQuestion + 1} of {questions.length}</p>
              </div>
            </div>

            {/* Question */}
            <h2 className="text-xl font-medium text-gray-800 mb-6">
              {currentQ.question}
            </h2>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={`p-4 text-left rounded-xl border-2 transition-all ${
                    selectedAnswer === option
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-sm text-gray-700">{option}</span>
                </button>
              ))}
            </div>

            {/* Continue/Finish Button */}
            <button
              onClick={handleContinue}
              disabled={!selectedAnswer}
              className={`w-full py-4 rounded-xl font-medium transition-all ${
                selectedAnswer
                  ? 'bg-gradient-to-r from-primary-turquoise to-blue-500 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentQuestion === questions.length - 1 ? 'Finish' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentQuiz; 