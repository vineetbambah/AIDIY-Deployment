import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tw } from '@twind/core';
import BellIcon from './BellIcon';
import { API_BASE_URL } from '../api';

const KidDashboard = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [goals, setGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    category: '',
    amount: '',
    duration: '',
    description: ''
  });
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const totalEarnings = 60.00;
  const totalSavings = 25.00;
  const investments = 35.00;
  const level = 3;
  const progress = 60;

  const activeGoals = [
    { id: 1, title: 'Save $100.00 for my bike', progress: 60, saved: 60, total: 100 },
    { id: 2, title: 'Save $150.00 for guitar', progress: 40, saved: 60, total: 150 }
  ];

  const choreCategories = [
    { id: 1, icon: '💰', title: 'Money Smarts', count: 5, description: 'Learn about saving, budgeting, and investing' },
    { id: 2, icon: '🏠', title: 'Home Hero', count: 3, description: 'Help around the house and learn new skills' },
    { id: 3, icon: '🍳', title: 'Kitchen Pro', count: 4, description: 'Learn to cook and help with meal prep' },
    { id: 4, icon: '🏃', title: 'Outdoor Champ', count: 2, description: 'Get active, sports, and outdoor activities' }
  ];

  const achievements = [
    { id: 1, icon: '🏆', title: 'Skills Mastered', level: 'Money Smarts', stars: 5 },
    { id: 2, icon: '🏠', title: 'Home Hero', level: '', stars: 4 },
    { id: 3, icon: '🔥', title: 'Kitchen Pro', level: '', stars: 3 },
    { id: 4, icon: '🏃', title: 'Outdoor Champ', level: '', stars: 5 }
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = sessionStorage.getItem('app_token');
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUserProfile(data.user);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    const fetchGoals = async () => {
      try {
        const token = sessionStorage.getItem('app_token');
        const response = await fetch(`${API_BASE_URL}/api/goals`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setGoals(data.goals);
          }
        }
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
    };

    fetchUserProfile();
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem('app_token');
      const response = await fetch(`${API_BASE_URL}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Goal created successfully:', data.goal);
        alert('Your goal has been sent to your parents for approval!');
        setShowGoalModal(false);
        // Reset form
        setGoalForm({
          title: '',
          category: '',
          amount: '',
          duration: '',
          description: ''
        });
      } else {
        console.error('Failed to create goal:', data.error);
        alert('Failed to create goal. Please try again.');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('app_token');
    navigate('/');
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: chatMessage,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem('app_token');
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: chatMessage,
          context: 'kid_dashboard'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, aiMessage]);
      } else {
        console.error('AI chat failed:', data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={tw('min-h-screen bg-gray-50')}>
      {/* Header */}
      <header className={tw('bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark p-4')}>
        <div className={tw('max-w-7xl mx-auto flex items-center justify-between')}>
          <div 
            className={tw('flex items-center space-x-2 cursor-pointer')}
            onClick={() => navigate('/')}
          >
            <span className={tw('text-3xl font-bold text-white')}>AI</span>
            <span className={tw('text-3xl font-bold text-accent-purple')}>DIY</span>
          </div>
          <div className={tw('flex items-center gap-3')}>
            <button 
              onClick={() => setShowChatModal(true)}
              className={tw('p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.418 16.97 20 12 20C10.5 20 9.1 19.6 7.9 18.9L3 20L4.3 16.1C3.4 14.8 3 13.5 3 12C3 7.582 7.03 4 12 4C16.97 4 21 7.582 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className={tw('p-2 rounded-full bg-white/20 hover:bg-white/30 text-white')}>
              <BellIcon size={24} />
            </button>
            <div className={tw('flex items-center gap-2 bg-white/20 rounded-full px-3 py-1')}>
              <div className={tw('w-8 h-8 rounded-full bg-accent-pink flex items-center justify-center')}>
                <span className={tw('text-lg')}>{userProfile?.avatar || '👧'}</span>
              </div>
              <span className={tw('text-white font-medium')}>{userProfile?.name || 'Maya'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className={tw('px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors')}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={tw('max-w-7xl mx-auto px-4 py-6')}>
        <h1 className={tw('text-2xl font-bold text-gray-800 mb-6')}>Kid dashboard</h1>

        {/* Welcome Card */}
        <div className={tw('bg-white rounded-2xl shadow-lg p-6 mb-6')}>
          <div className={tw('flex items-center justify-between mb-4')}>
            <div>
              <h2 className={tw('text-xl font-bold text-gray-800')}>Welcome, {userProfile?.name || 'Maya'}! 👋</h2>
              <p className={tw('text-gray-600')}>Ready for today's adventure? Let's start your progress!</p>
            </div>
            <div className={tw('text-center')}>
              <div className={tw('relative w-24 h-24')}>
                <svg className={tw('w-24 h-24 transform -rotate-90')}>
                  <circle cx="48" cy="48" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                  <circle cx="48" cy="48" r="36" stroke="#40e0d0" strokeWidth="8" fill="none"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                  />
                </svg>
                <div className={tw('absolute inset-0 flex flex-col items-center justify-center')}>
                  <span className={tw('text-sm text-gray-600')}>Level - {level}</span>
                  <span className={tw('text-xl font-bold')}>{progress}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className={tw('grid grid-cols-3 gap-4')}>
            <div className={tw('bg-orange-100 rounded-xl p-4 text-center')}>
              <div className={tw('flex items-center justify-center gap-2 mb-2')}>
                <span className={tw('text-2xl')}>💰</span>
                <span className={tw('text-sm text-gray-600')}>Total Earnings</span>
              </div>
              <p className={tw('text-2xl font-bold')}>${totalEarnings.toFixed(2)}</p>
            </div>
            <div className={tw('bg-green-100 rounded-xl p-4 text-center')}>
              <div className={tw('flex items-center justify-center gap-2 mb-2')}>
                <span className={tw('text-2xl')}>🏦</span>
                <span className={tw('text-sm text-gray-600')}>Savings</span>
              </div>
              <p className={tw('text-2xl font-bold')}>${totalSavings.toFixed(2)}</p>
            </div>
            <div className={tw('bg-blue-100 rounded-xl p-4 text-center')}>
              <div className={tw('flex items-center justify-center gap-2 mb-2')}>
                <span className={tw('text-2xl')}>📈</span>
                <span className={tw('text-sm text-gray-600')}>Investments</span>
              </div>
              <p className={tw('text-2xl font-bold')}>${investments.toFixed(2)}</p>
            </div>
          </div>

          {/* Level Progress */}
          <div className={tw('mt-4')}>
            <div className={tw('flex items-center justify-between mb-2')}>
              <span className={tw('text-sm text-gray-600')}>Level Progress</span>
              <span className={tw('text-sm text-gray-600')}>Learn 100 XP</span>
            </div>
            <div className={tw('w-full bg-gray-200 rounded-full h-3')}>
              <div className={tw('bg-gradient-to-r from-primary-turquoise to-accent-purple h-3 rounded-full')} 
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Create New Goal */}
        <div className={tw('bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl p-6 mb-6 text-white')}>
          <h2 className={tw('text-2xl font-bold mb-2')}>Create new goal</h2>
          <p className={tw('mb-4')}>& Get Approval from parents</p>
          <button 
            onClick={() => setShowGoalModal(true)}
            className={tw('w-12 h-12 bg-white/30 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 12L19 12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <path d="M12 5L19 12L12 19" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Active Goals */}
        <div className={tw('mb-6')}>
          <h3 className={tw('text-lg font-bold text-gray-800 mb-4')}>Active Goals</h3>
          <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-4')}>
            {activeGoals.map(goal => (
              <div key={goal.id} className={tw('bg-white rounded-xl p-4 shadow')}>
                <div className={tw('flex items-center justify-between mb-2')}>
                  <span className={tw('text-sm font-medium')}>{goal.title}</span>
                  <span className={tw('text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full')}>Saved!</span>
                </div>
                <div className={tw('text-sm text-gray-600 mb-2')}>
                  Save ${goal.saved.toFixed(2)} for my bike
                </div>
                <div className={tw('flex items-center gap-2 text-xs text-gray-500 mb-3')}>
                  <span>📅 Due in 10 Weeks</span>
                  <span>💰 Saved: ${goal.saved}</span>
                </div>
                <div className={tw('mb-2')}>
                  <div className={tw('flex justify-between text-xs text-gray-600 mb-1')}>
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className={tw('w-full bg-gray-200 rounded-full h-2')}>
                    <div className={tw('bg-gradient-to-r from-primary-turquoise to-accent-purple h-2 rounded-full')} 
                      style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
                <button className={tw('w-full py-2 bg-primary-turquoise text-white rounded-lg text-sm font-medium hover:bg-primary-turquoise-dark transition-colors')}>
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Chore Categories */}
        <div className={tw('mb-6')}>
          <h3 className={tw('text-lg font-bold text-gray-800 mb-4')}>Chore categories</h3>
          <div className={tw('grid grid-cols-2 md:grid-cols-4 gap-4')}>
            {choreCategories.map(category => (
              <div key={category.id} className={tw('bg-white rounded-xl p-4 shadow hover:shadow-lg transition-shadow cursor-pointer')}>
                <div className={tw('text-3xl mb-2')}>{category.icon}</div>
                <h4 className={tw('font-semibold text-gray-800 mb-1')}>{category.title}</h4>
                <p className={tw('text-xs text-gray-600 mb-2')}>{category.description}</p>
                <span className={tw('text-2xl font-bold text-primary-turquoise')}>{category.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Gallery */}
        <div className={tw('bg-white rounded-2xl shadow-lg p-6')}>
          <h3 className={tw('text-lg font-bold text-gray-800 mb-4')}>Achievement Gallery</h3>
          <div className={tw('space-y-3')}>
            {achievements.map(achievement => (
              <div key={achievement.id} className={tw('flex items-center justify-between p-3 bg-gray-50 rounded-lg')}>
                <div className={tw('flex items-center gap-3')}>
                  <div className={tw('w-12 h-12 bg-gradient-to-r from-primary-turquoise to-accent-purple rounded-full flex items-center justify-center text-2xl')}>
                    {achievement.icon}
                  </div>
                  <div>
                    <h4 className={tw('font-semibold text-gray-800')}>{achievement.title}</h4>
                    {achievement.level && <p className={tw('text-xs text-gray-600')}>{achievement.level}</p>}
                  </div>
                </div>
                <div className={tw('flex gap-1')}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={tw(i < achievement.stars ? 'text-yellow-400' : 'text-gray-300')}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Streak */}
        <div className={tw('mt-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white text-center')}>
          <h3 className={tw('text-2xl font-bold mb-2')}>Current Streak</h3>
          <p className={tw('text-5xl font-bold mb-2')}>5 Days</p>
          <p className={tw('text-lg')}>🔥 Keep it up!</p>
          <p className={tw('text-sm opacity-90')}>Keep it up! You're maintaining 5 days streak!</p>
        </div>
      </div>

      {/* Goal Creation Modal */}
      {showGoalModal && (
        <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
          <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-md')}>
            <div className={tw('bg-gradient-to-r from-purple-400 to-pink-400 p-6 rounded-t-2xl text-white text-center')}>
              <h3 className={tw('text-2xl font-bold mb-2')}>CREATE A GOAL!</h3>
              <p className={tw('text-sm opacity-90')}>What Amazing Thing Do You Want To Save For?</p>
            </div>

            <form onSubmit={handleCreateGoal} className={tw('p-6')}>
              <div className={tw('mb-4')}>
                <label className={tw('flex items-center gap-2 text-gray-700 font-medium mb-2')}>
                  <span className={tw('text-xl')}>🎯</span> My Dream Goal?
                </label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="Type Your Dream Here"
                  className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400')}
                  required
                />
              </div>

              <div className={tw('grid grid-cols-3 gap-3 mb-4')}>
                <button
                  type="button"
                  onClick={() => setGoalForm({ ...goalForm, category: 'bike' })}
                  className={tw(`p-3 rounded-lg border-2 ${goalForm.category === 'bike' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`)}
                >
                  <span className={tw('text-2xl')}>🚲</span>
                  <p className={tw('text-xs mt-1')}>New bike</p>
                </button>
                <button
                  type="button"
                  onClick={() => setGoalForm({ ...goalForm, category: 'game' })}
                  className={tw(`p-3 rounded-lg border-2 ${goalForm.category === 'game' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`)}
                >
                  <span className={tw('text-2xl')}>🎮</span>
                  <p className={tw('text-xs mt-1')}>Video Game</p>
                </button>
                <button
                  type="button"
                  onClick={() => setGoalForm({ ...goalForm, category: 'soccer' })}
                  className={tw(`p-3 rounded-lg border-2 ${goalForm.category === 'soccer' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`)}
                >
                  <span className={tw('text-2xl')}>⚽</span>
                  <p className={tw('text-xs mt-1')}>Soccer Ball</p>
                </button>
              </div>

              <div className={tw('grid grid-cols-3 gap-3 mb-4')}>
                <button
                  type="button"
                  onClick={() => setGoalForm({ ...goalForm, category: 'art' })}
                  className={tw(`p-3 rounded-lg border-2 ${goalForm.category === 'art' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`)}
                >
                  <span className={tw('text-2xl')}>🎨</span>
                  <p className={tw('text-xs mt-1')}>Art Supplies</p>
                </button>
                <button
                  type="button"
                  onClick={() => setGoalForm({ ...goalForm, category: 'book' })}
                  className={tw(`p-3 rounded-lg border-2 ${goalForm.category === 'book' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`)}
                >
                  <span className={tw('text-2xl')}>📚</span>
                  <p className={tw('text-xs mt-1')}>Book Collection</p>
                </button>
                <button
                  type="button"
                  onClick={() => setGoalForm({ ...goalForm, category: 'toy' })}
                  className={tw(`p-3 rounded-lg border-2 ${goalForm.category === 'toy' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`)}
                >
                  <span className={tw('text-2xl')}>🧸</span>
                  <p className={tw('text-xs mt-1')}>Toy</p>
                </button>
              </div>

              <div className={tw('mb-4')}>
                <label className={tw('block text-gray-700 font-medium mb-2')}>
                  Describe your motivation
                </label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  placeholder="Why do you want this?"
                  className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400')}
                  rows="3"
                />
              </div>

              <div className={tw('mb-4')}>
                <label className={tw('flex items-center gap-2 text-gray-700 font-medium mb-2')}>
                  <span className={tw('text-xl')}>💰</span> How Much Money?
                </label>
                <div className={tw('relative')}>
                  <span className={tw('absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500')}>$</span>
                  <input
                    type="number"
                    value={goalForm.amount}
                    onChange={(e) => setGoalForm({ ...goalForm, amount: e.target.value })}
                    placeholder="00"
                    className={tw('w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400')}
                    required
                  />
                </div>
              </div>

              <div className={tw('mb-6')}>
                <label className={tw('flex items-center gap-2 text-gray-700 font-medium mb-2')}>
                  <span className={tw('text-xl')}>👤</span> Get Approval From
                </label>
                <input
                  type="text"
                  placeholder="Choose Parent"
                  className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400')}
                />
              </div>

              <div className={tw('mb-6')}>
                <label className={tw('flex items-center gap-2 text-gray-700 font-medium mb-2')}>
                  <span className={tw('text-xl')}>📅</span> How Many Weeks?
                </label>
                <select
                  value={goalForm.duration}
                  onChange={(e) => setGoalForm({ ...goalForm, duration: e.target.value })}
                  className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 appearance-none bg-white')}
                  required
                >
                  <option value="">Pick your timeline!</option>
                  <option value="5">🏃 5 weeks ( Super fast )</option>
                  <option value="10">🚶 10 weeks ( Steady pace )</option>
                  <option value="15">🐢 15 weeks ( Take your time )</option>
                  <option value="20">🐌 20 weeks ( Slow and steady )</option>
                </select>
              </div>

              <div className={tw('flex gap-4')}>
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className={tw('flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 transition-colors')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={tw('flex-1 px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all')}
                >
                  Get Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {showChatModal && (
        <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
          <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col')}>
            <div className={tw('bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark p-4 rounded-t-2xl flex items-center justify-between text-white')}>
              <h3 className={tw('text-xl font-bold')}>AI Assistant</h3>
              <button
                onClick={() => setShowChatModal(false)}
                className={tw('text-2xl hover:opacity-80')}
              >
                ✕
              </button>
            </div>

            <div className={tw('flex-1 overflow-y-auto p-4 space-y-4')}>
              {chatHistory.length === 0 && (
                <div className={tw('text-center text-gray-500 mt-8')}>
                  <p className={tw('text-lg mb-2')}>Hi! I'm your AI assistant 🤖</p>
                  <p className={tw('text-sm')}>Ask me anything about saving money, chores, or your goals!</p>
                </div>
              )}
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={tw(`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`)}
                >
                  <div
                    className={tw(`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-primary-turquoise to-accent-purple text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`)}
                  >
                    <p className={tw('text-sm')}>{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className={tw('flex justify-start')}>
                  <div className={tw('bg-gray-100 p-3 rounded-2xl')}>
                    <div className={tw('flex space-x-2')}>
                      <div className={tw('w-2 h-2 bg-gray-400 rounded-full animate-bounce')}></div>
                      <div className={tw('w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100')}></div>
                      <div className={tw('w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200')}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={tw('p-4 border-t')}>
              <div className={tw('flex gap-2')}>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask me anything..."
                  className={tw('flex-1 px-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary-turquoise')}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !chatMessage.trim()}
                  className={tw(`px-6 py-2 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-full hover:shadow-lg transform hover:-translate-y-0.5 transition-all ${
                    (isLoading || !chatMessage.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                  }`)}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidDashboard;
