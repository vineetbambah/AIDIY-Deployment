// NotificationsModal.jsx - Updated to mark all as read on open/close
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tw } from '@twind/core';
import avatarDaughter from '../images/avatar-daughter.png';
import avatarSon from '../images/avatar-son.png';
import { API_BASE_URL } from '../api';

// Helper function to get valid avatar for children
const getValidChildAvatar = (avatar) => {
  return avatar && (
    avatar.includes('/static/') || 
    avatar === avatarDaughter || 
    avatar === avatarSon
  ) ? avatar : avatarDaughter;
};

const NotificationsModal = ({ 
  isOpen, 
  onClose, 
  notifications, 
  onApproveGoal, 
  onDeclineGoal,
  onApproveProgress,
  onDeclineProgress,
  refreshUnreadCount 
}) => {
  const navigate = useNavigate();
  
  // Mark all notifications as read when modal opens
  useEffect(() => {
    if (isOpen) {
      markAllAsRead();
    }
  }, [isOpen]);

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = sessionStorage.getItem('app_token');
      await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Refresh unread count in parent component
      if (refreshUnreadCount) refreshUnreadCount();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Updated close handler with mark as read
  const handleClose = () => {
    markAllAsRead();
    onClose();
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = sessionStorage.getItem('app_token');
      await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const renderNotification = (notification) => {
    // Handle goal approval requests
    if (notification.type === 'goal_approval_request') {
      return (
        <div key={notification._id} className={tw('p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors')}>
          <div className={tw('flex items-start gap-3')}>
            <div className={tw('w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden')}>
              <img
                src={getValidChildAvatar(notification.kid_avatar)}
                alt={`${notification.kid_name || 'Child'} avatar`}
                className="w-8 h-8 object-cover rounded-full"
              />
            </div>
            
            <div className={tw('flex-1')}>
              <h4 className={tw('font-semibold text-gray-900')}>{notification.title}</h4>
              <p className={tw('text-sm text-gray-600 mt-1')}>{notification.message}</p>
              <p className={tw('text-xs text-gray-500 mt-2')}>
                {new Date(notification.created_at).toLocaleDateString()}
              </p>
              
              {notification.status === 'pending' && (
                <div className={tw('flex gap-2 mt-3')}>
                  <button
                    onClick={() => {
                      handleMarkAsRead(notification._id);
                      sessionStorage.setItem('refreshChoreList', 'true');
                      navigate('/kid-dashboard');
                    }}
                    className={tw('px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors')}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => {
                      onDeclineGoal(notification.goal_id);
                      handleMarkAsRead(notification._id);
                    }}
                    className={tw('px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors')}
                  >
                    ❌ Decline
                  </button>
                </div>
              )}
              
              {notification.status === 'approved' && (
                <div className={tw('mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium inline-block')}>
                  ✅ Approved
                </div>
              )}
              
              {notification.status === 'declined' && (
                <div className={tw('mt-3 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium inline-block')}>
                  ❌ Declined
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // Handle progress submission notifications
    if (notification.type === 'progress_submission') {
      return (
        <div key={notification._id} className={tw('p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors')}>
          <div className={tw('flex items-start gap-3')}>
            <div className={tw('w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center overflow-hidden')}>
              <img
                src={getValidChildAvatar(notification.kid_avatar)}
                alt={`${notification.kid_name || 'Child'} avatar`}
                className="w-8 h-8 object-cover rounded-full"
              />
            </div>
            
            <div className={tw('flex-1')}>
              <h4 className={tw('font-semibold text-gray-900')}>{notification.title}</h4>
              <p className={tw('text-sm text-gray-600 mt-1')}>{notification.message}</p>
              
              {notification.completed_chores && notification.completed_chores.length > 0 && (
                <div className={tw('mt-3 bg-gray-50 rounded-lg p-3')}>
                  <p className={tw('text-xs font-medium text-gray-700 mb-2')}>Completed Chores:</p>
                  <ul className={tw('space-y-1')}>
                    {notification.completed_chores.map((chore, index) => (
                      <li key={index} className={tw('text-xs text-gray-600 flex items-center gap-2')}>
                        <span>✓</span>
                        <span>{chore.title} - ${chore.reward.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className={tw('text-xs text-gray-500 mt-2')}>
                {new Date(notification.created_at).toLocaleDateString()}
              </p>
              
              {notification.status === 'pending' && (
                <div className={tw('flex gap-2 mt-3')}>
                  <button
                    onClick={() => {
                      onApproveProgress(notification._id);
                      handleMarkAsRead(notification._id);
                    }}
                    className={tw('px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors')}
                  >
                    ✅ Approve Progress
                  </button>
                  <button
                    onClick={() => {
                      onDeclineProgress(notification._id);
                      handleMarkAsRead(notification._id);
                    }}
                    className={tw('px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors')}
                  >
                    ❌ Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // Handle goal completion notifications
    if (notification.type === 'goal_completed') {
      return (
        <div key={notification._id} className={tw('p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors')}>
          <div className={tw('flex items-start gap-3')}>
            <div className={tw('w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center')}>
              <span className={tw('text-lg')}>🎉</span>
            </div>
            
            <div className={tw('flex-1')}>
              <h4 className={tw('font-semibold text-gray-900')}>{notification.title}</h4>
              <p className={tw('text-sm text-gray-600 mt-1')}>{notification.message}</p>
              
              {notification.goal_amount && (
                <div className={tw('mt-2 bg-green-50 rounded-lg p-3 inline-block')}>
                  <p className={tw('text-sm font-medium text-green-800')}>
                    Goal Achieved: ${notification.goal_amount.toFixed(2)}
                  </p>
                </div>
              )}
              
              <p className={tw('text-xs text-gray-500 mt-2')}>
                {new Date(notification.created_at).toLocaleDateString()}
              </p>
              
              {/* {!notification.read && (
                <button
                  onClick={() => handleMarkAsRead(notification._id)}
                  className={tw('mt-3 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors')}
                >
                  Mark as Read
                </button>
              )} */}
            </div>
          </div>
        </div>
      );
    }
    
    // Handle progress approved notifications
    if (notification.type === 'progress_approved') {
      return (
        <div key={notification._id} className={tw('p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors')}>
          <div className={tw('flex items-start gap-3')}>
            <div className={tw('w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center')}>
              <span className={tw('text-lg')}>✅</span>
            </div>
            
            <div className={tw('flex-1')}>
              <h4 className={tw('font-semibold text-gray-900')}>{notification.title}</h4>
              <p className={tw('text-sm text-gray-600 mt-1')}>{notification.message}</p>
              
              {notification.earned_amount && (
                <div className={tw('mt-2 bg-green-50 rounded-lg p-2 inline-block')}>
                  <p className={tw('text-sm font-medium text-green-800')}>
                    💰 ${notification.earned_amount.toFixed(2)} added to your savings!
              </p>
            </div>
          )}
          
          <div className={tw('mt-3 bg-blue-50 rounded-lg p-3')}>
            <p className={tw('text-xs text-blue-700')}>
              ✨ Great job! Your completed chores have been approved and removed from your list.
              {notification.can_select_new_chores && ' You can now select new chores to continue earning!'}
            </p>
          </div>
          
          <p className={tw('text-xs text-gray-500 mt-2')}>
            {new Date(notification.created_at).toLocaleDateString()}
          </p>
          
          {/* <button
            onClick={() => {
              handleMarkAsRead(notification._id);
              navigate('/kid-dashboard');
            }}
            className={tw('mt-3 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors')}
          >
            View Dashboard 🏠
          </button> */}
        </div>
      </div>
    </div>
  );
}
    
    // Handle progress declined notifications
    if (notification.type === 'progress_declined') {
      return (
        <div key={notification._id} className={tw('p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors')}>
          <div className={tw('flex items-start gap-3')}>
            <div className={tw('w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center')}>
              <span className={tw('text-lg')}>🔄</span>
            </div>
            
            <div className={tw('flex-1')}>
              <h4 className={tw('font-semibold text-gray-900 flex items-center gap-2')}>
                <span>Chore Needs Redo</span>
                <span className={tw('text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full')}>
                  Try Again!
                </span>
              </h4>
              
              {notification.goal_title && (
                <div className={tw('mt-1 bg-purple-50 rounded-lg p-2 inline-block')}>
                  <p className={tw('text-sm text-purple-700 font-medium')}>
                    Goal: {notification.goal_title}
                  </p>
                </div>
              )}
              
              <p className={tw('text-sm text-gray-600 mt-2')}>
                {notification.message}
              </p>
              
              <div className={tw('mt-4 flex gap-2')}>
                <button
                  onClick={() => {
                    handleMarkAsRead(notification._id);
                    navigate('/chat');
                  }}
                  className={tw('flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors')}
                >
                  Ask for Help
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Default notification rendering
    return (
      <div key={notification._id} className={tw('p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors')}>
        <div className={tw('flex items-start gap-3')}>
          <div className={tw('w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center')}>
            <span className={tw('text-lg')}>🔔</span>
          </div>
          
          <div className={tw('flex-1')}>
            <h4 className={tw('font-semibold text-gray-900')}>{notification.title}</h4>
            <p className={tw('text-sm text-gray-600 mt-1')}>{notification.message}</p>
            <p className={tw('text-xs text-gray-500 mt-2')}>
              {new Date(notification.created_at).toLocaleDateString()}
            </p>
            
            {/* {!notification.read && (
              // <button
              //   onClick={() => handleMarkAsRead(notification._id)}
              //   className={tw('mt-3 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors')}
              // >
              //   Mark as Read
              // </button>
            )} */}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}
      onClick={handleClose} // Close modal when clicking backdrop
    >
      <div 
        className={tw('bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col')}
        onClick={e => e.stopPropagation()} // Prevent close when clicking inside modal
      >
        <div className={tw('p-6 border-b border-gray-100')}>
          <div className={tw('flex items-center justify-between')}>
            <div>
              <h2 className={tw('text-2xl font-bold text-gray-900')}>Notifications</h2>
              <p className={tw('text-sm text-gray-600 mt-1')}>
                Stay updated with your family's activities
              </p>
            </div>
            <button
              onClick={handleClose}
              className={tw('p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors')}
            >
              <svg className={tw('w-6 h-6')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className={tw('flex-1 overflow-y-auto')}>
          {notifications.length === 0 ? (
            <div className={tw('text-center py-16')}>
              <div className={tw('w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center')}>
                <span className={tw('text-4xl')}>🔔</span>
              </div>
              <h3 className={tw('text-lg font-semibold text-gray-800 mb-2')}>All caught up!</h3>
              <p className={tw('text-gray-600')}>No new notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map(notification => renderNotification(notification))}
            </div>
          )}
        </div>
        
        <div className={tw('p-6 border-t border-gray-100')}>
          <button
            onClick={handleClose}
            className={tw('w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors')}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;