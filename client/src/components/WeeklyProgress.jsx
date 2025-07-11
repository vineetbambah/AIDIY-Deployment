// WeeklyProgress.jsx - Fixed version with proper chore merging
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tw } from "@twind/core";
import CelebrationEffect from "./CelebrationEffect";
import { API_BASE_URL } from '../api';

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const labelColors = ["#696EFF", "#FF85B8"];

const WeeklyProgress = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  
  // Since ChoreQuest now passes ALL chores in selectedChores, we can use it directly
  const selectedChores = useMemo(() => {
    // If we have selectedChores from the state, use them
    if (state?.selectedChores && state.selectedChores.length > 0) {
      return state.selectedChores;
    }
    
    // Fallback: merge new chores with existing ones (for backward compatibility)
    const newChores = state?.newChores || [];
    const existingChores = state?.prevChores || [];
    
    const merged = [...existingChores, ...newChores];
    return merged.reduce((unique, chore) => {
      if (!unique.some(c => c.id === chore.id)) {
        unique.push(chore);
      }
      return unique;
    }, []);
  }, [state]);

  // Rest of the component remains the same...
  const goal = state?.goal || {};
  const [completedChores, setCompletedChores] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [deadlineWarning, setDeadlineWarning] = useState(false);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [currentChoreStatuses, setCurrentChoreStatuses] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [hasPendingApproval, setHasPendingApproval] = useState(false);

  // Calculate deadline status
  useEffect(() => {
    if (goal?.duration) {
      const createdDate = new Date(goal.created_at || goal.createdAt);
      const deadline = new Date(createdDate);
      deadline.setDate(deadline.getDate() + goal.duration * 7);
      
      const today = new Date();
      const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining <= 3 && daysRemaining > 0) {
        setDeadlineWarning(true);
      } else if (daysRemaining <= 0) {
        setDeadlinePassed(true);
      }
    }
  }, [goal]);

  // Fetch current chore statuses
  useEffect(() => {
    const fetchChoreStatuses = async () => {
      if (!goal._id && !goal.id) return;
      
      try {
        const token = sessionStorage.getItem('app_token');
        const goalId = goal._id || goal.id;
        
        // Fetch chores assigned to this goal
        const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}/chores`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (data.success && data.chores) {
          // Create a map of chore statuses
          const statusMap = {};
          let foundPending = false;
          
          // Check if any of the selected chores are pending approval
          selectedChores.forEach(chore => {
            // Find the current status of this chore from the backend
            const currentChore = data.chores.find(c => c.id === chore.id);
            if (!currentChore) {
              // If chore is not in the list, it might be archived or pending
              statusMap[chore.id] = 'archived_or_pending';
              foundPending = true;
            } else {
              statusMap[chore.id] = currentChore.status;
              if (currentChore.status === 'pending_approval') {
                foundPending = true;
              }
            }
          });
          
          setCurrentChoreStatuses(statusMap);
          setHasPendingApproval(foundPending);
          
          // If all selected chores are archived, redirect to dashboard
          const allArchived = selectedChores.every(chore => 
            statusMap[chore.id] === 'archived_or_pending'
          );
          
          if (allArchived) {
            alert('All chores have been processed. Returning to dashboard.');
            navigate('/kid-dashboard');
          }
        }
      } catch (error) {
        console.error('Error fetching chore statuses:', error);
      } finally {
        setLoadingStatuses(false);
      }
    };
    
    fetchChoreStatuses();
    
    // Also check if refreshing from submission
    const shouldRefresh = sessionStorage.getItem('refreshKidDashboard');
    if (shouldRefresh) {
      fetchChoreStatuses();
      sessionStorage.removeItem('refreshKidDashboard');
    }
  }, [goal, selectedChores, navigate]);

  const toggleComplete = (name) => {
    const wasCompleted = completedChores.includes(name);
    
    setCompletedChores((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
    
    // Show celebration only when completing (not uncompleting)
    if (!wasCompleted) {
      setShowCelebration(true);
    }
  };

  const markAllComplete = () => {
    const allChoreNames = selectedChores.map(chore => chore.name);
    setCompletedChores(allChoreNames);
    setShowCelebration(true);
  };

  const handleEditMissionList = () => {
    // Navigate back with existing chores
    navigate("/chore-quest", { 
      state: { 
        goal,
        prevChores: selectedChores // Pass existing chores
      } 
    });
  };

  const handleSubmitProgress = async () => {
    if (completedChores.length === 0) {
      alert('Please complete at least one chore before submitting!');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = sessionStorage.getItem('app_token');
      
      // Get chore IDs instead of names
      const completedChoreIds = selectedChores
        .filter(chore => completedChores.includes(chore.name))
        .map(chore => chore.id || chore._id);
      
      const totalEarned = selectedChores
        .filter(chore => completedChores.includes(chore.name))
        .reduce((sum, chore) => sum + chore.amount, 0);

      const submissionData = {
        goalId: goal._id || goal.id,
        completedChoreIds,
        totalEarned,
        submissionDate: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/api/goals/submit-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();
      
      if (data.success) {
        setHasSubmitted(true);
        // Set a flag to trigger refresh in KidDashboard
        sessionStorage.setItem('refreshKidDashboard', 'true');
      } else {
        alert('Failed to submit progress. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting progress:', error);
      alert('Failed to submit progress. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalEarned = selectedChores
    .filter(chore => completedChores.includes(chore.name))
    .reduce((sum, chore) => sum + chore.amount, 0)
    .toFixed(2);

  const overallProgress = goal.amount 
    ? Math.min(100, Math.floor(((goal.saved || goal.currentAmount || 0) / goal.amount) * 100))
    : 0;

  // CONDITIONAL RETURNS AFTER ALL HOOKS

  // Show loading while checking statuses
  if (loadingStatuses) {
    return (
      <div className={tw("min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center")}>
        <div className={tw("text-xl font-semibold text-purple-700")}>Loading progress...</div>
      </div>
    );
  }

  // If there are pending approvals, show different UI
  if (hasPendingApproval) {
    return (
      <div className={tw("min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center px-4")}>
        <div className={tw("max-w-md mx-auto bg-white rounded-3xl shadow-lg p-8 text-center")}>
          <div className={tw("text-6xl mb-4")}>⏳</div>
          <h2 className={tw("text-2xl font-bold text-gray-800 mb-3")}>
            Progress Already Submitted
          </h2>
          <p className={tw("text-gray-600 mb-6")}>
            You've already submitted these chores for approval. Please wait for your parents to review them before submitting new progress.
          </p>
          
          <div className={tw("bg-purple-50 rounded-xl p-4 mb-6")}>
            <p className={tw("text-sm font-semibold text-purple-700 mb-2")}>Chores Pending Approval:</p>
            <ul className={tw("text-sm text-gray-600 space-y-1")}>
              {selectedChores
                .filter(chore => currentChoreStatuses[chore.id] === 'pending_approval')
                .map((chore, index) => (
                  <li key={index}>• {chore.name}</li>
                ))}
            </ul>
          </div>
          
          <div className={tw("flex flex-col gap-3")}>
            <button
              onClick={() => navigate("/kid-dashboard")}
              className={tw("px-6 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors")}
            >
              🏠 Back to Dashboard
            </button>
            <button
              onClick={() => navigate("/chore-quest", { state: { goal } })}
              className={tw("px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors")}
            >
              📋 View Other Chores
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className={tw("min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 px-4 py-6")}>
      {/* Deadline warnings */}
      {deadlineWarning && (
        <div className={tw("max-w-4xl mx-auto mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-lg")}>
          <p className={tw("flex items-center")}>
            <span className={tw("text-xl mr-2")}>⏰</span>
            Deadline approaching! Only 3 days left to complete your chores!
          </p>
        </div>
      )}
      
      {deadlinePassed && (
        <div className={tw("max-w-4xl mx-auto mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg")}>
          <p className={tw("flex items-center")}>
            <span className={tw("text-xl mr-2")}>❌</span>
            Deadline has passed! Please talk to your parents about your goal.
          </p>
        </div>
      )}

      {/* Header */}
      <div className={tw("max-w-6xl mx-auto bg-white p-4 rounded-xl shadow-md mb-6")}>
        <h2 className={tw("text-lg font-bold text-purple-700 mb-1")}>🏆 OVERALL GOAL PROGRESS</h2>
        <p className={tw("text-sm text-[#0a2150] mb-2")}>Working on: {goal.title}</p>
        
        {/* Overall Goal Progress */}
        <div className={tw("mb-4")}>
          <div className={tw("flex justify-between text-xs text-gray-600 mb-1")}>
            <span>Overall Goal: {goal.name || goal.title}</span>
            <span>${goal.saved || goal.currentAmount || 0} / ${goal.amount}</span>
          </div>
          <div className={tw("w-full bg-gray-200 h-2 rounded-full")}>
            <div
              className={tw("bg-purple-600 h-2 rounded-full transition-all duration-500")}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
        
        {/* Weekly Progress */}
        <div className={tw("w-full bg-gray-200 h-3 rounded-full mb-2")}>
          <div
            className={tw("bg-blue-400 h-3 rounded-full transition-all duration-300")}
            style={{ width: `${(completedChores.length / selectedChores.length) * 100}%` }}
          />
        </div>
        <p className={tw("text-sm font-semibold")}>
          ⭐ {completedChores.length} of {selectedChores.length} Missions Completed
        </p>
      </div>

      {/* Controls - only show if not submitted */}
      {!hasSubmitted && (
        <div className={tw("max-w-6xl mx-auto mb-6 flex gap-4")}>
          <button
            onClick={markAllComplete}
            disabled={completedChores.length === selectedChores.length}
            className={tw("px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-50")}
          >
            ✅ Mark All Complete
          </button>
          <button
            onClick={() => setCompletedChores([])}
            disabled={completedChores.length === 0}
            className={tw("px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400 transition-colors disabled:opacity-50")}
          >
            🔄 Reset Progress
          </button>
        </div>
      )}

      {/* Chore Cards */}
      <div className={tw("max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6")}>
        {selectedChores.map((chore, index) => {
          const isCompleted = completedChores.includes(chore.name);
          const day = dayLabels[index % 7];
          const labelColor = labelColors[index % labelColors.length];

          return (
            <div
              key={index}
              className={tw(
                `rounded-xl bg-white shadow-md border transition-all duration-300 ${
                  isCompleted ? "border-green-500 transform scale-[1.02]" : "border-gray-300"
                } ${hasSubmitted ? "opacity-75" : ""}`
              )}
            >
              {/* Full-width Day Label Bar */}
              <div
                className={tw("w-full py-1 text-center text-white text-xs font-bold rounded-t-xl")}
                style={{ backgroundColor: labelColor }}
              >
                {day}
              </div>

              {/* Card Content */}
              <div className={tw("p-4")}>
                {/* Checkbox + Task Name */}
                <div className={tw("flex items-center mb-2")}>
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => toggleComplete(chore.name)}
                    className={tw("mr-2 w-4 h-4 accent-green-500")}
                    disabled={hasSubmitted}
                  />
                  <h3
                    className={tw(
                      `font-bold text-blue-800 mb-1 ${
                        isCompleted ? "line-through text-gray-500" : ""
                      }`
                    )}
                  >
                    {chore.name}
                  </h3>
                </div>

                {/* Description */}
                <p className={tw("text-sm text-gray-600 mb-1")}>{chore.description}</p>

                {/* Meta Info */}
                <div className={tw("flex justify-between items-center text-sm mb-2")}>
                  <span className={tw("text-green-600 font-semibold")}>💰 ${chore.amount}</span>
                  {chore.time && <span className={tw("text-blue-500")}>⏰ {chore.time}</span>}
                </div>

                {/* Guide Me Button */}
                <button
                  onClick={() => navigate("/chat")}
                  className={tw(
                    "px-4 py-1 bg-primary-turquoise text-white rounded-md text-sm mt-2 hover:opacity-90"
                  )}
                >
                  Guide Me AiDIY
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Progress Section */}
      {completedChores.length > 0 && !hasSubmitted && (
        <div className={tw("mt-8 max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-6 border-2 border-green-200")}>
          <div className={tw("text-center")}>
            <div className={tw("text-4xl mb-4")}>🎯</div>
            <h3 className={tw("text-xl font-bold text-gray-800 mb-2")}>Ready to submit your progress?</h3>
            <p className={tw("text-gray-600 mb-4")}>
              You've completed {completedChores.length} task{completedChores.length > 1 ? 's' : ''} and earned ${totalEarned}!
            </p>
            <button
              onClick={handleSubmitProgress}
              disabled={isSubmitting || deadlinePassed}
              className={tw(`px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-lg rounded-2xl hover:shadow-xl transform hover:scale-105 transition-all ${
                isSubmitting || deadlinePassed ? 'opacity-70 cursor-not-allowed' : ''
              }`)}
            >
              {isSubmitting ? (
                <>
                  <span className={tw("animate-spin mr-2")}>⏳</span>
                  Submitting...
                </>
              ) : deadlinePassed ? (
                "⛔ Deadline Passed"
              ) : (
                "🚀 Submit My Progress to Parents"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Simplified Success Message */}
      {hasSubmitted && (
        <div className={tw("mt-8 max-w-4xl mx-auto bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl shadow-lg p-6 text-white text-center")}>
          <div className={tw('text-6xl mb-4')}>📨</div>
          <h3 className={tw('text-2xl font-bold mb-2')}>Progress Submitted!</h3>
          <p className={tw('text-lg mb-4')}>
            Your progress has been sent to your parents for review.
          </p>
          <p className={tw('text-md mb-6 opacity-90')}>
            ✨ You'll be notified when your parents approve your progress and add ${totalEarned} to your savings!
          </p>
          
          <div className={tw('bg-white/20 rounded-xl p-4 mb-6')}>
            <p className={tw('text-sm mb-2')}>💡 What happens next?</p>
            <ul className={tw('text-sm text-left space-y-1')}>
              <li>• Your parents will review your completed chores</li>
              <li>• Once approved, the money will be added to your goal</li>
              <li>• These chores will be marked as complete</li>
              <li>• You can then select new chores to continue</li>
            </ul>
          </div>
          
          <button
            onClick={() => navigate("/kid-dashboard")}
            className={tw(
              "px-8 py-4 bg-white text-purple-600 font-bold text-lg rounded-2xl hover:shadow-xl transform hover:scale-105 transition-all"
            )}
          >
            🏠 Return to Dashboard
          </button>
        </div>
      )}

      {/* Footer Buttons */}
      <div className={tw("mt-10 text-center flex flex-wrap justify-center gap-4")}>
        {!hasSubmitted && (
          <button
            onClick={handleEditMissionList}
            className={tw(
              "px-6 py-2 bg-gradient-to-r from-yellow-400 to-pink-300 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            )}
          >
            ✏️ Edit My Mission List
          </button>
        )}
        <button
          onClick={() => navigate("/kid-dashboard")}
          className={tw(
            "px-6 py-2 bg-gradient-to-r from-purple-400 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          )}
        >
          🏠 Return To Home Page
        </button>
      </div>

      {/* Celebration Effect */}
      <CelebrationEffect 
        isVisible={showCelebration} 
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default WeeklyProgress;