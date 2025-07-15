import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tw } from '@twind/core';
import AIAvatar from './AIAvatar';
import BellIcon from './BellIcon';
import { API_BASE_URL } from '../api';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showCreateChore, setShowCreateChore] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [userProfile, setUserProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    avatar: ''
  });
  const [selectedChild, setSelectedChild] = useState(null);
  const [showEditChildModal, setShowEditChildModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chores] = useState([
    {
      id: 1,
      title: 'Learn to make pancakes',
      description: 'Follow the recipe and make pancakes for family breakfast',
      assignedTo: 'Maya',
      dueDate: 'May 24, 2025',
      reward: 8.00,
      difficulty: 'Hard',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Help with dishes',
      description: 'Load dishwasher and wipe down counters',
      assignedTo: 'Maya',
      dueDate: 'May 24, 2025',
      reward: 5.00,
      difficulty: 'Medium',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Clean bedroom',
      description: 'Make bed, organize toys, and put clothes away',
      assignedTo: 'Alex',
      dueDate: 'May 24, 2025',
      reward: 2.00,
      difficulty: 'Easy',
      status: 'completed'
    },
    {
      id: 4,
      title: 'Take out trash',
      description: 'Make bed, organize toys, and put clothes away',
      assignedTo: 'Maya',
      dueDate: 'May 24, 2025',
      reward: 2.00,
      difficulty: 'Easy',
      status: 'completed'
    }
  ]);

  const [choreForm, setChoreForm] = useState({
    title: '',
    description: '',
    assignTo: '',
    reward: '',
    dueDate: '',
    difficulty: 'Easy'
  });

  useEffect(() => {
    // Fetch user profile and children
    fetchUserData();
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('app_token');
      
      // Fetch user profile
      const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      if (profileData.success) {
        setUserProfile(profileData.user);
        setProfileForm({
          firstName: profileData.user.firstName || '',
          lastName: profileData.user.lastName || '',
          email: profileData.user.email || '',
          phoneNumber: profileData.user.phoneNumber || '',
          avatar: profileData.user.avatar || '👩‍💼'
        });
      }

      // Fetch children
      const childrenRes = await fetch('https://aidiy-deployment-production.up.railway.app/api/users/children', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const childrenData = await childrenRes.json();
      if (childrenData.success) {
        setChildren(childrenData.children);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = sessionStorage.getItem('app_token');
      const response = await fetch('https://aidiy-deployment-production.up.railway.app/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleApproveGoal = async (goalId) => {
    try {
      const token = sessionStorage.getItem('app_token');
      const response = await fetch(`https://aidiy-deployment-production.up.railway.app/api/goals/${goalId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('Goal approved successfully!');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to approve goal:', error);
    }
  };

  const handleDeclineGoal = async (goalId) => {
    try {
      const token = sessionStorage.getItem('app_token');
      const response = await fetch(`https://aidiy-deployment-production.up.railway.app/api/goals/${goalId}/decline`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('Goal declined.');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to decline goal:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem('app_token');
      await fetch('https://aidiy-deployment-production.up.railway.app/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      sessionStorage.removeItem('app_token');
      navigate('/login');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('app_token');
      const response = await fetch('https://aidiy-deployment-production.up.railway.app/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });

      const data = await response.json();
      if (data.success) {
        setUserProfile({ ...userProfile, ...profileForm });
        setShowProfileModal(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert('Failed to update profile');
    }
  };

  const avatarOptions = ['👨‍💼', '👩‍💼', '👨‍🏫', '👩‍🏫', '👨‍⚕️', '👩‍⚕️', '👨‍🔧', '👩‍🔧'];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select an image smaller than 5MB');
    }
  };

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check for supported MIME types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await sendAudioToServer(audioBlob);
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Recording error occurred. Please try again.');
        setIsRecording(false);
      };

      // Start recording with timeslice to get data periodically
      mediaRecorder.start(1000);
      setIsRecording(true);
      console.log('Recording started with MIME type:', mimeType);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Unable to access microphone. Error: ' + error.message);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    // Determine file extension based on MIME type
    const mimeType = audioBlob.type;
    let extension = 'webm';
    if (mimeType.includes('mp4')) {
      extension = 'mp4';
    } else if (mimeType.includes('wav')) {
      extension = 'wav';
    }
    
    const formData = new FormData();
    formData.append('audio', audioBlob, `recording.${extension}`);

    try {
      const token = sessionStorage.getItem('app_token');
      console.log('Sending audio to server, size:', audioBlob.size, 'type:', audioBlob.type);
      
      const response = await fetch('https://aidiy-deployment-production.up.railway.app/api/ai/speech-to-text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setMessage(data.text);
        console.log('Speech to text successful:', data.text);
      } else {
        console.error('Speech to text failed:', data.error);
        alert('Failed to convert speech to text. Please try again.');
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      alert('Failed to send audio to server. Please try again.');
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedImage) return;

    const userMessage = {
      role: 'user',
      content: message,
      image: selectedImage,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem('app_token');
      const requestBody = {
        message: message
      };

      if (selectedImage) {
        // Extract base64 data from data URL
        requestBody.image = selectedImage.split(',')[1];
      }

      const response = await fetch('https://aidiy-deployment-production.up.railway.app/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
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
        alert('Failed to get AI response. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  const handleCreateChore = (e) => {
    e.preventDefault();
    // TODO: Create chore via API
    console.log('Creating chore:', choreForm);
    setShowCreateChore(false);
    setChoreForm({
      title: '',
      description: '',
      assignTo: '',
      reward: '',
      dueDate: '',
      difficulty: 'Easy'
    });
  };

  const getChoreStats = () => {
    const completed = chores.filter(c => c.status === 'completed').length;
    const pending = chores.filter(c => c.status === 'pending').length;
    const totalRewards = chores.reduce((sum, chore) => sum + chore.reward, 0);
    return { completed, pending, totalRewards };
  };

  const stats = getChoreStats();

  return (
    <div className={tw('min-h-screen bg-gradient-to-br from-purple-50 to-blue-50')}>
      {/* Header */}
      <header className={tw('bg-white shadow-sm')}>
        <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
          <div className={tw('flex items-center justify-between h-20')}>
            <div className={tw('flex items-center space-x-2')}>
              <span className={tw('text-3xl font-bold text-primary-turquoise')}>AiDIY</span>
              {/* <span className={tw('text-3xl font-bold text-accent-purple')}>DIY</span> */}
            </div>
            <div className={tw('flex items-center gap-4')}>
              <button 
                onClick={() => setShowNotifications(true)}
                className={tw('p-2 rounded-full hover:bg-gray-100 text-gray-600 relative')}
              >
                <BellIcon size={24} />
                {unreadCount > 0 && (
                  <span className={tw('absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center')}>
                    {unreadCount}
                  </span>
                )}
              </button>
              <div className="user-menu-container relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={tw('flex items-center gap-2 hover:bg-gray-100 rounded-lg p-2 transition-colors')}
                >
                  <div className={tw('w-10 h-10 rounded-full bg-accent-pink flex items-center justify-center')}>
                    <span className={tw('text-xl')}>{userProfile?.avatar || '👩‍💼'}</span>
                  </div>
                  <span className={tw('font-medium')}>{userProfile?.firstName || 'Parent'}</span>
                  <svg className={tw('w-4 h-4 text-gray-600')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className={tw('absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50')}>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowProfileModal(true);
                      }}
                      className={tw('w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3')}
                    >
                      <svg className={tw('w-5 h-5 text-gray-600')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowFamilyModal(true);
                      }}
                      className={tw('w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3')}
                    >
                      <svg className={tw('w-5 h-5 text-gray-600')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Manage Family
                    </button>
                    <hr className={tw('my-2 border-gray-200')} />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className={tw('w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-red-600')}
                    >
                      <svg className={tw('w-5 h-5')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8')}>
        <h1 className={tw('text-2xl font-bold text-gray-800 mb-6')}>Parent Dashboard</h1>

        <div className={tw('bg-white rounded-3xl shadow-xl p-8')}>
          {/* AI Avatar */}
          <div className={tw('flex justify-center mb-6')}>
            <AIAvatar size="medium" animated={true} />
          </div>

          {/* AI Chat Section */}
          <div className={tw('mb-8')}>
            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div className={tw('mb-4 max-h-96 overflow-y-auto space-y-4')}>
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={tw(`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`)}
                  >
                    <div
                      className={tw(`max-w-3xl p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-primary-turquoise to-accent-purple text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`)}
                    >
                      {msg.image && (
                        <img src={msg.image} alt="User upload" className={tw('mb-2 rounded-lg max-h-40')} />
                      )}
                      <p className={tw('whitespace-pre-wrap')}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className={tw('flex justify-start')}>
                    <div className={tw('bg-gray-100 p-4 rounded-2xl')}>
                      <div className={tw('flex space-x-2')}>
                        <div className={tw('w-2 h-2 bg-gray-400 rounded-full animate-bounce')}></div>
                        <div className={tw('w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100')}></div>
                        <div className={tw('w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200')}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Chat Input */}
            <div className={tw('relative bg-gray-50 rounded-2xl p-4 border-2 border-gray-200')}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Guide me AiDIY..."
                className={tw('w-full bg-transparent resize-none outline-none text-gray-700 placeholder-gray-400 min-h-[60px]')}
                rows="2"
                disabled={isLoading}
              />
              
              {selectedImage && (
                <div className={tw('mt-2 relative inline-block')}>
                  <img src={selectedImage} alt="Upload" className={tw('h-20 rounded-lg')} />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className={tw('absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs')}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className={tw('flex items-center justify-between mt-2')}>
                <div className={tw('flex items-center gap-2')}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={tw('p-2 rounded-full hover:bg-gray-200 text-gray-600')}
                    disabled={isLoading}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2L10 10M10 10L10 18M10 10L18 10M10 10L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={tw('hidden')}
                  />
                  <button
                    onClick={handleVoiceRecord}
                    className={tw(`p-2 rounded-full hover:bg-gray-200 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-600'}`)}
                    disabled={isLoading}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="7" y="4" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="2"/>
                      <path d="M4 10C4 10 4 14 10 14C16 14 16 10 16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M10 14V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  {isRecording && (
                    <span className={tw('text-sm text-red-500')}>Recording...</span>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || (!message.trim() && !selectedImage)}
                  className={tw(`px-6 py-2 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all ${
                    (isLoading || (!message.trim() && !selectedImage)) ? 'opacity-50 cursor-not-allowed' : ''
                  }`)}
                >
                  {isLoading ? 'Sending...' : 'Guide me'}
                </button>
              </div>
            </div>
          </div>

          {/* Children Performance */}
          <div className={tw('mb-8')}>
            <h2 className={tw('text-xl font-bold text-gray-800 mb-4 flex items-center gap-2')}>
              <span>🏆</span> Children Performance
            </h2>
            
            <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-4 mb-6')}>
              {children.map((child) => (
                <div key={child.id} className={tw('bg-gray-50 rounded-xl p-4 border border-gray-200')}>
                  <div className={tw('flex items-center gap-3 mb-2')}>
                    <div className={tw('w-12 h-12 rounded-full bg-accent-pink flex items-center justify-center')}>
                      <span className={tw('text-2xl')}>{child.avatar || '👧'}</span>
                    </div>
                    <div>
                      <h3 className={tw('font-semibold text-gray-800')}>
                        {child.nickName || child.firstName}
                      </h3>
                      <p className={tw('text-sm text-gray-600')}>
                        Chores Completed: {child.tasksCompleted || 0} chores
                      </p>
                      <p className={tw('text-sm text-gray-600')}>
                        Earned: ${child.moneyAccumulated || 0}.00
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Summary */}
            <div className={tw('grid grid-cols-3 gap-4')}>
              <div className={tw('bg-blue-100 rounded-xl p-4 text-center')}>
                <h4 className={tw('text-sm text-gray-600 mb-1')}>Chores Completed</h4>
                <p className={tw('text-2xl font-bold text-gray-800')}>{stats.completed}</p>
              </div>
              <div className={tw('bg-green-100 rounded-xl p-4 text-center')}>
                <h4 className={tw('text-sm text-gray-600 mb-1')}>Chores Pending</h4>
                <p className={tw('text-2xl font-bold text-gray-800')}>{stats.pending}</p>
              </div>
              <div className={tw('bg-yellow-100 rounded-xl p-4 text-center')}>
                <h4 className={tw('text-sm text-gray-600 mb-1')}>Total Rewards</h4>
                <p className={tw('text-2xl font-bold text-gray-800')}>${stats.totalRewards.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Add Chore Button */}
          <div className={tw('flex justify-end mb-6')}>
            <button
              onClick={() => setShowCreateChore(true)}
              className={tw('flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all')}
            >
              <span className={tw('text-xl')}>+</span> Add Chore
            </button>
          </div>

          {/* Assigned Chores */}
          <div>
            <h2 className={tw('text-xl font-bold text-gray-800 mb-4 flex items-center gap-2')}>
              <span>📋</span> Assigned Chores
            </h2>
            
            <div className={tw('space-y-4')}>
              {chores.map((chore) => (
                <div key={chore.id} className={tw('bg-gray-50 rounded-xl p-4 border border-gray-200')}>
                  <div className={tw('flex items-start justify-between')}>
                    <div className={tw('flex-1')}>
                      <div className={tw('flex items-center gap-3 mb-2')}>
                        <h3 className={tw('font-semibold text-gray-800')}>{chore.title}</h3>
                        <span className={tw(`text-xs px-2 py-1 rounded-full ${
                          chore.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                          chore.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`)}>
                          ⭐ {chore.difficulty}
                        </span>
                        {chore.status === 'completed' && (
                          <span className={tw('text-xs px-2 py-1 rounded-full bg-green-100 text-green-700')}>
                            Completed
                          </span>
                        )}
                        {chore.status === 'pending' && (
                          <span className={tw('text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700')}>
                            Pending
                          </span>
                        )}
                      </div>
                      <p className={tw('text-sm text-gray-600 mb-2')}>{chore.description}</p>
                      <div className={tw('flex items-center gap-4 text-sm text-gray-500')}>
                        <span className={tw('flex items-center gap-1')}>
                          <span>👤</span> {chore.assignedTo}
                        </span>
                        <span className={tw('flex items-center gap-1')}>
                          <span>📅</span> Due: {chore.dueDate}
                        </span>
                        <span className={tw('flex items-center gap-1')}>
                          <span>💰</span> Reward: ${chore.reward.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className={tw('flex items-center gap-2')}>
                      {chore.status === 'pending' && (
                        <button className={tw('p-2 rounded-full bg-green-500 text-white hover:bg-green-600')}>
                          ✓ Complete
                        </button>
                      )}
                      <button className={tw('p-2 rounded-full hover:bg-gray-200 text-red-500')}>
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Chore Modal */}
      {showCreateChore && (
        <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
          <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-md')}>
            <div className={tw('bg-gradient-to-r from-primary-turquoise to-accent-purple p-6 rounded-t-2xl')}>
              <div className={tw('flex items-center justify-between text-white')}>
                <h3 className={tw('text-xl font-bold flex items-center gap-2')}>
                  <span>🎁</span> Create New Chore
                </h3>
                <button
                  onClick={() => setShowCreateChore(false)}
                  className={tw('text-2xl hover:opacity-80')}
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateChore} className={tw('p-6')}>
              <div className={tw('mb-4')}>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  Chore Title
                </label>
                <input
                  type="text"
                  value={choreForm.title}
                  onChange={(e) => setChoreForm({ ...choreForm, title: e.target.value })}
                  placeholder="e.g., Clean your room"
                  className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                  required
                />
              </div>

              <div className={tw('mb-4')}>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  Description
                </label>
                <textarea
                  value={choreForm.description}
                  onChange={(e) => setChoreForm({ ...choreForm, description: e.target.value })}
                  placeholder="Describe what needs to be done..."
                  className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                  rows="3"
                  required
                />
              </div>

              <div className={tw('grid grid-cols-2 gap-4 mb-4')}>
                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                    Assign to
                  </label>
                  <select
                    value={choreForm.assignTo}
                    onChange={(e) => setChoreForm({ ...choreForm, assignTo: e.target.value })}
                    className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                    required
                  >
                    <option value="">Child Profile</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.nickName || child.firstName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                    Reward ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={choreForm.reward}
                    onChange={(e) => setChoreForm({ ...choreForm, reward: e.target.value })}
                    placeholder="0.00"
                    className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                    required
                  />
                </div>
              </div>

              <div className={tw('grid grid-cols-2 gap-4 mb-6')}>
                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={choreForm.dueDate}
                    onChange={(e) => setChoreForm({ ...choreForm, dueDate: e.target.value })}
                    className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                    required
                  />
                </div>

                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                    Difficulty
                  </label>
                  <select
                    value={choreForm.difficulty}
                    onChange={(e) => setChoreForm({ ...choreForm, difficulty: e.target.value })}
                    className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                  >
                    <option value="Easy">⭐ Easy</option>
                    <option value="Medium">⭐⭐ Medium</option>
                    <option value="Hard">⭐⭐⭐ Hard</option>
                  </select>
                </div>
              </div>

              <div className={tw('flex gap-4')}>
                <button
                  type="button"
                  onClick={() => setShowCreateChore(false)}
                  className={tw('flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-primary-turquoise hover:text-primary-turquoise transition-colors')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={tw('flex-1 px-6 py-3 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all')}
                >
                  Create Chore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
          <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-md')}>
            <div className={tw('bg-gradient-to-r from-primary-turquoise to-accent-purple p-6 rounded-t-2xl')}>
              <div className={tw('flex items-center justify-between text-white')}>
                <h3 className={tw('text-xl font-bold flex items-center gap-2')}>
                  <span>👤</span> Edit Profile
                </h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className={tw('text-2xl hover:opacity-80')}
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className={tw('p-6')}>
              {/* Avatar Selection */}
              <div className={tw('mb-6')}>
                <label className={tw('block text-sm font-medium text-gray-700 mb-3')}>
                  Choose Avatar
                </label>
                <div className={tw('grid grid-cols-4 gap-3')}>
                  {avatarOptions.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, avatar })}
                      className={tw(`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
                        profileForm.avatar === avatar
                          ? 'bg-gradient-to-r from-primary-turquoise to-accent-purple shadow-lg scale-110'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`)}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div className={tw('grid grid-cols-2 gap-4 mb-4')}>
                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                    required
                  />
                </div>

                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                    required
                  />
                </div>
              </div>

              <div className={tw('mb-4')}>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise bg-gray-50')}
                  disabled
                />
                <p className={tw('text-xs text-gray-500 mt-1')}>Email cannot be changed</p>
              </div>

              <div className={tw('mb-6')}>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                />
              </div>

              <div className={tw('flex gap-4')}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className={tw('flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-primary-turquoise hover:text-primary-turquoise transition-colors')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={tw('flex-1 px-6 py-3 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all')}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Family Management Modal */}
      {showFamilyModal && (
        <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
          <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden')}>
            <div className={tw('bg-gradient-to-r from-primary-turquoise to-accent-purple p-6 rounded-t-2xl')}>
              <div className={tw('flex items-center justify-between text-white')}>
                <h3 className={tw('text-xl font-bold flex items-center gap-2')}>
                  <span>👨‍👩‍👧‍👦</span> Manage Family
                </h3>
                <button
                  onClick={() => setShowFamilyModal(false)}
                  className={tw('text-2xl hover:opacity-80')}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={tw('p-6 overflow-y-auto max-h-[calc(80vh-100px)]')}>
              {/* Parents Section */}
              <div className={tw('mb-8')}>
                <h4 className={tw('text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2')}>
                  <span>👫</span> Parents
                </h4>
                <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-4')}>
                  {/* Current User */}
                  <div className={tw('bg-gray-50 rounded-xl p-4 border border-gray-200')}>
                    <div className={tw('flex items-center gap-3')}>
                      <div className={tw('w-16 h-16 rounded-full bg-gradient-to-r from-primary-turquoise to-accent-purple flex items-center justify-center')}>
                        <span className={tw('text-2xl')}>{userProfile?.avatar || '👩‍💼'}</span>
                      </div>
                      <div className={tw('flex-1')}>
                        <h5 className={tw('font-semibold text-gray-800')}>
                          {userProfile?.firstName} {userProfile?.lastName}
                        </h5>
                        <p className={tw('text-sm text-gray-600')}>{userProfile?.email}</p>
                        <span className={tw('text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full')}>
                          Current User
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spouse/Partner */}
                  {userProfile?.spouse ? (
                    <div className={tw('bg-gray-50 rounded-xl p-4 border border-gray-200')}>
                      <div className={tw('flex items-center gap-3')}>
                        <div className={tw('w-16 h-16 rounded-full bg-accent-pink flex items-center justify-center')}>
                          <span className={tw('text-2xl')}>{userProfile.spouse.avatar || '👨‍💼'}</span>
                        </div>
                        <div className={tw('flex-1')}>
                          <h5 className={tw('font-semibold text-gray-800')}>
                            {userProfile.spouse.name}
                          </h5>
                          <p className={tw('text-sm text-gray-600')}>{userProfile.spouse.role}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={tw('bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300 flex items-center justify-center')}>
                      <button
                        onClick={() => navigate('/profile')}
                        className={tw('text-gray-500 hover:text-primary-turquoise flex flex-col items-center gap-2')}
                      >
                        <span className={tw('text-3xl')}>➕</span>
                        <span className={tw('text-sm')}>Add Spouse/Partner</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Children Section */}
              <div>
                <div className={tw('flex items-center justify-between mb-4')}>
                  <h4 className={tw('text-lg font-semibold text-gray-800 flex items-center gap-2')}>
                    <span>👶</span> Children ({children.length})
                  </h4>
                  <button
                    onClick={() => navigate('/profile')}
                    className={tw('px-4 py-2 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all text-sm')}
                  >
                    Add Child
                  </button>
                </div>

                <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-4')}>
                  {children.map((child) => (
                    <div key={child.id} className={tw('bg-gray-50 rounded-xl p-4 border border-gray-200')}>
                      <div className={tw('flex items-center justify-between')}>
                        <div className={tw('flex items-center gap-3')}>
                          <div className={tw('w-14 h-14 rounded-full bg-accent-pink flex items-center justify-center')}>
                            <span className={tw('text-2xl')}>{child.avatar || '👧'}</span>
                          </div>
                          <div>
                            <h5 className={tw('font-semibold text-gray-800')}>
                              {child.nickName || child.firstName}
                            </h5>
                            <p className={tw('text-sm text-gray-600')}>
                              Age: {child.age || 'Not set'}
                            </p>
                            <p className={tw('text-xs text-gray-500')}>
                              Username: {child.username}
                            </p>
                          </div>
                        </div>
                        <div className={tw('flex gap-2')}>
                          <button
                            onClick={() => {
                              setSelectedChild(child);
                              setShowEditChildModal(true);
                            }}
                            className={tw('p-2 rounded-full hover:bg-gray-200 text-gray-600')}
                          >
                            <svg className={tw('w-4 h-4')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove ${child.nickName || child.firstName}?`)) {
                                // TODO: Implement delete child
                                console.log('Delete child:', child.id);
                              }
                            }}
                            className={tw('p-2 rounded-full hover:bg-gray-200 text-red-500')}
                          >
                            <svg className={tw('w-4 h-4')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className={tw('mt-3 pt-3 border-t border-gray-200')}>
                        <div className={tw('flex justify-between text-sm')}>
                          <span className={tw('text-gray-600')}>Tasks Completed:</span>
                          <span className={tw('font-medium')}>{child.tasksCompleted || 0}</span>
                        </div>
                        <div className={tw('flex justify-between text-sm mt-1')}>
                          <span className={tw('text-gray-600')}>Money Earned:</span>
                          <span className={tw('font-medium text-green-600')}>${child.moneyAccumulated || 0}.00</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={tw('p-6 border-t border-gray-200')}>
              <button
                onClick={() => setShowFamilyModal(false)}
                className={tw('w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Child Modal */}
      {showEditChildModal && selectedChild && (
        <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
          <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-md')}>
            <div className={tw('bg-gradient-to-r from-primary-turquoise to-accent-purple p-6 rounded-t-2xl')}>
              <div className={tw('flex items-center justify-between text-white')}>
                <h3 className={tw('text-xl font-bold flex items-center gap-2')}>
                  <span>✏️</span> Edit Child Profile
                </h3>
                <button
                  onClick={() => {
                    setShowEditChildModal(false);
                    setSelectedChild(null);
                  }}
                  className={tw('text-2xl hover:opacity-80')}
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              // TODO: Implement update child
              console.log('Update child:', selectedChild);
              setShowEditChildModal(false);
              setSelectedChild(null);
            }} className={tw('p-6')}>
              <div className={tw('mb-4')}>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  Nickname
                </label>
                <input
                  type="text"
                  value={selectedChild.nickName || ''}
                  onChange={(e) => setSelectedChild({ ...selectedChild, nickName: e.target.value })}
                  className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                />
              </div>

              <div className={tw('mb-4')}>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  Age
                </label>
                <input
                  type="number"
                  value={selectedChild.age || ''}
                  onChange={(e) => setSelectedChild({ ...selectedChild, age: e.target.value })}
                  className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                  min="1"
                  max="18"
                />
              </div>

              <div className={tw('mb-6')}>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  Avatar
                </label>
                <div className={tw('grid grid-cols-4 gap-3')}>
                  {['👧', '👦', '🧒', '👶', '👧🏻', '👦🏻', '👧🏽', '👦🏽'].map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedChild({ ...selectedChild, avatar })}
                      className={tw(`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
                        selectedChild.avatar === avatar
                          ? 'bg-gradient-to-r from-primary-turquoise to-accent-purple shadow-lg scale-110'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`)}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div className={tw('flex gap-4')}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditChildModal(false);
                    setSelectedChild(null);
                  }}
                  className={tw('flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-primary-turquoise hover:text-primary-turquoise transition-colors')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={tw('flex-1 px-6 py-3 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all')}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
          <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden')}>
            <div className={tw('bg-gradient-to-r from-primary-turquoise to-accent-purple p-6 rounded-t-2xl')}>
              <div className={tw('flex items-center justify-between text-white')}>
                <h3 className={tw('text-xl font-bold flex items-center gap-2')}>
                  <BellIcon size={24} /> Goals & Notifications
                </h3>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    // Mark all as read
                    fetch('https://aidiy-deployment-production.up.railway.app/api/notifications/mark-read', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('app_token')}` }
                    });
                    setUnreadCount(0);
                  }}
                  className={tw('text-2xl hover:opacity-80')}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={tw('p-6 overflow-y-auto max-h-[calc(80vh-100px)]')}>
              <p className={tw('text-gray-600 mb-6')}>
                Review and manage your children's goals
              </p>

              {notifications.length === 0 ? (
                <div className={tw('text-center py-12 text-gray-500')}>
                  <BellIcon size={48} className={tw('mx-auto mb-4 opacity-50')} />
                  <p>No new notifications</p>
                </div>
              ) : (
                <div className={tw('space-y-4')}>
                  {notifications.map((notification, index) => (
                    <div key={index} className={tw('bg-gray-50 rounded-xl p-6 border border-gray-200')}>
                      <div className={tw('flex items-start gap-4')}>
                        <div className={tw('w-16 h-16 rounded-full bg-accent-pink flex items-center justify-center flex-shrink-0')}>
                          <span className={tw('text-2xl')}>{notification.kid_avatar || '👧'}</span>
                        </div>
                        <div className={tw('flex-1')}>
                          <h4 className={tw('text-lg font-semibold text-gray-800 mb-2')}>
                            {notification.title}
                          </h4>
                          <p className={tw('text-gray-600 mb-4')}>
                            {notification.message}
                          </p>
                          
                          {notification.type === 'goal_approval_request' && (
                            <div className={tw('flex items-center gap-4 mb-4')}>
                              <div className={tw('flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full')}>
                                <span className={tw('text-green-700 font-medium')}>💰 ${notification.title.match(/\$(\d+\.?\d*)/)?.[1] || '0'}</span>
                              </div>
                              <div className={tw('flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full')}>
                                <span className={tw('text-blue-700 font-medium')}>🚶 10 weeks ( Steady pace )</span>
                              </div>
                            </div>
                          )}

                          {notification.status === 'pending' ? (
                            <div className={tw('flex gap-4')}>
                              <button
                                onClick={() => handleDeclineGoal(notification.goal_id)}
                                className={tw('flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-red-500 hover:text-red-500 transition-colors font-medium')}
                              >
                                Decline & Suggest Goal
                              </button>
                              <button
                                onClick={() => handleApproveGoal(notification.goal_id)}
                                className={tw('flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all')}
                              >
                                Approve & Assign Chores
                              </button>
                            </div>
                          ) : notification.status === 'approved' ? (
                            <div className={tw('bg-green-100 border border-green-300 rounded-lg p-4 text-center')}>
                              <p className={tw('text-green-700 font-medium flex items-center justify-center gap-2')}>
                                <span className={tw('text-xl')}>✅</span>
                                Goal Approved - Chores Assigned
                              </p>
                            </div>
                          ) : notification.status === 'declined' ? (
                            <div className={tw('bg-red-100 border border-red-300 rounded-lg p-4 text-center')}>
                              <p className={tw('text-red-700 font-medium flex items-center justify-center gap-2')}>
                                <span className={tw('text-xl')}>❌</span>
                                Goal Declined
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;