// ChoreQuest.jsx - Fixed version
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tw } from "@twind/core";
import { API_BASE_URL } from '../api';

const ChoreQuest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { goal, prevChores = [] } = location.state || {}; // Get existing chores

  const [allChores, setAllChores] = useState([]);
  const [selectedChores, setSelectedChores] = useState(prevChores); // Initialize with existing chores
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  // If goal is not approved, prevent access
  useEffect(() => {
    if (!goal || goal.status !== "approved") {
      alert("This goal is not approved yet.");
      navigate(-1);
    }
  }, [goal, navigate]);

  // Fetch chores assigned to this child
  useEffect(() => {
    const fetchChores = async () => {
      if (!goal || goal.status !== "approved") return;
      
      setLoading(true);
      try {
        const token = sessionStorage.getItem('app_token');
        
        // Direct API call - the backend will determine the kid from the token
        const response = await fetch(`${API_BASE_URL}/api/chores`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        console.log("Fetched chores:", data);
        
        if (data.success && data.chores) {
          // Filter out completed chores and only show assigned ones that aren't already assigned to a goal
          const assignedChores = data.chores.filter(
            chore => (chore.status === 'Assigned' || chore.status === 'pending') && !chore.assigned_goal_id
          );
          
          // Convert each assigned chore to match the required format
          const emojiMap = {
            Cleaning: '🧹',
            Kitchen: '🍳',
            Outdoor: '🌳',
            Organization: '📦',
            'Pet Care': '🐕',
            Other: '📝'
          };
          
          const convertedChores = assignedChores.map(chore => {
            // Prefix title with an emoji based on category
            const prefix = chore.category && emojiMap[chore.category] ? emojiMap[chore.category] + ' ' : '';
            
            // Map difficulty to child-friendly format with emoji
            let diffLabel;
            if (chore.difficulty.toLowerCase() === 'easy') diffLabel = '☺️ Easy';
            else if (chore.difficulty.toLowerCase() === 'medium') diffLabel = '💪 Medium';
            else if (chore.difficulty.toLowerCase() === 'hard') diffLabel = '🔥 Hard';
            else diffLabel = chore.difficulty;
            
            return {
              id: chore.id, // Keep the chore ID for tracking
              name: prefix + chore.title,
              description: chore.description,
              amount: Math.round(chore.reward), // round reward to nearest whole number
              difficulty: diffLabel,
              dueDate: chore.dueDate,
              status: chore.status,
              category: chore.category
            };
          });
          
          setAllChores(convertedChores);
        } else {
          setAllChores([]);
        }
      } catch (err) {
        console.error("Failed to fetch chores:", err);
        setAllChores([]);
      } finally {
        setLoading(false);
      }
    };

    // Check if we need to refresh after approval
    const needsRefresh = sessionStorage.getItem('refreshChoreList');
    if (needsRefresh) {
      sessionStorage.removeItem('refreshChoreList');
      fetchChores();
    } else if (goal && goal.status === "approved") {
      fetchChores();
    }
  }, [goal]);

  // Calculate existing savings and potential new earnings
  const overallGoalAmount = goal ? goal.amount : 0;
  const existingSaved = goal ? (goal.saved || goal.currentAmount || 0) : 0;
  const potentialEarnings = selectedChores.reduce((sum, c) => sum + c.amount, 0);
  const totalSoFar = existingSaved + potentialEarnings;

  const toggleChore = (chore) => {
    setSelectedChores((prev) => {
      const exists = prev.find((c) => c.id === chore.id);
      if (exists) {
        return prev.filter((c) => c.id !== chore.id);
      } else {
        return [...prev, chore];
      }
    });
  };

const handleLaunchMission = async () => {
  if (selectedChores.length === 0) {
    alert("Please select at least one chore!");
    return;
  }

  setIsAssigning(true);
  
  try {
    const token = sessionStorage.getItem('app_token');
    
    // Get the IDs of NEWLY selected chores (not in prevChores)
    const newChoreIds = selectedChores
      .filter(chore => chore.id && !prevChores.some(pc => pc.id === chore.id))
      .map(chore => chore.id);
    
    // Only assign NEW chores to the goal (don't re-assign existing ones)
    if (newChoreIds.length > 0) {
      const response = await fetch(`${API_BASE_URL}/api/chores/assign-to-goal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          goalId: goal._id || goal.id,
          choreIds: newChoreIds
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error("Failed to assign chores to goal:", data.error);
      }
    }
    
    // Navigate with ALL selected chores (both existing and new)
    navigate("/weekly-progress", { 
      state: { 
        goal,
        selectedChores: selectedChores // Pass ALL chores, not just new ones
      } 
    });
  } catch (error) {
    console.error("Error assigning chores to goal:", error);
    // Even if there's an error, navigate with all chores
    navigate("/weekly-progress", { 
      state: { 
        goal,
        selectedChores: selectedChores // Pass ALL chores
      } 
    });
  } finally {
    setIsAssigning(false);
  }
};

  // Styles for difficulty badges
  const easyStyle = { backgroundColor: "#DCFCE7", color: "#22C55E", borderColor: "#187235" };
  const mediumStyle = { backgroundColor: "#FCEDDC", color: "#C57E22", borderColor: "#C57E22" };
  const hardStyle = { backgroundColor: "#FEE2E2", color: "#DC2626", borderColor: "#DC2626" };

  if (loading) {
    return (
      <div className={tw("min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center")}>
        <div className={tw("text-xl font-semibold text-purple-700")}>Loading your chores...</div>
      </div>
    );
  }

  return (
    <div className={tw("min-h-screen bg-gradient-to-br from-purple-100 to-blue-100")}>
      <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6")}>
        <h1 className={tw("text-3xl font-bold text-center text-[#0a2150] mb-4")}>
          Chore Quest
        </h1>
        <p className={tw("text-bg text-center text-gray-500 mb-10")}>
          Pick your missions to contribute to "{goal?.title}"
        </p>

        {/* Overall Goal Progress Bar */}
        <div className={tw("mb-6 bg-white p-4 rounded-xl shadow")}>
          <h2 className={tw("text-lg font-bold text-black-700 text-center mb-6")}>
            🚀 Big Goals Start with Small Wins!
          </h2>
          
          {/* Progress bar with two segments */}
          <div className={tw("w-full bg-gray-200 h-3 rounded-full flex overflow-hidden")}>
            {/* Existing savings segment */}
            <div 
              className={tw("h-full")}
              style={{ 
                width: `${Math.min((existingSaved / overallGoalAmount) * 100, 100)}%`,
                backgroundColor: '#4ade80'  // Green for existing savings
              }}
            />
            {/* Potential new earnings segment */}
            <div 
              className={tw("h-full")}
              style={{ 
                width: `${Math.min((potentialEarnings / overallGoalAmount) * 100, 100 - (existingSaved / overallGoalAmount) * 100)}%`,
                backgroundColor: '#22d3ee'  // Blue for potential earnings
              }}
            />
          </div>
          
          <p className={tw("mt-2 text-lg font-bold text-purple-700 text-right")}>
            $ {totalSoFar.toFixed(2)} / $ {overallGoalAmount.toFixed(2)} <br />
            <span className={tw("text-sm text-gray-500")}>
              {existingSaved > 0 ? `($${existingSaved.toFixed(2)} already saved)` : 'Your Goal Progress'}
            </span>
          </p>
        </div>

        {/* Show message if no chores available */}
        {allChores.length === 0 ? (
          <div className={tw("text-center py-10 bg-white rounded-xl shadow")}>
            <div className={tw("text-5xl mb-4")}>🧹</div>
            <p className={tw("text-lg font-medium text-gray-600 mb-2")}>
              No chores available right now
            </p>
            <p className={tw("text-sm text-gray-500 mb-6")}>
              Check back later or ask your parent to assign chores
            </p>
            <button
              onClick={() => navigate(-1)}
              className={tw("px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors")}
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            {/* Chore Selection Grid */}
            <div className={tw("grid grid-cols-1 md:grid-cols-3 gap-8 mb-8")}>
              {allChores.map((chore) => {
                const selected = !!selectedChores.find((c) => c.id === chore.id);
                // Determine difficulty badge style
                let diffStyleObj;
                if (chore.difficulty.includes('Hard')) diffStyleObj = hardStyle;
                else if (chore.difficulty.includes('Medium')) diffStyleObj = mediumStyle;
                else diffStyleObj = easyStyle;
                
                return (
                  <div
                    key={chore.id}
                    onClick={() => toggleChore(chore)}
                    className={tw(
                      `p-4 border rounded-xl shadow cursor-pointer transition-all duration-200 ${
                        selected ? "bg-green-50 border-green-400 ring-2 ring-green-200" : "bg-white hover:bg-purple-50"
                      }`
                    )}
                  >
                    <h3 className={tw("font-bold text-lg text-black-800")}>
                      {chore.name}
                    </h3>
                    <p className={tw("text-sm text-left text-gray-500 mb-10")}>
                      {chore.description}
                    </p>
                    {/* Amount and Time/Due aligned */}
                    <div className={tw("flex items-center justify-between mb-2")}>
                      <span
                        className={tw("px-3 py-1 text-sm rounded-full font-bold text-green-600")}
                        style={{ backgroundColor: "#DCFCE7" }}
                      >
                        $ {chore.amount}.00
                      </span>
                      {/* Show due date if available */}
                      {chore.dueDate && (
                        <span
                          className={tw("text-xs font-medium rounded-full px-2 py-1 flex items-center gap-1 border")}
                          style={{ backgroundColor: "#D9E1FF", color: "#2235C5", borderColor: "#2235C5" }}
                        >
                          📅 {new Date(chore.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {/* Difficulty badge */}
                    <span
                      className={tw("text-xs font-medium rounded-full px-2 py-1 border")}
                      style={diffStyleObj}
                    >
                      {chore.difficulty}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Launch Mission Button */}
            <div className={tw("text-center")}>
              <button
                onClick={handleLaunchMission}
                disabled={selectedChores.length === 0 || isAssigning}
                className={tw(
                  `px-20 py-3 rounded-lg text-white font-semibold text-lg transition-all shadow-lg ${
                    selectedChores.length === 0 || isAssigning
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-500 to-purple-600 hover:opacity-90 hover:shadow-xl transform hover:-translate-y-0.5"
                  }`
                )}
              >
                {isAssigning ? "🚀 Launching..." : "🎯 Launch My Mission"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChoreQuest;