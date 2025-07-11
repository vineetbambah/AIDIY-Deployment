import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tw } from "@twind/core";
import BellIcon from "./BellIcon";
import NotificationsModal from "./NotificationsModal";
import avatarDaughter from "../images/avatar-daughter.png";
import avatarSon from "../images/avatar-son.png";
import aidiyLogo from "../images/aidiy_logo.png";
import { API_BASE_URL } from '../api';

const KidDashboard = () => {
  const navigate = useNavigate();
  const kidNickname = sessionStorage.getItem("kid_nickname") || "";
  const kidAvatar = sessionStorage.getItem("kid_avatar") || "👧";
  const [userProfile, setUserProfile] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [goalForm, setGoalForm] = useState({
    title: "",
    category: "",
    amount: "",
    duration: "",
    description: "",
  });
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeGoals, setActiveGoals] = useState([]);
  const [assignedChores, setAssignedChores] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchUnreadCount = async () => {
  try {
    const token = sessionStorage.getItem('app_token');
    const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUnreadCount(data.count);
  } catch (error) {
    console.error('Error fetching unread count:', error);
  }
};

  // Enhanced total earnings calculation with multiple sources
  const calculateTotalRewards = () => {
    // Source 1: Active goals savings
    const goalEarnings = activeGoals.reduce(
      (sum, goal) => {
        const saved = goal.saved || goal.currentAmount || 0;
        return sum + saved;
      },
      0
    );

    // Source 2: User profile earnings
    const profileEarnings = userProfile?.financial_info?.total_earnings || 0;
    
    // Source 3: Completed chores (if available)
    const choreEarnings = assignedChores
      .filter(chore => chore.status === 'completed' || chore.status === 'approved')
      .reduce((sum, chore) => sum + (chore.reward || 0), 0);

    // Use the highest value to ensure accuracy
    const totalFromGoals = goalEarnings;
    const totalFromProfile = profileEarnings;
    const totalFromChores = choreEarnings;
    
    // Debug logging (can remove in production)
    console.log('💰 Earnings Debug:', {
      goalEarnings,
      profileEarnings,
      choreEarnings,
      activeGoals: activeGoals.length,
      userProfile: !!userProfile
    });

    // Return the maximum to ensure we don't lose any earnings
    return Math.max(totalFromGoals, totalFromProfile, totalFromChores);
  };

  const totalRewards = calculateTotalRewards();

  // Level system configuration
  const LEVEL_CONFIG = {
    threshold: 25,        // Dollars needed per level
    maxDisplayLevel: 999, // Maximum level to display (essentially unlimited)
    minLevel: 1          // Minimum level
  };

  // Calculate current level (unlimited)
  const currentLevel = Math.max(
    LEVEL_CONFIG.minLevel,
    Math.floor(totalRewards / LEVEL_CONFIG.threshold) + 1
  );

  // Calculate progress within current level (0-100%)
  const remainderInLevel = totalRewards % LEVEL_CONFIG.threshold;
  const progressInCurrentLevel = (remainderInLevel / LEVEL_CONFIG.threshold) * 100;

  // Calculate targets for next level
  const currentLevelStart = (currentLevel - 1) * LEVEL_CONFIG.threshold;
  const nextLevelTarget = currentLevel * LEVEL_CONFIG.threshold;
  const amountToNextLevel = nextLevelTarget - totalRewards;

  // Calculate other financial metrics
  const totalSavings = userProfile?.financial_info?.total_savings || totalRewards;
  const investments = userProfile?.financial_info?.investments || 0;

  const completedGoalsCount = activeGoals.filter(g => 
  g.status === 'completed' || (g.saved >= g.amount)
).length;
  const totalGoalsCount = activeGoals.length;

  // Create level badge based on current level
  const getLevelBadge = (level) => {
    if (level >= 50) return "🏆"; // Master
    if (level >= 25) return "💎"; // Diamond
    if (level >= 15) return "🥇"; // Gold
    if (level >= 10) return "🥈"; // Silver
    if (level >= 5) return "🥉";  // Bronze
    return "⭐"; // Beginner
  };

  const getLevelTitle = (level) => {
    if (level >= 50) return "Money Master";
    if (level >= 25) return "Savings Diamond";
    if (level >= 15) return "Gold Earner";
    if (level >= 10) return "Silver Saver";
    if (level >= 5) return "Bronze Builder";
    return "Rising Star";
  };

  const choreCategories = [
    {
      id: 1,
      icon: "💰",
      title: "Money Smarts",
      count: "",
      description: "Learn about saving, budgeting, and investing",
    },
    {
      id: 2,
      icon: "🏠",
      title: "Home Hero",
      count: "",
      description: "Help around the house and learn new skills",
    },
    {
      id: 3,
      icon: "🍳",
      title: "Kitchen Pro",
      count: "",
      description: "Learn to cook and help with meal prep",
    },
    {
      id: 4,
      icon: "🏃",
      title: "Outdoor Champ",
      count: "",
      description: "Get active, sports, and outdoor activities",
    },
  ];

  const achievements = [
    {
      id: 1,
      icon: "🏆",
      title: "Skills Mastered",
      level: "Money Smarts",
      stars: 5,
    },
    { id: 2, icon: "🏠", title: "Home Hero", level: "", stars: 4 },
    { id: 3, icon: "🔥", title: "Kitchen Pro", level: "", stars: 3 },
    { id: 4, icon: "🏃", title: "Outdoor Champ", level: "", stars: 5 },
  ];

  useEffect(() => {
    fetchUserData();
    fetchGoals();
    fetchChores();
    fetchNotifications();
  }, []);

  // Check for refresh flag when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        !document.hidden &&
        sessionStorage.getItem("refreshKidDashboard") === "true"
      ) {
        console.log("🔄 Refreshing KidDashboard data...");
        fetchGoals();
        fetchChores();
        sessionStorage.removeItem("refreshKidDashboard");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also check immediately when component mounts
    if (sessionStorage.getItem("refreshKidDashboard") === "true") {
      console.log("🔄 Refreshing KidDashboard data on mount...");
      fetchGoals();
      fetchChores();
      sessionStorage.removeItem("refreshKidDashboard");
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Periodically check for new notifications
  useEffect(() => {
    // Check for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();

      // If there are any unread goal completion or progress approved notifications, refresh goals
      const hasImportantNotifications = notifications.some(
        (notif) =>
          !notif.read &&
          (notif.type === "goal_completed" ||
            notif.type === "progress_approved" ||
            notif.type === "progress_declined")
      );

      if (hasImportantNotifications) {
        fetchGoals();
        fetchChores();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [notifications]);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem("app_token");
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const fetchChores = async () => {
    try {
      const token = sessionStorage.getItem("app_token");
      const response = await fetch(`${API_BASE_URL}/api/chores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAssignedChores(data.chores);
      }
    } catch (error) {
      console.error("Error fetching chores:", error);
    }
  };

  const handleMarkChoreComplete = async (choreId) => {
    try {
      const token = sessionStorage.getItem("app_token");
      const response = await fetch(
        `${API_BASE_URL}/api/chores/${choreId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "completed" }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(
          "🎉 Great job! Your chore has been sent to your parents for approval!"
        );
        fetchChores();
      } else {
        alert(data.error || "Failed to mark chore as complete");
      }
    } catch (error) {
      console.error("Error marking chore complete:", error);
      alert("Failed to mark chore as complete. Please try again.");
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();

    try {
      const token = sessionStorage.getItem("app_token");
      const response = await fetch(`${API_BASE_URL}/api/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(goalForm),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Goal created successfully:", data.goal);
        alert("Your goal has been sent to your parents for approval!");

        // Close the modal and reset form
        setShowGoalModal(false);
        setGoalForm({
          title: "",
          category: "",
          amount: "",
          duration: "",
          description: "",
        });

        // Now actually re-fetch
        fetchGoals();
      } else {
        console.error("Failed to create goal:", data.error);
      }
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("app_token");
    navigate("/");
  };

  const fetchGoals = async () => {
    try {
      console.log("📡 fetchGoals() running…");

      const token = sessionStorage.getItem("app_token");
      const response = await fetch(`${API_BASE_URL}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      console.log("🔍 fetched goals payload:", data);

      if (data.success) {
        setActiveGoals(data.goals);
      } else {
        console.error("Failed to fetch goals:", data.error);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = {
      role: "user",
      content: chatMessage,
      timestamp: new Date().toISOString(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setChatMessage("");
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem("app_token");
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: chatMessage }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
        };
        setChatHistory((prev) => [...prev, aiMessage]);
      } else {
        console.error("AI chat failed:", data.error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = sessionStorage.getItem("app_token");
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

  const tomorrowChores = assignedChores.filter((chore) => {
    const dueDate = new Date(chore.dueDate);
    const now = new Date();
    const diffInDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    return diffInDays === 1 && chore.status !== "completed";
  });

  const handleStartGoal = async (goal) => {
    // Check if this goal already has chores assigned (mission launched)
    if (goal.has_launched_mission || goal.assigned_chore_ids?.length > 0) {
      // Fetch the assigned chores for this goal
      try {
        const token = sessionStorage.getItem("app_token");
        const response = await fetch(
          `${API_BASE_URL}/api/goals/${goal._id || goal.id}/chores`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();

        if (data.success && data.chores.length > 0) {
          // Convert chores to the format expected by WeeklyProgress
          const formattedChores = data.chores.map((chore) => ({
            id: chore.id,
            name: chore.title,
            description: chore.description,
            amount: chore.reward,
            difficulty: chore.difficulty,
            category: chore.category,
            dueDate: chore.dueDate,
          }));

          // Go directly to WeeklyProgress with the assigned chores
          navigate("/weekly-progress", {
            state: {
              selectedChores: formattedChores,
              goal: goal,
            },
          });
        } else {
          // If no chores found, go to ChoreQuest
          navigate("/chore-quest", { state: { goal } });
        }
      } catch (error) {
        console.error("Error fetching goal chores:", error);
        // On error, default to ChoreQuest
        navigate("/chore-quest", { state: { goal } });
      }
    } else {
      // First time - go to ChoreQuest
      navigate("/chore-quest", { state: { goal } });
    }
  };

  return (
    <div
      className={tw("min-h-screen")}
      style={{
        background:
          "linear-gradient(to bottom right, rgba(183, 115, 190, 0.9), rgba(30, 234, 234, 0.9))",
      }}
    >
      {/* Header */}
      <header className={tw("bg-white p-4")}>
        <div className={tw("max-w-7xl mx-auto flex items-center justify-between")}>
          <div
            className={tw("flex items-center space-x-2 cursor-pointer")}
            onClick={() => navigate("/")}
          >
            <img src={aidiyLogo} alt="AiDIY" className="h-16 w-auto" />
          </div>
          <div className={tw("flex items-center gap-3")}>
            <button
              onClick={() => navigate("/chat")}
              className={tw(`
                px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300
                [background:linear-gradient(to_right,_#2dd4bf,_#a855f7)]
                text-white`)}
              title="Open AI Chatbot"
            >
              ✨
            </button>

            <button
              onClick={() => setShowNotifications(true)}
              className={tw("p-2 rounded-full bg-yellow-200 hover:bg-white/30 text-white relative")}
            >
              {unreadCount > 0 && (
                <span className={tw(
                  "absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1",
                  notifications.some(n => n.type === "progress_declined" && !n.read) 
                    ? "animate-pulse" : ""
                )}>
                  {unreadCount}
                </span>
              )}
              <BellIcon size={24} />
            </button>

            <div
              className={tw(`
                flex items-center gap-2 bg-white/20 rounded-full px-3 py-1
                [background:linear-gradient(to_right,_#2dd4bf,_#a855f7)]
                text-white`)}
            >
              <div
                className={tw(
                  "w-8 h-8 rounded-full bg-accent-pink flex items-center justify-center"
                )}
              >
                {(() => {
                  const validAvatar =
                    userProfile?.avatar &&
                    (userProfile.avatar.includes("/static/") ||
                      userProfile.avatar === avatarDaughter ||
                      userProfile.avatar === avatarSon)
                      ? userProfile.avatar
                      : avatarDaughter;

                  return (
                    <img
                      src={validAvatar}
                      alt="User avatar"
                      className="w-6 h-6 object-cover rounded-full"
                    />
                  );
                })()}
              </div>
              <span className={tw("text-white font-medium")}>
                {kidNickname}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className={tw(`
                px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300
                [background:linear-gradient(to_right,_#2dd4bf,_#a855f7)]
                text-white`)}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={tw("max-w-7xl mx-auto px-4 py-6")}>
        <h1 className={tw("text-2xl font-bold text-[#0a2150] mb-6")}>
          Kid dashboard
        </h1>

        {/* Enhanced Welcome Card */}
        <div className={tw("bg-white rounded-2xl shadow-lg p-6 mb-6")}>
          <div className={tw("flex items-center justify-between mb-4")}>
            <div className={tw("flex-1")}>
              <h2 className={tw("text-xl font-bold text-[#0a2150] flex items-center gap-2")}>
                Welcome, {kidNickname}! 👋
                <span className={tw("text-2xl")}>{getLevelBadge(currentLevel)}</span>
              </h2>
              <p className={tw("text-[#0a2150] mb-1")}>
                Journey unlocked! Let's boost your money smarts!
              </p>
              <p className={tw("text-sm text-purple-600 font-semibold")}>
                {getLevelTitle(currentLevel)} - Level {currentLevel}
              </p>
            </div>
            
            {/* Enhanced Progress Circle */}
            <div className={tw("text-center")}>
              <div className={tw("relative w-28 h-28")}>
                {/* Background circle */}
                <svg className={tw("w-28 h-28 transform -rotate-90")}>
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress circle with animation */}
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${2 * Math.PI * 44 * (1 - progressInCurrentLevel / 100)}`}
                    className={tw("transition-all duration-2000 ease-out")}
                    strokeLinecap="round"
                  />
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#40e0d0" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Center content */}
                <div className={tw("absolute inset-0 flex flex-col items-center justify-center")}>
                  <span className={tw("text-lg font-bold text-purple-600")}>
                    {currentLevel}
                  </span>
                  <span className={tw("text-xs text-gray-500")}>Level</span>
                  <span className={tw("text-sm font-semibold text-gray-700")}>
                    {Math.round(progressInCurrentLevel)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Earnings Summary */}
          <div className={tw("grid grid-cols-3 gap-4")}>
            <div className={tw("bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl p-4 text-center border border-orange-200")}>
              <div className={tw("flex items-center justify-center gap-2 mb-2")}>
                <span className={tw("text-2xl")}>💰</span>
                <span className={tw("text-sm text-gray-600")}>Total Rewards</span>
              </div>
              <p className={tw("text-2xl font-bold text-orange-700")}>
                ${totalRewards.toFixed(2)}
              </p>
            </div>

            <div className={tw("bg-green-100 rounded-xl p-4 text-center")}>
              <div
                className={tw("flex items-center justify-center gap-2 mb-2")}
              >
                <span className={tw("text-2xl")}>🚀</span>
                <span className={tw("text-sm text-gray-600")}>Active Goals</span>

              </div>
              <p className={tw("text-2xl font-bold text-green-700")}>
              {activeGoals.filter(g => g.status === "approved").length}
              </p>
            </div>
            <div className={tw("bg-blue-100 rounded-xl p-4 text-center")}>
              <div
                className={tw("flex items-center justify-center gap-2 mb-2")}
              >
                <span className={tw("text-2xl")}>🏆</span>
                <span className={tw("text-sm text-gray-600")}>Total Goals</span>

              </div>
              <p className={tw("text-2xl font-bold text-blue-700")}>
                {activeGoals.length}
              </p>
            </div>
          </div>

          {/* Enhanced Level Progress Section */}
          <div className={tw("mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200")}>
            <div className={tw("flex items-center justify-between mb-3")}>
              <div className={tw("flex items-center gap-2")}>
                <span className={tw("text-2xl")}>{getLevelBadge(currentLevel)}</span>
                <span className={tw("text-lg font-bold text-purple-700")}>
                  Level {currentLevel} Progress
                </span>
              </div>
              <div className={tw("text-right")}>
                <p className={tw("text-sm text-gray-600")}>
                  ${totalRewards.toFixed(2)} / ${nextLevelTarget}
                </p>
                <p className={tw("text-xs text-purple-600 font-medium")}>
                  ${amountToNextLevel.toFixed(2)} to next level
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className={tw("relative")}>
              <div className={tw("w-full bg-gray-200 rounded-full h-4 overflow-hidden")}>
                <div
                  className={tw("h-4 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full transition-all duration-2000 ease-out relative")}
                  style={{ width: `${Math.max(2, progressInCurrentLevel)}%` }}
                >
                  {/* Animated shimmer effect */}
                  <div className={tw("absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse")} />
                </div>
              </div>
              
              {/* Progress indicators */}
              <div className={tw("flex justify-between text-xs text-gray-500 mt-2")}>
                <span className={tw("font-medium")}>${currentLevelStart}</span>
                <span className={tw("font-bold text-purple-600")}>
                  Next: Level {currentLevel + 1}
                </span>
                <span className={tw("font-medium")}>${nextLevelTarget}</span>
              </div>
            </div>

            {/* Motivational message */}
            <div className={tw("mt-3 text-center")}>
              <p className={tw("text-sm text-gray-600")}>
                {amountToNextLevel <= 5 
                  ? `🔥 Almost there! Just $${amountToNextLevel.toFixed(2)} more!`
                  : amountToNextLevel <= 15
                  ? `💪 You're doing great! $${amountToNextLevel.toFixed(2)} to go!`
                  : `🌟 Keep earning! $${amountToNextLevel.toFixed(2)} until Level ${currentLevel + 1}!`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Create New Goal */}
        <div className={tw("flex justify-start")}>
          <div
            className={tw(
              "w-[50%] h-[170px] bg-gradient-to-r from-blue-500 to-purple-600 rounded-[30px] p-6 mb-6 text-white"
            )}
          >
            <h2 className={tw("text-2xl font-bold mb-2")}>Create a new goal</h2>
            <p className={tw("mb-4")}>& Get Approval from parents</p>
            <button
              onClick={() => setShowGoalModal(true)}
              className={tw(
                "w-12 h-12 bg-white/30 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
              )}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12L19 12"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M12 5L19 12L12 19"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* My Assigned Chores Section */}
        <div className={tw("mb-6")}>
          <h3 className={tw("text-lg font-bold text-[#0a2150] mb-4")}>
            My Assigned Chores
          </h3>
          {assignedChores.filter((chore) => !chore.assigned_goal_id).length === 0 ? (
            <div className={tw("bg-white rounded-2xl shadow-lg p-8 text-center")}>
              <div className={tw("text-4xl mb-4")}>📋</div>
              <p className={tw("text-gray-600")}>
                No standalone chores assigned! Check your goals for chores.
              </p>
            </div>
          ) : (
            <div className={tw("grid grid-cols-1 md:grid-cols-2 gap-4")}>
              {assignedChores
                .filter((chore) => !chore.assigned_goal_id) // Only show chores not assigned to goals
                .map((chore) => {
                  const dueDate = new Date(chore.dueDate);
                  const daysUntilDue = Math.ceil(
                    (dueDate - new Date()) / (1000 * 60 * 60 * 24)
                  );
                  const isPending = chore.status === "pending_approval";
                  const isCompleted = chore.status === "completed" || isPending;

                  return (
                    <div
                      key={chore.id}
                      className={tw(
                        `bg-white rounded-xl p-6 shadow-lg border-2 ${
                          isPending
                            ? "border-yellow-400 bg-yellow-50"
                            : isCompleted
                            ? "border-green-400 bg-green-50"
                            : daysUntilDue <= 2
                            ? "border-red-400"
                            : "border-gray-200"
                        }`
                      )}
                    >
                      <div className={tw("flex items-start justify-between mb-4")}>
                        <div className={tw("flex-1")}>
                          <h4 className={tw("text-lg font-bold text-gray-800 mb-2")}>
                            {chore.title}
                          </h4>
                          <p className={tw("text-sm text-gray-600 mb-3")}>
                            {chore.description}
                          </p>

                          <div className={tw("flex items-center gap-4 text-sm text-gray-600 mb-3")}>
                            <span className={tw("flex items-center gap-1")}>
                              <span>📂</span> {chore.category}
                            </span>
                            <span className={tw("flex items-center gap-1")}>
                              <span>⏰</span>{" "}
                              {daysUntilDue > 0
                                ? `${daysUntilDue} days left`
                                : "Overdue!"}
                            </span>
                          </div>

                          <div className={tw("flex items-center justify-between")}>
                            <div className={tw("text-2xl font-bold text-green-600")}>
                              💰 ${chore.reward.toFixed(2)}
                            </div>
                            {isPending ? (
                              <span
                                className={tw(
                                  "px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium"
                                )}
                              >
                                ⏳ Waiting for approval
                              </span>
                            ) : isCompleted ? (
                              <span
                                className={tw(
                                  "px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium"
                                )}
                              >
                                ✅ Completed
                              </span>
                            ) : (
                              <span className={tw("text-sm text-gray-600")}>
                                Assigned
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className={tw(
                            `w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                              isPending
                                ? "bg-yellow-100"
                                : isCompleted
                                ? "bg-green-100"
                                : "bg-gray-100"
                            }`
                          )}
                        >
                          {chore.difficulty === "Easy"
                            ? "⭐"
                            : chore.difficulty === "Medium"
                            ? "⭐⭐"
                            : "⭐⭐⭐"}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Active Goals */}
        <div className={tw("mb-6")}>
          <h3 className={tw("text-lg font-bold text-[#0a2150] mb-4")}>
            Active Goals
          </h3>
          <div className={tw("grid grid-cols-1 md:grid-cols-4 gap-4")}>
            {activeGoals
              .filter((goal) => {
                const progressPercent = Math.min(
                  ((goal.saved || 0) / (goal.amount || 1)) * 100,
                  100
                );
                const isCompleted = progressPercent >= 100;

                // Show completed goals for 24 hours after completion
                if (isCompleted && goal.completed_at) {
                  const completedDate = new Date(goal.completed_at);
                  const now = new Date();
                  const hoursSinceCompletion =
                    (now - completedDate) / (1000 * 60 * 60);
                  return hoursSinceCompletion < 24; // Show for 24 hours
                }

                return !isCompleted; // Show all incomplete goals
              })
              .map((goal) => {
                const progressPercent = Math.min(
                  ((goal.saved || 0) / (goal.amount || 1)) * 100,
                  100
                );
                const isCompleted = progressPercent >= 100;
                const hasLaunchedMission =
                  goal.has_launched_mission ||
                  goal.assigned_chore_ids?.length > 0;

                return (
                  <div
                    key={goal._id || goal.id}
                    className={tw(
                      `bg-white rounded-xl p-4 shadow transition-all duration-300 relative ${
                        isCompleted
                          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 transform scale-105"
                          : goal.status === "approved" ||
                            goal.status === "declined"
                          ? "bg-white-50 border border-blue-200"
                          : "bg-white"
                      }`
                    )}
                  >
                    {isCompleted && (
                      <div
                        className={tw(
                          "absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 animate-bounce"
                        )}
                      >
                        <span className={tw("text-xl")}>🎉</span>
                      </div>
                    )}

                    <div className={tw("flex items-center justify-between mb-2")}>
                      <span className={tw("text-sm font-medium text-[#0a2150]")}>
                        {goal.title}
                      </span>
                      {isCompleted ? (
                        <span
                          className={tw(
                            "text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full font-bold"
                          )}
                        >
                          COMPLETED! 🎉
                        </span>
                      ) : goal.status === "approved" ? (
                        <span
                          className={tw(
                            "text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                          )}
                        >
                          Approved
                        </span>
                      ) : goal.status === "declined" ? (
                        <span
                          className={tw(
                            "text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full"
                          )}
                        >
                          Declined
                        </span>
                      ) : (
                        <span
                          className={tw(
                            "text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full"
                          )}
                        >
                          Approval Pending
                        </span>
                      )}
                    </div>

                    <div className={tw("text-sm text-gray-700 mb-2")}>
                      Save ${goal.amount} for {goal.category || "your goal"}
                    </div>

                    <div
                      className={tw(
                        "flex items-center gap-2 text-xs text-[#0a2150] mb-3"
                      )}
                    >
                      <span>📅 Due in {goal.duration || "N/A"} Weeks</span>
                      <span>💰 Saved: ${(goal.saved || 0).toFixed(2)}</span>
                    </div>

                    {hasLaunchedMission && !isCompleted && (
                      <div
                        className={tw(
                          "text-xs text-purple-600 font-bold mb-2 flex items-center gap-1"
                        )}
                      >
                        <span>🚀</span> Mission Launched
                      </div>
                    )}

                    <div className={tw("mb-2")}>
                      <div
                        className={tw(
                          "flex justify-between text-xs text-[#0a2150]"
                        )}
                      >
                        <span>Progress</span>
                        <span>{progressPercent.toFixed(0)}%</span>
                      </div>
                      <div
                        className={tw("w-full bg-gray-200 rounded-full h-2")}
                      >
                        <div
                          className={tw(
                            `h-2 rounded-full transition-all duration-1000 ${
                              isCompleted
                                ? "bg-gradient-to-r from-green-400 to-emerald-600"
                                : "bg-gradient-to-r from-primary-turquoise to-accent-purple"
                            }`
                          )}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <button
                      disabled={goal.status !== "approved" || isCompleted}
                      onClick={() => handleStartGoal(goal)}
                      className={tw(
                        `w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          isCompleted
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-default"
                            : goal.status === "approved"
                            ? hasLaunchedMission
                              ? "bg-purple-500 text-white hover:bg-purple-600"
                              : "bg-primary-turquoise text-white hover:bg-primary-turquoise-dark"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                        }`
                      )}
                    >
                      {isCompleted
                        ? "🎊 Goal Achieved! 🎊"
                        : hasLaunchedMission
                        ? "Continue Mission"
                        : "Start"}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>

{/* Achievement Badges Section */}
{(completedGoalsCount > 0 || totalGoalsCount >= 3 || totalRewards >= 50 || currentLevel >= 10) && (
  <div className={tw("mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200")}>
    <h4 className={tw("text-lg font-bold text-gray-800 mb-3 flex items-center gap-2")}>
      <span>🏆</span> My Achievements
    </h4>
    <div className={tw("flex flex-wrap gap-3")}>
      {completedGoalsCount >= 1 && (
        <div className={tw("bg-yellow-100 border border-yellow-300 rounded-2xl px-4 py-2 flex items-center gap-2")}>
          <span className={tw("text-2xl")}>🥇</span>
          <div>
            <div className={tw("font-semibold text-yellow-800")}>Goal Getter</div>
            <div className={tw("text-xs text-yellow-700")}>
              Completed {completedGoalsCount} goal{completedGoalsCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
      {totalGoalsCount >= 3 && (
        <div className={tw("bg-blue-100 border border-blue-300 rounded-2xl px-4 py-2 flex items-center gap-2")}>
          <span className={tw("text-2xl")}>🎯</span>
          <div>
            <div className={tw("font-semibold text-blue-800")}>Dream Builder</div>
            <div className={tw("text-xs text-blue-700")}>
              Created {totalGoalsCount} goals
            </div>
          </div>
        </div>
      )}
      {totalRewards >= 50 && (
        <div className={tw("bg-green-100 border border-green-300 rounded-2xl px-4 py-2 flex items-center gap-2")}>
          <span className={tw("text-2xl")}>💰</span>
          <div>
            <div className={tw("font-semibold text-green-800")}>Money Maker</div>
            <div className={tw("text-xs text-green-700")}>
              Earned ${totalRewards.toFixed(2)}
            </div>
          </div>
        </div>
      )}
      {currentLevel >= 10 && (
        <div className={tw("bg-purple-100 border border-purple-300 rounded-2xl px-4 py-2 flex items-center gap-2")}>
          <span className={tw("text-2xl")}>🌟</span>
          <div>
            <div className={tw("font-semibold text-purple-800")}>Level Master</div>
            <div className={tw("text-xs text-purple-700")}>
              Reached Level {currentLevel}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)}

        {/* Chore Categories */}
        <div className={tw("mb-6")}>
          <h3 className={tw("text-lg font-bold text-[#0a2150] mb-4")}>
            Chore Categories
          </h3>
          <div className={tw("grid grid-cols-2 md:grid-cols-4 gap-4")}>
            {choreCategories.map((category) => (
              <div
                key={category.id}
                className={tw(
                  "bg-white rounded-xl p-4 shadow hover:shadow-lg transition-shadow cursor-pointer"
                )}
              >
                <div className={tw("text-3xl mb-2")}>{category.icon}</div>
                <h4 className={tw("font-semibold text-[#0a2150] mb-1")}>
                  {category.title}
                </h4>
                <p className={tw("text-xs text-[#0a2150] mb-2")}>
                  {category.description}
                </p>
                <span
                  className={tw("text-2xl font-bold text-primary-turquoise")}
                >
                  {category.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Gallery */}
        <div className={tw("bg-white rounded-2xl shadow-lg p-6")}>
          <h3 className={tw("text-lg font-bold text-[#0a2150] mb-4")}>
            Achievement Gallery
          </h3>
          <div className={tw("space-y-3")}>
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={tw(
                  "flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                )}
              >
                <div className={tw("flex items-center gap-3")}>
                  <div
                    className={tw(
                      "w-12 h-12 bg-gradient-to-r from-primary-turquoise to-accent-purple rounded-full flex items-center justify-center text-2xl"
                    )}
                  >
                    {achievement.icon}
                  </div>
                  <div>
                    <h4 className={tw("font-semibold text-[#0a2150]")}>
                      {achievement.title}
                    </h4>
                    {achievement.level && (
                      <p className={tw("text-xs text-[#0a2150]")}>
                        {achievement.level}
                      </p>
                    )}
                  </div>
                </div>
                <div className={tw("flex gap-1")}>
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={tw(
                        i < achievement.stars
                          ? "text-yellow-400"
                          : "text-gray-300"
                      )}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Streak */}
        <div
          className={tw(
            "mt-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white text-center"
          )}
        >
          <h3 className={tw("text-2xl font-bold mb-2")}>Current Streak</h3>
          <p className={tw("text-5xl font-bold mb-2")}>5 Days</p>
          <p className={tw("text-lg")}>🔥 Keep it up!</p>
          <p className={tw("text-sm opacity-90")}>
            Keep it up! You're maintaining 5 days streak!
          </p>
        </div>
      </div>

      {/* Goal Creation Modal */}
{showGoalModal && (
  <div
    className={tw(
      "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    )}
  >
    <div
      className={tw("bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col")}
    >
      <div
        className={tw(
          "bg-gradient-to-r from-purple-400 to-pink-400 p-6 rounded-t-2xl text-white text-center flex-shrink-0"
        )}
      >
        <h3 className={tw("text-2xl font-bold mb-2")}>CREATE A GOAL!</h3>
        <p className={tw("text-sm opacity-90")}>
          What Amazing Thing Do You Want To Save For?
        </p>
      </div>

      <div className={tw("flex-1 overflow-y-auto")}>
        <form onSubmit={handleCreateGoal} className={tw("p-6")}>
          <div className={tw("mb-4")}>
            <label
              className={tw(
                "flex items-center gap-2 text-gray-700 font-medium mb-2"
              )}
            >
              <span className={tw("text-xl")}>🎯</span> My Dream Goal?
            </label>
            <input
              type="text"
              value={goalForm.title}
              onChange={(e) =>
                setGoalForm({ ...goalForm, title: e.target.value })
              }
              placeholder="Type Your Dream Here"
              className={tw(
                "w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400"
              )}
              required
            />
          </div>

          <div className={tw("grid grid-cols-3 gap-3 mb-4")}>
            <button
              type="button"
              onClick={() => setGoalForm({ ...goalForm, category: "bike" })}
              className={tw(
                `p-3 rounded-lg border-2 ${
                  goalForm.category === "bike"
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200"
                }`
              )}
            >
              <span className={tw("text-2xl")}>🚲</span>
              <p className={tw("text-xs mt-1")}>New bike</p>
            </button>
            <button
              type="button"
              onClick={() => setGoalForm({ ...goalForm, category: "game" })}
              className={tw(
                `p-3 rounded-lg border-2 ${
                  goalForm.category === "game"
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200"
                }`
              )}
            >
              <span className={tw("text-2xl")}>🎮</span>
              <p className={tw("text-xs mt-1")}>Video Game</p>
            </button>
            <button
              type="button"
              onClick={() =>
                setGoalForm({ ...goalForm, category: "soccer" })
              }
              className={tw(
                `p-3 rounded-lg border-2 ${
                  goalForm.category === "soccer"
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200"
                }`
              )}
            >
              <span className={tw("text-xl")}>⚽</span>
              <p className={tw("text-xs mt-1")}>Soccer Ball</p>
            </button>
          </div>

          <div className={tw("grid grid-cols-3 gap-3 mb-4")}>
            <button
              type="button"
              onClick={() => setGoalForm({ ...goalForm, category: "art" })}
              className={tw(
                `p-3 rounded-lg border-2 ${
                  goalForm.category === "art"
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200"
                }`
              )}
            >
              <span className={tw("text-2xl")}>🎨</span>
              <p className={tw("text-xs mt-1")}>Art Supplies</p>
            </button>
            <button
              type="button"
              onClick={() => setGoalForm({ ...goalForm, category: "book" })}
              className={tw(
                `p-3 rounded-lg border-2 ${
                  goalForm.category === "book"
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200"
                }`
              )}
            >
              <span className={tw("text-2xl")}>📚</span>
              <p className={tw("text-xs mt-1")}>Book Collection</p>
            </button>
            <button
              type="button"
              onClick={() => setGoalForm({ ...goalForm, category: "toy" })}
              className={tw(
                `p-3 rounded-lg border-2 ${
                  goalForm.category === "toy"
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200"
                }`
              )}
            >
              <span className={tw("text-2xl")}>🧸</span>
              <p className={tw("text-xs mt-1")}>Toy</p>
            </button>
          </div>

          <div className={tw("mb-4")}>
            <label className={tw("block text-gray-700 font-medium mb-2")}>
              Describe your motivation
            </label>
            <textarea
              value={goalForm.description}
              onChange={(e) =>
                setGoalForm({ ...goalForm, description: e.target.value })
              }
              placeholder="Why do you want this?"
              className={tw(
                "w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400"
              )}
              rows="3"
            />
          </div>

          <div className={tw("mb-4")}>
            <label
              className={tw(
                "flex items-center gap-2 text-gray-700 font-medium mb-2"
              )}
            >
              <span className={tw("text-xl")}>💰</span> How Much Money?
            </label>
            <div className={tw("relative")}>
              <span
                className={tw(
                  "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                )}
              >
                $
              </span>
              <input
                type="number"
                value={goalForm.amount}
                onChange={(e) =>
                  setGoalForm({ ...goalForm, amount: e.target.value })
                }
                placeholder="00"
                className={tw(
                  "w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400"
                )}
                required
              />
            </div>
          </div>

          <div className={tw("mb-6")}>
            <label
              className={tw(
                "flex items-center gap-2 text-gray-700 font-medium mb-2"
              )}
            >
              <span className={tw("text-xl")}>📅</span> How Many Weeks?
            </label>
            <select
              value={goalForm.duration}
              onChange={(e) =>
                setGoalForm({ ...goalForm, duration: e.target.value })
              }
              className={tw(
                "w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 appearance-none bg-white"
              )}
              required
            >
              <option value="">Pick your timeline!</option>
              <option value="5">🏃 5 weeks ( Super fast )</option>
              <option value="10">🚶 10 weeks ( Steady pace )</option>
              <option value="15">🐢 15 weeks ( Take your time )</option>
              <option value="20">🐌 20 weeks ( Slow and steady )</option>
            </select>
          </div>

          <div className={tw("flex gap-4 sticky bottom-0 bg-white pt-4")}>
            <button
              type="button"
              onClick={() => setShowGoalModal(false)}
              className={tw(
                "flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 transition-colors"
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={tw(
                "flex-1 px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              )}
            >
              Get Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
      {/* AI Chat Modal */}
      {showChatModal && (
        <div
          className={tw(
            "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          )}
        >
          <div
            className={tw(
              "bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col"
            )}
          >
            <div
              className={tw(
                "bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark p-4 rounded-t-2xl flex items-center justify-between text-white"
              )}
            >
              <h3 className={tw("text-xl font-bold")}>AI Assistant</h3>
              <button
                onClick={() => setShowChatModal(false)}
                className={tw("text-2xl hover:opacity-80")}
              >
                ✕
              </button>
            </div>

            <div className={tw("flex-1 overflow-y-auto p-4 space-y-4")}>
              {chatHistory.length === 0 && (
                <div className={tw("text-center text-gray-500 mt-8")}>
                  <p className={tw("text-lg mb-2")}>
                    Hi! I'm your AI assistant 🤖
                  </p>
                  <p className={tw("text-sm")}>
                    Ask me anything about saving money, chores, or your goals!
                  </p>
                </div>
              )}
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={tw(
                    `flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`
                  )}
                >
                  <div
                    className={tw(
                      `max-w-[80%] p-3 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-primary-turquoise to-accent-purple text-white"
                          : "bg-gray-100 text-gray-800"
                      }`
                    )}
                  >
                    <p className={tw("text-sm")}>{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className={tw("flex justify-start")}>
                  <div className={tw("bg-gray-100 p-3 rounded-2xl")}>
                    <div className={tw("flex space-x-2")}>
                      <div
                        className={tw(
                          "w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        )}
                      ></div>
                      <div
                        className={tw(
                          "w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"
                        )}
                      ></div>
                      <div
                        className={tw(
                          "w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"
                        )}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={tw("p-4 border-t")}>
              <div className={tw("flex gap-2")}>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask me anything..."
                  className={tw(
                    "flex-1 px-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary-turquoise"
                  )}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !chatMessage.trim()}
                  className={tw(
                    `px-6 py-2 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-full hover:shadow-lg transform hover:-translate-y-0.5 transition-all ${
                      isLoading || !chatMessage.trim()
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`
                  )}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNotifications && (
        <NotificationsModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          notifications={notifications}
            refreshUnreadCount={fetchUnreadCount}

        />
      )}
    </div>
  );
};

export default KidDashboard;