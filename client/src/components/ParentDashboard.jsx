import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { tw } from "@twind/core";
import BellIcon from "./BellIcon";
import AIAvatar from "./AIAvatar";
import NotificationsModal from "./NotificationsModal";
import progressIcon from "../images/progress-tracking.png";
import caughtUpIcon from "../images/caught-up.png";
import choresIcon from "../images/chore-manage.png";
import parentAvatar from "../images/avatar-parents.png"; // adjust path as needed
import avatarDaughter from "../images/avatar-daughter.png";
import avatarSon from "../images/avatar-son.png";
import aidiyLogo from "../images/aidiy_logo.png";
import aiPowered from "../images/ai-powered.png";
import { API_BASE_URL } from '../api';

const tokenHeader = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("app_token")}`,
});

// Helper function to get valid avatar for children
const getValidChildAvatar = (avatar) => {
  return avatar && (
    avatar.includes('/static/') || 
    avatar === avatarDaughter || 
    avatar === avatarSon
  ) ? avatar : avatarDaughter;
};

const ParentDashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("goal-requests");
  const [userProfile, setUserProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [goals, setGoals] = useState([]);
  const [childrenProgress, setChildrenProgress] = useState([]);
  const [childrenChores, setChildrenChores] = useState([]);
  const [chores, setChores] = useState([]);
  const [choreRecommendations, setChoreRecommendations] = useState([]);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);


  const addChore = (c) => setChores((prev) => [...prev, c]);
  const patchChore = (c) =>
    setChores((prev) => prev.map((x) => (x.id === c.id ? c : x)));
  const removeChore = (id) =>
    setChores((prev) => prev.filter((x) => x.id !== id));

  useEffect(() => {
    fetchUserData();
    fetchNotifications();
    fetchGoals();
    fetchChildrenProgress();
    fetchChildrenChores();
    fetchChores();
    fetchChoreRecommendations();
  }, []);

  useEffect(() => {
    const close = (e) =>
      !e.target.closest(".user-menu-container") && setShowUserMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

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

  const fetchUserData = async () => {
    try {
      const [profileRes, childrenRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: tokenHeader(),
        }),
        fetch(`${API_BASE_URL}/api/users/children`, {
          headers: tokenHeader(),
        }),
      ]);
      const [profileData, childrenData] = await Promise.all([
        profileRes.json(),
        childrenRes.json(),
      ]);
      if (profileData.success) setUserProfile(profileData.user);
      if (childrenData.success) setChildren(childrenData.children);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: tokenHeader(),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/parent/goals`, {
        headers: tokenHeader(),
      });
      const data = await res.json();
      if (data.success) setGoals(data.goals);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChildrenProgress = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/parent/children-progress`,
        { headers: tokenHeader() }
      );
      const data = await res.json();
      if (data.success) setChildrenProgress(data.children);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChildrenChores = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/parent/children-chores`,
        { headers: tokenHeader() }
      );
      const data = await res.json();
      if (data.success) setChildrenChores(data.children);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChores = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chores`, {
        headers: tokenHeader(),
      });
      const data = await res.json();
      if (data.success) {
        const choresData = data.chores.map((chore) => {
          chore.assignedTo = chore.kid_username
            ? chore.kid_username
            : "Unassigned";
          return chore;
        });
        setChores(choresData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChoreRecommendations = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/chores/recommendations`,
        { headers: tokenHeader() }
      );
      const data = await res.json();
      if (data.success) setChoreRecommendations(data.recommendations);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveGoal = async (goalId) => {
    try {
      const token = sessionStorage.getItem("app_token");
      const response = await fetch(
        `${API_BASE_URL}/api/goals/${goalId}/approve`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        alert("Goal approved successfully!");
        fetchNotifications();
        fetchGoals();

        // Find the goal to get its duration for scheduling
        const goal = goals.find(g => g._id === goalId);
        if (goal) {
          // Schedule deadline check
          setTimeout(() => {
            checkGoalDeadline(goalId);
          }, goal.duration * 7 * 24 * 60 * 60 * 1000); // duration in weeks to ms
        }
      }
    } catch (error) {
      console.error("Failed to approve goal:", error);
    }
  };

  // Add deadline checking function
  const checkGoalDeadline = async (goalId) => {
    try {
      const token = sessionStorage.getItem("app_token");
      const response = await fetch(
        `${API_BASE_URL}/api/goals/${goalId}/approve`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        alert("Goal approved successfully!");
        fetchNotifications();
        fetchGoals();
      }
    } catch (error) {
      console.error("Failed to approve goal:", error);
    }
  };

  const handleDeclineGoal = async (goalId) => {
    try {
      const token = sessionStorage.getItem('app_token');
      const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}/decline`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('Goal declined.');
        fetchNotifications();
        fetchGoals();
      }
    } catch (error) {
      console.error('Failed to decline goal:', error);
    }
  };

  // Add progress approval handler
 const handleApproveProgress = async (submissionId) => {
    try {
      const token = sessionStorage.getItem('app_token');
      const response = await fetch(`${API_BASE_URL}/api/progress/${submissionId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Progress approved! Earnings added to child\'s goal.');
        fetchNotifications();
        fetchGoals();
        fetchChildrenProgress();
      }
    } catch (error) {
      console.error('Failed to approve progress:', error);
    }
  };

  // Add progress decline handler
// ParentDashboard.jsx
const handleDeclineProgress = async (notificationId, goalTitle) => {
  try {
    const token = sessionStorage.getItem('app_token');

    // 1. Call backend to decline progress
    const response = await fetch(
      `${API_BASE_URL}/api/progress/${notificationId}/decline`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();

    if (data.success) {
      // 2. Build kid-friendly notification
      const notificationMessage = `Oh no! 😢 Your chore progress for "${goalTitle}" wasn't approved. ${data.message || "Let's try again!"}`;

      const newNotification = {
  user_id: data.kid_id,
  title: "Chore Needs Redo",   // Or "Chore Needs Improvement"
  message: notificationMessage,
  type: "progress_declined",
  goal_title: goalTitle,              // ← Make sure this is set!
  related_goal_id: data.goal_id,
  reassigned_chore_ids: data.reassigned_chore_ids,
};


      // 3. Send notification to backend
      await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newNotification),
      });

      // 4. Refresh notifications in UI
      fetchNotifications();
    } else {
      // Optional: handle error in response
      console.error('Decline failed:', data.message);
    }
  } catch (error) {
    console.error('Error declining progress:', error);
  }
};


const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem('app_token');
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please select an image smaller than 5MB");
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedImage) return;

    const userMessage = {
      role: "user",
      content: message,
      image: selectedImage,
      timestamp: new Date().toISOString(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem("app_token");
      const requestBody = { message: message };

      if (selectedImage) {
        requestBody.image = selectedImage.split(",")[1];
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
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
        alert("Failed to get AI response. Please try again.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/wav";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
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
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        alert("Recording error occurred. Please try again.");
        setIsRecording(false);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      console.log("Recording started with MIME type:", mimeType);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      if (error.name === "NotAllowedError") {
        alert(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else if (error.name === "NotFoundError") {
        alert(
          "No microphone found. Please connect a microphone and try again."
        );
      } else {
        alert("Unable to access microphone. Error: " + error.message);
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
    const mimeType = audioBlob.type;
    let extension = "webm";
    if (mimeType.includes("mp4")) {
      extension = "mp4";
    } else if (mimeType.includes("wav")) {
      extension = "wav";
    }

    const formData = new FormData();
    formData.append("audio", audioBlob, `recording.${extension}`);

    try {
      const token = sessionStorage.getItem("app_token");
      console.log(
        "Sending audio to server, size:",
        audioBlob.size,
        "type:",
        audioBlob.type
      );

      const response = await fetch(
        `${API_BASE_URL}/api/ai/speech-to-text`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        setMessage(data.text);
        console.log("Speech to text successful:", data.text);
      } else {
        console.error("Speech to text failed:", data.error);
        alert("Failed to convert speech to text. Please try again.");
      }
    } catch (error) {
      console.error("Error sending audio:", error);
      alert("Failed to send audio to server. Please try again.");
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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

      <header className={tw("bg-white")}>
  <div className={tw("max-w-7xl mx-auto flex items-center justify-between")}>
    <div
      className={tw("flex items-center space-x-2 cursor-pointer")}
      onClick={() => navigate("/")}
    >
      <img src={aidiyLogo} alt="AiDIY" className="h-16 w-auto" />
    </div>
    <div className={tw("flex items-center gap-4")}>
      <button
  onClick={() => setShowNotifications(true)}
  className={tw(
    "p-2 rounded-full bg-yellow-300 hover:bg-yellow-400 text-yellow-900 relative"
  )}
>
  <BellIcon size={24} />
  {unreadCount > 0 && (
    <span
      className={tw(
        "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
      )}
    >
      {unreadCount}
    </span>
  )}
</button>


      <div className="user-menu-container relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            background: "linear-gradient(to right, #2dd4bf, #a855f7)",
            borderRadius: "10px",
            // border: "1px solid black",
            color: "white",
          }}
          className={tw("flex items-center gap-2 px-3 py-1 transition-colors")}
        >
          <div className={tw("w-8 h-8 rounded-full overflow-hidden")}>
            <img
              src={parentAvatar}
              alt="Parent Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          {/* <span className={tw("font-medium")}>
            {userProfile?.firstName || "Sarah"}
          </span> */}
          <span className={tw("font-medium")}>Parents</span>
        </button>

        {showUserMenu && (
          <div
            className={tw(
              "absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
            )}
          >
            <button
              onClick={() => {
                setShowUserMenu(false);
                navigate("/profile");
              }}
              style={{
                background: "linear-gradient(to right, #2dd4bf, #a855f7)",
                borderRadius: "10px",
                // border: "1px solid black",
                color: "white",
              }}
              className={tw(
                "w-full px-4 py-2 text-left flex items-center gap-3"
              )}
            >
              <svg
                className={tw("w-5 h-5 text-black")}
                fill="none"
                stroke="white"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              View Profile
            </button>

            <hr className={tw("my-2 border-gray-200")} />

            <button
              onClick={() => {
                setShowUserMenu(false);
                handleLogout();
              }}
              style={{
                background: "linear-gradient(to right, #2dd4bf, #a855f7)",
                borderRadius: "10px",
                // border: "1px solid black",
                color: "white",
              }}
              className={tw(
                "w-full px-4 py-2 text-left flex items-center gap-3 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              )}
            >
              <svg
                className={tw("w-5 h-5")}
                fill="none"
                stroke="white"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleLogout}
        style={{
          background: "linear-gradient(to right, #2dd4bf, #a855f7)",
          borderRadius: "10px",
          // border: "1px solid black",
          color: "white",
        }}
        className={tw(
          "px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-300"
        )}
      >
        Sign Out
      </button>
    </div>
  </div>
</header>


      <div className={tw("max-w-7xl mx-auto px-4 py-6")}>
        <div className={tw("text-center mb-8")}>
          <h1 className={tw("text-3xl font-bold text-[#0a2150]")}>
            Parent Dashboard
          </h1>
          <p className={tw("text-lg text-[#0a2150]")}>
            Watch Them Grow Life-Ready.
          </p>
        </div>

        <div className={tw("flex justify-center mb-8")}>
          <div
            className={tw(
              "inline-flex items-center bg-gray-100 rounded-2xl p-1"
            )}
          >
            <button
              onClick={() => setActiveTab("goal-requests")}
              className={tw(
                `px-20 py-4 rounded-xl font-semibold transition-all duration-300 text-sm ${
                  activeTab === "goal-requests"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`
              )}
            >
              <span className={tw("flex items-center gap-2 text-[#0a2150]")}>
                <span>🔔</span>
                Goal Requests
                {unreadCount > 0 && (
                  <span
                    className={tw(
                      "bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1"
                    )}
                  >
                    {unreadCount}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("progress-tracking")}
              className={tw(
                `px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm ${
                  activeTab === "progress-tracking"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`
              )}
            >
              <span className="flex items-center gap-2 text-[#0a2150]">
                <img src={progressIcon} alt="Progress" className="w-5 h-5" />
                Progress Tracking
              </span>
            </button>
            <button
              onClick={() => setActiveTab("chore-management")}
              className={tw(
                `px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm ${
                  activeTab === "chore-management"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`
              )}
            >
              <span className={tw("flex items-center gap-2 text-[#0a2150]")}>
                <img src={choresIcon} alt="Chores" className="w-6 h-7" />
                Chore Management
              </span>
            </button>
          </div>
        </div>

        <div className={tw("bg-white rounded-3xl shadow-xl p-8 mb-8")}>
          <div className={tw("flex justify-center mb-6")}>
            <AIAvatar size="large" animated={true} />
          </div>

          {chatHistory.length > 0 && (
            <div className={tw("mb-4 max-h-96 overflow-y-auto space-y-4")}>
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
                      `max-w-3xl p-4 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-primary-turquoise to-accent-purple text-white"
                          : "bg-gray-100 text-gray-800"
                      }`
                    )}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="User upload"
                        className={tw("mb-2 rounded-lg max-h-40")}
                      />
                    )}
                    <p className={tw("whitespace-pre-wrap")}>{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className={tw("flex justify-start")}>
                  <div className={tw("bg-gray-100 p-4 rounded-2xl")}>
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
          )}

          <div
            className={tw(
              "relative bg-gray-50 rounded-2xl p-4 border-2 border-gray-200"
            )}
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Guide me AiDIY..."
              className={tw(
                "w-full bg-transparent resize-none outline-none text-gray-700 placeholder-gray-400 min-h-[60px]"
              )}
              rows="2"
              disabled={isLoading}
            />

            {selectedImage && (
              <div className={tw("mt-2 relative inline-block")}>
                <img
                  src={selectedImage}
                  alt="Upload"
                  className={tw("h-20 rounded-lg")}
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className={tw(
                    "absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                  )}
                >
                  ✕
                </button>
              </div>
            )}

            <div className={tw("flex items-center justify-between mt-2")}>
              <div className={tw("flex items-center gap-2")}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={tw(
                    "p-2 rounded-full hover:bg-gray-200 text-gray-600"
                  )}
                  disabled={isLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 2L10 10M10 10L10 18M10 10L18 10M10 10L2 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={tw("hidden")}
                />
                <button
                  onClick={handleVoiceRecord}
                  className={tw(
                    `p-2 rounded-full hover:bg-gray-200 ${
                      isRecording
                        ? "text-red-500 animate-pulse"
                        : "text-gray-600"
                    }`
                  )}
                  disabled={isLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect
                      x="7"
                      y="4"
                      width="6"
                      height="10"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M4 10C4 10 4 14 10 14C16 14 16 10 16 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10 14V18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {isRecording && (
                  <span className={tw("text-sm text-red-500")}>
                    Recording...
                  </span>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || (!message.trim() && !selectedImage)}
                className={tw(
                  `px-6 py-2 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all ${
                    isLoading || (!message.trim() && !selectedImage)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`
                )}
              >
                {isLoading ? "Sending..." : "Guide me"}
              </button>
            </div>
          </div>
        </div>

        {activeTab === "goal-requests" && (
          <GoalRequestsTab
            goals={goals}
            notifications={notifications}
            onApprove={handleApproveGoal}
            onDecline={handleDeclineGoal}
          />
        )}

        {activeTab === "progress-tracking" && (
          <ProgressTrackingTab
            childrenProgress={childrenProgress}
            childrenChores={childrenChores}
          />
        )}

        {activeTab === "chore-management" && (
          <ChoreManagementTab
            chores={chores}
            recommendations={choreRecommendations}
            setChoreRecommendations={setChoreRecommendations}
            children={children}
            onAddChore={addChore}
            onUpdateChore={patchChore}
            onDeleteChore={removeChore}
            message={message}
            setMessage={setMessage}
            chatHistory={chatHistory}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>

      {showNotifications && (
        <NotificationsModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          notifications={notifications}
          onApproveGoal={handleApproveGoal}
          onDeclineGoal={handleDeclineGoal}
          onApproveProgress={handleApproveProgress} // Add this
          onDeclineProgress={handleDeclineProgress} // Add this
          refreshUnreadCount={fetchUnreadCount}
        />
      )}
    </div>
  );
};

const GoalRequestsTab = ({ goals, notifications, onApprove, onDecline }) => {
  const pendingGoals = goals.filter((g) => g.status === "pending_approval");

  return (
    <div className={tw("space-y-6")}>
      <div
        className={tw(
          "bg-white rounded-3xl shadow-lg p-6 border border-gray-100"
        )}
      >
        <div className={tw("flex items-center justify-between")}>
          <div>
            <h2 className={tw("text-2xl font-bold text-[#0a2150]")}>
              Goal Requests
            </h2>
            <p className={tw("text-[#0a2150]")}>
              You’ve Got a Life Skills Champ in the Making.
            </p>
          </div>
          <div className={tw("flex items-center gap-4")}>
            <div className={tw("text-center")}>
              <div className={tw("text-3xl font-bold text-orange-500")}>
                {pendingGoals.length}
              </div>
              <div className={tw("text-sm text-gray-600")}>Pending</div>
            </div>
            <div className={tw("text-center")}>
              <div className={tw("text-3xl font-bold text-green-500")}>
                {goals.filter((g) => g.status === "approved").length}
              </div>
              <div className={tw("text-sm text-gray-600")}>Approved</div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={tw(
          "bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
        )}
      >
        {pendingGoals.length === 0 ? (
          <div className={tw("text-center py-16")}>
            <div
              className={tw(
                "w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
              )}
            >
              <img src={caughtUpIcon} alt="Caught up" className="w-12 h-12" />
            </div>
            <h3 className={tw("text-lg font-semibold text-[#0a2150] mb-2")}>
              All caught up!
            </h3>
            <p className={tw("text-[#0a2150]")}>
              No pending goal requests at the moment
            </p>
          </div>
        ) : (
          <div className={tw("divide-y divide-gray-100")}>
            {pendingGoals.map((goal, index) => (
              <div
                key={goal._id}
                className={tw("p-6 hover:bg-gray-50 transition-colors")}
              >
                <div className={tw("flex items-start gap-4")}>
                  <div
                    className={tw(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg overflow-hidden"
                    )}
                  >
                    <img
                      src={getValidChildAvatar(goal.kid_avatar)}
                      alt={`${goal.kid_name} avatar`}
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  </div>

                  <div className={tw("flex-1 min-w-0")}>
                    <div
                      className={tw("flex items-start justify-between mb-3")}
                    >
                      <div>
                        <h3
                          className={tw("text-xl font-bold text-gray-900 mb-1")}
                        >
                          {goal.kid_name} wants to save for {goal.title}
                        </h3>
                        <p className={tw("text-gray-600 mb-3")}>
                          {goal.description ||
                            `I want to buy a ${goal.title} to help with my daily activities`}
                        </p>
                      </div>
                      <div
                        className={tw(
                          "flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium"
                        )}
                      >
                        <div
                          className={tw("w-2 h-2 bg-yellow-500 rounded-full")}
                        ></div>
                        Pending Review
                      </div>
                    </div>

                    <div className={tw("flex items-center gap-6 mb-4")}>
                      <div className={tw("flex items-center gap-2 text-sm")}>
                        <span className={tw("text-gray-500")}>💰</span>
                        <span className={tw("font-semibold text-gray-900")}>
                          ${goal.amount}
                        </span>
                        <span className={tw("text-gray-500")}>target</span>
                      </div>
                      <div className={tw("flex items-center gap-2 text-sm")}>
                        <span className={tw("text-gray-500")}>📅</span>
                        <span className={tw("text-gray-700")}>
                          {goal.duration || "8"} weeks
                        </span>
                      </div>
                      <div className={tw("flex items-center gap-2 text-sm")}>
                        <span className={tw("text-gray-500")}>📚</span>
                        <span className={tw("text-gray-700")}>
                          {goal.category || "Personal"}
                        </span>
                      </div>
                    </div>

                    <div className={tw("flex gap-3")}>
                      <button
                        onClick={() => onApprove(goal._id)}
                        className={tw(
                          "flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg"
                        )}
                      >
                        ✅ Approve Goal
                      </button>
{/* <<<<<<< HEAD
                      <button
                        className={tw(
                          "px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-colors border border-blue-200"
                        )} */}
{/* ======= */}
                      {/* <button
                        className={tw('px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-colors border border-blue-200')}
>>>>>>> d94de3fb74970e10cc36721b375fe09b3409be01
                      >
                        💭 Suggest Changes
                      </button> */}
                      <button
                        onClick={() => onDecline(goal._id)}
                        className={tw(
                          "px-6 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors border border-red-200"
                        )}
                      >
                        ❌ Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProgressTrackingTab = ({ childrenProgress = [], childrenChores = [] }) => {
  // Helper function for avatar
  const getValidChildAvatar = (avatar) => {
    return avatar || '👧';
  };

  // Helper function to format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to calculate days remaining
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    const statusColors = {
      'completed': 'bg-green-100 text-green-700 border-green-200',
      'archived': 'bg-gray-100 text-gray-700 border-gray-200',
      'pending_approval': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'in_progress': 'bg-blue-100 text-blue-700 border-blue-200',
      'Assigned': 'bg-purple-100 text-purple-700 border-purple-200',
      'approved': 'bg-green-100 text-green-700 border-green-200',
      'pending': 'bg-orange-100 text-orange-700 border-orange-200',
      'declined': 'bg-red-100 text-red-700 border-red-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Calculate overall statistics
  const overallStats = React.useMemo(() => {
    const stats = {
      totalKids: childrenChores.length,
      totalCompleted: 0,
      totalPending: 0,
      totalEarned: 0,
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      totalSaved: 0
    };

    childrenChores.forEach(child => {
      stats.totalCompleted += child.chores_completed || 0;
      stats.totalPending += child.chores_pending || 0;
      stats.totalEarned += child.total_earned || 0;
    });

    childrenProgress.forEach(child => {
      if (child.goals) {
        stats.totalGoals += child.goals.length;
        stats.activeGoals += child.active_goals || 0;
        stats.completedGoals += child.completed_goals || 0;
        stats.totalSaved += child.total_saved || 0;
      }
    });

    return stats;
  }, [childrenChores, childrenProgress]);

  // Merge children data
  const mergedChildren = React.useMemo(() => {
    const childMap = new Map();
    
    // Add chores data
    childrenChores.forEach(child => {
      childMap.set(child.username, { ...child });
    });
    
    // Merge progress data
    childrenProgress.forEach(child => {
      const existing = childMap.get(child.username) || {};
      childMap.set(child.username, { ...existing, ...child });
    });
    
    return Array.from(childMap.values());
  }, [childrenChores, childrenProgress]);

  return (
    <div className="space-y-6">
      {/* Overall Statistics Card */}
      <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Progress Overview</h2>
          <p className="text-gray-600 mt-1">Track your children's achievements and earnings</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center border border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">{overallStats.totalKids}</div>
            <div className="text-sm font-medium text-blue-800">Active Kids</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">${overallStats.totalSaved.toFixed(2)}</div>
            <div className="text-sm font-medium text-green-800">Total Earned</div>
          </div>
          {/* <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center border border-purple-200">
            <div className="text-3xl font-bold text-purple-600 mb-1">{overallStats.totalCompleted}</div>
            <div className="text-sm font-medium text-purple-800">Chores Done</div>
          </div> */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 text-center border border-orange-200">
            <div className="text-3xl font-bold text-orange-600 mb-1">{overallStats.activeGoals}</div>
            <div className="text-sm font-medium text-orange-800">Active Goals</div>
          </div>
        </div>
      </div>

      {/* Individual Child Cards */}
      {mergedChildren.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg p-12 text-center border border-gray-100">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">👨‍👩‍👧‍👦</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Children Added Yet</h3>
          <p className="text-gray-600">Add your children to start tracking their progress</p>
        </div>
      ) : (
        mergedChildren.map((child) => {
          const activeGoals = child.goals?.filter(g => g.status === 'approved') || [];
          const completedGoals = child.goals?.filter(g => g.status === 'completed') || [];
          const pendingGoals = child.goals?.filter(g => g.status === 'pending_approval') || [];
          
          return (
          <div key={child.username} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Child Header - CORRECTED AVATAR USAGE */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden">
                    {/* Render avatar as image instead of text */}
                    <img 
                      src={getValidChildAvatar(child.avatar)} 
                      alt={`${child.nickName || child.firstName} avatar`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-white">
                    <h3 className="text-2xl font-bold">{child.nickName || child.firstName}</h3>
                    <p className="text-white/80">@{child.username}</p>
                  </div>
                </div>
                <div className="text-right text-white">
                  <div className="text-3xl font-bold">${(child.total_saved || 0).toFixed(2)}</div>
                  <div className="text-sm text-white/80">Total Earned</div>
                </div>
              </div>
            </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
                {/* <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{child.chores_completed || 0}</div>
                  <div className="text-sm text-gray-600">Chores Done</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{child.chores_pending || 0}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div> */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">${(child.total_saved  || 0).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Earned</div>

                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{activeGoals.length}</div>
                  <div className="text-sm text-gray-600">Active Goals</div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Goals Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🎯</span> Goals Progress
                  </h4>
                  
                  {child.goals && child.goals.length > 0 ? (
                    <div className="space-y-3">
                      {child.goals.map((goal) => {
                        const progress = goal.progress || ((goal.saved || 0) / goal.amount * 100);
                        const isCompleted = goal.status === 'completed';
                        
                        return (
                          <div key={goal._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h5 className="font-semibold text-gray-900">{goal.title}</h5>
                                <p className="text-sm text-gray-600">{goal.category} • {goal.duration} days</p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(goal.status)}`}>
                                {goal.status.replace('_', ' ')}
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium">${(goal.saved || 0).toFixed(2)} / ${goal.amount}</span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${
                                    isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <div className="mt-1 text-right">
                                <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
                              </div>
                            </div>
                            
                            {goal.created_at && (
                              <p className="text-xs text-gray-500 mt-2">
                                Started: {formatDate(goal.created_at)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xl">🎯</span>
                      </div>
                      <p className="text-gray-600">No goals set yet</p>
                    </div>
                  )}
                </div>

                {/* Assigned Chores Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📋</span> Assigned Chores
                  </h4>
                  
                  {child.assigned_chores && child.assigned_chores.length > 0 ? (
                    <div className="space-y-3">
                      {child.assigned_chores.map((chore) => {
                        const daysLeft = getDaysRemaining(chore.dueDate);
                        const isOverdue = daysLeft !== null && daysLeft < 0;
                        
                        return (
                          <div key={chore._id || chore.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-semibold text-gray-900">{chore.title}</h5>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(chore.status)}`}>
                                    {chore.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{chore.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <span>📁</span> {chore.category}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span>⚡</span> {chore.difficulty}
                                  </span>
                                  <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                    <span>📅</span> {formatDate(chore.dueDate)}
                                    {daysLeft !== null && (
                                      <span className={`ml-1 ${isOverdue ? 'text-red-600' : daysLeft <= 3 ? 'text-orange-600' : 'text-gray-600'}`}>
                                        ({isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-xl font-bold text-green-600">${chore.reward}</div>
                                <div className="text-xs text-gray-500">Reward</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xl">📋</span>
                      </div>
                      <p className="text-gray-600">No chores assigned</p>
                    </div>
                  )}
                </div>

                {/* Achievement Badges (if child has achievements) */}
                {(child.completed_goals > 0 || child.chores_completed > 5) && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>🏆</span> Achievements
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {child.completed_goals >= 1 && (
                        <div className="bg-yellow-100 border border-yellow-300 rounded-2xl px-4 py-2 flex items-center gap-2">
                          <span className="text-2xl">🥇</span>
                          <div>
                            <div className="font-semibold text-yellow-800">Goal Getter</div>
                            <div className="text-xs text-yellow-700">Completed {child.completed_goals} goal{child.completed_goals > 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      )}
                      {child.chores_completed >= 5 && (
                        <div className="bg-blue-100 border border-blue-300 rounded-2xl px-4 py-2 flex items-center gap-2">
                          <span className="text-2xl">⭐</span>
                          <div>
                            <div className="font-semibold text-blue-800">Super Helper</div>
                            <div className="text-xs text-blue-700">Completed {child.chores_completed} chores</div>
                          </div>
                        </div>
                      )}
                      {child.total_earned >= 50 && (
                        <div className="bg-green-100 border border-green-300 rounded-2xl px-4 py-2 flex items-center gap-2">
                          <span className="text-2xl">💰</span>
                          <div>
                            <div className="font-semibold text-green-800">Money Maker</div>
                            <div className="text-xs text-green-700">Earned ${child.total_saved.toFixed(2)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

const ChoreManagementTab = ({
  chores,
  recommendations,
  setChoreRecommendations,
  children,
  onAddChore,
  onUpdateChore,
  onDeleteChore,
  message,
  setMessage,
  chatHistory,
  isLoading,
  onSendMessage,
}) => {
  const [activeManagementTab, setActiveManagementTab] =
    useState("manage-chores");
  const [editingChore, setEditingChore] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateChoreModal, setShowCreateChoreModal] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] =
    useState(false);
  const [showAddRecommendationModal, setShowAddRecommendationModal] =
    useState(false);
  const [choreToAdd, setChoreToAdd] = useState(null);

  const [newChore, setNewChore] = useState({
    title: "",
    description: "",
    category: "Cleaning",
    difficulty: "Easy",
    reward: 5,
    dueDate: "",
    assignedTo: "",
  });

  const handleCreateChore = () => setShowCreateChoreModal(true);
  const handleEdit = (c) => {
    setEditingChore(c);
    setShowEditModal(true);
  };

  const handleAdd = (rec) => {
    setChoreToAdd({
      title: rec.title,
      description: rec.description,
      category: rec.category || "Cleaning",
      difficulty: rec.difficulty || "Easy",
      reward: rec.reward || 5,
      dueDate: rec.dueDate || "",
      assignedTo: "",
    });
    setShowAddRecommendationModal(true);
  };

  const handleSaveNewChore = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tokenHeader() },
        body: JSON.stringify(newChore),
      });
      const data = await res.json();
      if (data.success) {
        let createdChore = data.chore;
        createdChore.assignedTo = createdChore.kid_username
          ? createdChore.kid_username
          : "Unassigned";
        onAddChore(createdChore);
        alert("Chore created successfully!");
        setNewChore({
          title: "",
          description: "",
          category: "Cleaning",
          difficulty: "Easy",
          reward: 5,
          dueDate: "",
          assignedTo: "",
        });
        setShowCreateChoreModal(false);
      } else {
        alert("Failed to create chore. Please try again.");
      }
    } catch (err) {
      console.error("Error creating chore:", err);
      alert("Error creating chore. Please try again.");
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/chores/${editingChore.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...tokenHeader() },
          body: JSON.stringify(editingChore),
        }
      );
      const data = await res.json();
      if (data.success) {
        const updatedChore = data.chore;
        updatedChore.assignedTo = updatedChore.kid_username
          ? updatedChore.kid_username
          : "Unassigned";
        onUpdateChore(updatedChore);
        setShowEditModal(false);
      } else {
        alert("Failed to update chore.");
      }
    } catch (err) {
      console.error("Error updating chore:", err);
      alert("Error updating chore. Please try again.");
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm("Delete this chore?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/chores/${c.id}`, {
        method: "DELETE",
        headers: tokenHeader(),
      });
      if (res.ok) onDeleteChore(c.id);
    } catch (err) {
      console.error("Error deleting chore:", err);
    }
  };

  const handleSaveRecommendedChore = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tokenHeader() },
        body: JSON.stringify(choreToAdd),
      });
      const data = await res.json();
      if (data.success) {
        let createdChore = data.chore;
        createdChore.assignedTo = createdChore.kid_username
          ? createdChore.kid_username
          : "Unassigned";
        onAddChore(createdChore);
        alert("Chore added to child successfully!");
        setShowAddRecommendationModal(false);
      } else {
        alert("Failed to add chore. Please try again.");
      }
    } catch (err) {
      console.error("Error adding chore:", err);
      alert("Error adding chore. Please try again.");
    }
  };

  const handleRegenerateRecommendations = async () => {
    setIsGeneratingRecommendations(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/chores/recommendations`,
        { headers: tokenHeader() }
      );
      const data = await res.json();
      if (data.success) {
        setChoreRecommendations(data.recommendations);
        alert("New recommendations fetched!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  return (
    <div className={tw("space-y-6")}>
      <div
        className={tw(
          "bg-white rounded-3xl shadow-lg p-6 border border-gray-100"
        )}
      >
        <div className={tw("flex items-center justify-between mb-4")}>
          <div>
            <h2 className={tw("text-2xl font-bold text-[#0a2150]")}>
              Chore Management
            </h2>
            <p className={tw("text-[#0a2150]")}>
              Where everyday tasks build lifelong Money smart skills
            </p>
          </div>
          <button
            onClick={handleCreateChore}
            className={tw(
              "px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            )}
          >
            ✨ Create Custom Chore
          </button>
        </div>

        <div
          className={tw("inline-flex items-center bg-gray-100 rounded-2xl p-1")}
        >
          <button
            onClick={() => setActiveManagementTab("manage-chores")}
            className={tw(
              `px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm ${
                activeManagementTab === "manage-chores"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`
            )}
          >
            <span className={tw("flex items-center gap-2 text-[#0a2150]")}>
              <span>📋</span>
              Manage Chores
            </span>
          </button>
          <button
            onClick={() => setActiveManagementTab("ai-recommendations")}
            className={tw(
              `px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm ${
                activeManagementTab === "ai-recommendations"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`
            )}
          >
            <span className={tw("flex items-center gap-2 text-[#0a2150]")}>
              <span>✨</span>
              AI Recommendations
            </span>
          </button>
        </div>
      </div>

      {activeManagementTab === "manage-chores" && (
        <div
          className={tw(
            "bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
          )}
        >
          <div className={tw("p-6 border-b border-gray-100")}>
            <div className={tw("flex items-center justify-between")}>
              <div>
                <h3 className={tw("text-xl font-bold text-[#0a2150]")}>
                  Active Chores
                </h3>
                <p className={tw("text-gray-600")}></p>
              </div>
              <div className={tw("text-right")}>
                <div className={tw("text-2xl font-bold text-blue-600")}>
                  {chores.length}
                </div>
                <div className={tw("text-sm text-gray-600")}>Total Chores</div>
              </div>
            </div>
          </div>

          {chores.length === 0 ? (
            <div className={tw("text-center py-16")}>
              <div
                className={tw(
                  "w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
                )}
              >
                <span className={tw("text-4xl")}>📝</span>
              </div>
              <h3 className={tw("text-lg font-semibold text-gray-800 mb-2")}>
                No chores yet
              </h3>
              <p className={tw("text-gray-600")}>
                Create your first chore or browse AI recommendations
              </p>
            </div>
          ) : (
            <div className={tw("divide-y divide-gray-100")}>
              {chores.map((chore) => (
                <div
                  key={chore.id}
                  className={tw("p-6 hover:bg-gray-50 transition-colors")}
                >
                  <div className={tw("flex items-center justify-between")}>
                    <div className={tw("flex items-center gap-4")}>
                      <div
                        className={tw(
                          `w-12 h-12 rounded-2xl flex items-center justify-center ${
                            chore.status === "Completed"
                              ? "bg-green-100 text-green-600"
                              : chore.status === "Assigned"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`
                        )}
                      >
                        {chore.status === "Completed"
                          ? "✅"
                          : chore.status === "Assigned"
                          ? "📋"
                          : "⏳"}
                      </div>

                      <div className={tw("flex-1")}>
                        <div className={tw("flex items-center gap-3 mb-2")}>
                          <h4
                            className={tw(
                              "text-lg font-semibold text-gray-900"
                            )}
                          >
                            {chore.title}
                          </h4>
                          <span
                            className={tw(
                              `px-3 py-1 rounded-full text-xs font-medium ${
                                chore.difficulty === "Easy"
                                  ? "bg-green-100 text-green-700"
                                  : chore.difficulty === "Medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`
                            )}
                          >
                            {chore.difficulty === "Easy"
                              ? "⭐ Easy"
                              : chore.difficulty === "Medium"
                              ? "⭐⭐ Medium"
                              : "⭐⭐⭐ Hard"}
                          </span>
                          <span
                            className={tw(
                              `px-3 py-1 rounded-full text-xs font-medium ${
                                chore.status === "Completed"
                                  ? "bg-green-100 text-green-700"
                                  : chore.status === "Assigned"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`
                            )}
                          >
                            {chore.status}
                          </span>
                        </div>
                        <p className={tw("text-gray-600 mb-2")}>
                          {chore.description}
                        </p>
                        <div
                          className={tw(
                            "flex items-center gap-4 text-sm text-gray-600"
                          )}
                        >
                          <span className={tw("flex items-center gap-1")}>
                            📂 {chore.category}
                          </span>
                          <span className={tw("flex items-center gap-1")}>
                            📅 Due: {chore.dueDate}
                          </span>
                          <span className={tw("flex items-center gap-1")}>
                            👤 {chore.assignedTo}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={tw("flex items-center gap-3")}>
                      <div className={tw("text-right mr-4")}>
                        <div
                          className={tw("text-2xl font-bold text-green-600")}
                        >
                          ${chore.reward.toFixed(2)}
                        </div>
                        <div className={tw("text-xs text-gray-600")}>
                          Reward
                        </div>
                      </div>

                      {chore.assignedTo === "Unassigned" ? (
                        <button
                          className={tw(
                            "px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                          )}
                        >
                          Assign
                        </button>
                      ) : (
                        <div className={tw("flex gap-2")}>
                          <button
                            onClick={() => handleEdit(chore)}
                            className={tw(
                              "p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            )}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(chore)}
                            className={tw(
                              "p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            )}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeManagementTab === "ai-recommendations" && (
        <div className={tw("space-y-6")}>
          {showAiChat && (
            <div
              className={tw(
                "bg-white rounded-3xl shadow-lg border border-gray-100 p-6"
              )}
            >
              <div className={tw("flex items-center justify-between mb-6")}>
                <h3 className={tw("text-xl font-bold text-gray-900")}>
                  ✨ Chat with AI Assistant
                </h3>
                <button
                  onClick={() => setShowAiChat(false)}
                  className={tw(
                    "p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  )}
                >
                  ✕
                </button>
              </div>

              {chatHistory.length > 0 && (
                <div className={tw("mb-4 max-h-60 overflow-y-auto space-y-3")}>
                  {chatHistory.slice(-5).map((msg, index) => (
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
                          `max-w-2xl p-3 rounded-2xl text-sm ${
                            msg.role === "user"
                              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`
                        )}
                      >
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className={tw("flex justify-start")}>
                      <div className={tw("bg-gray-100 p-3 rounded-2xl")}>
                        <div className={tw("flex space-x-1")}>
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
              )}

              <div className={tw("flex gap-3 mb-4")}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSendMessage();
                    }
                  }}
                  placeholder="Ask about chore recommendations for your children..."
                  className={tw(
                    "flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  )}
                  disabled={isLoading}
                />
                <button
                  onClick={onSendMessage}
                  disabled={isLoading || !message.trim()}
                  className={tw(
                    `px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg ${
                      isLoading || !message.trim()
                        ? "opacity-50 cursor-not-allowed transform-none"
                        : ""
                    }`
                  )}
                >
                  {isLoading ? "Sending..." : "Send"}
                </button>
              </div>

              <div className={tw("flex flex-wrap gap-2")}>
                {[
                  "What chores are good for a 7-year-old?",
                  "How to teach responsibility through chores?",
                  "Easy chores for beginners?",
                  "Chores that teach money management?",
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(suggestion)}
                    className={tw(
                      "px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-colors"
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className={tw(
              "bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
            )}
          >
            <div className={tw("p-6 border-b border-gray-100")}>
              <div className={tw("flex items-center justify-between")}>
                <div>
                  <h3 className={tw("text-xl font-bold text-[#0a2150]")}>
                    ✨ AI Recommendations
                  </h3>
                  <p className={tw("text-[#0a2150]")}>
                    Personalized chore suggestions for your children
                  </p>
                </div>
                <div className={tw("flex gap-3")}>
                  <button
                    onClick={() => setShowAiChat(!showAiChat)}
                    className={tw(
                      "px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-200 transition-colors"
                    )}
                  >
                    ✨ Chat with AI
                  </button>
                  <button
                    onClick={handleRegenerateRecommendations}
                    disabled={isGeneratingRecommendations}
                    className={tw(
                      `px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg ${
                        isGeneratingRecommendations
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`
                    )}
                  >
                    {isGeneratingRecommendations
                      ? "🔄 Generating..."
                      : "🎲 New Recommendations"}
                  </button>
                </div>
              </div>
            </div>

            {recommendations.length === 0 ? (
              <div className={tw("text-center py-16")}>
                <div
                  className={tw(
                    "w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center"
                  )}
                >
                  <span className={tw("text-4xl")}>🤖</span>
                </div>
                <h3 className={tw("text-lg font-semibold text-gray-800 mb-2")}>
                  Ready to suggest perfect chores!
                </h3>
                <p className={tw("text-gray-600")}>
                  Chat with AI or generate recommendations to get started
                </p>
              </div>
            ) : (
              <div className={tw("divide-y divide-gray-100")}>
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={tw("p-6 hover:bg-gray-50 transition-colors")}
                  >
                    <div className={tw("flex items-start justify-between")}>
                      <div className={tw("flex items-start gap-4 flex-1")}>
                        <div
                          className={tw(
                            "w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
                          )}
                        >
                          <span className={tw("text-xl")}>⭐</span>
                        </div>

                        <div className={tw("flex-1")}>
                          <div className={tw("flex items-center gap-3 mb-2")}>
                            <h4
                              className={tw("text-lg font-bold text-gray-900")}
                            >
                              {rec.title}
                            </h4>
                            <span
                              className={tw(
                                `px-3 py-1 rounded-full text-xs font-medium ${
                                  rec.difficulty === "Easy"
                                    ? "bg-green-100 text-green-700"
                                    : rec.difficulty === "Medium"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`
                              )}
                            >
                              {rec.difficulty === "Easy"
                                ? "⭐ Easy"
                                : rec.difficulty === "Medium"
                                ? "⭐⭐ Medium"
                                : "⭐⭐⭐ Hard"}
                            </span>
                          </div>
                          <p className={tw("text-gray-600 mb-3")}>
                            {rec.description}
                          </p>
                          <div
                            className={tw(
                              "flex items-center gap-4 text-sm text-gray-600"
                            )}
                          >
                            <span className={tw("flex items-center gap-1")}>
                              <span>📂</span>
                              {rec.category}
                            </span>
                            <span className={tw("flex items-center gap-1")}>
                              <span>📅</span>
                              Due: {rec.dueDate}
                            </span>
                            <span className={tw("flex items-center gap-1")}>
                              <span>💰</span>${(rec.reward ?? 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={tw("ml-4")}>
                        <button
                          onClick={() => handleAdd(rec)}
                          className={tw(
                            "px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                          )}
                        >
                          ➕ Add to Child
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && editingChore && (
        <div
          className={tw(
            "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          )}
        >
          <div
            className={tw(
              "bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            )}
          >
            <div className={tw("p-6 border-b border-gray-100")}>
              <div className={tw("flex items-center justify-between")}>
                <h3 className={tw("text-xl font-bold text-gray-900")}>
                  ✏️ Edit Chore
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={tw(
                    "p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  )}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={tw("p-6 space-y-4")}>
              <div>
                <label
                  className={tw("block text-sm font-medium text-gray-700 mb-2")}
                >
                  Title
                </label>
                <input
                  type="text"
                  value={editingChore.title}
                  onChange={(e) =>
                    setEditingChore({ ...editingChore, title: e.target.value })
                  }
                  className={tw(
                    "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  )}
                />
              </div>

              <div>
                <label
                  className={tw("block text-sm font-medium text-gray-700 mb-2")}
                >
                  Description
                </label>
                <textarea
                  value={editingChore.description}
                  onChange={(e) =>
                    setEditingChore({
                      ...editingChore,
                      description: e.target.value,
                    })
                  }
                  rows="3"
                  className={tw(
                    "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  )}
                />
              </div>

              <div className={tw("grid grid-cols-2 gap-4")}>
                <div>
                  <label
                    className={tw(
                      "block text-sm font-medium text-gray-700 mb-2"
                    )}
                  >
                    Reward ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingChore.reward}
                    onChange={(e) =>
                      setEditingChore({
                        ...editingChore,
                        reward: parseFloat(e.target.value),
                      })
                    }
                    className={tw(
                      "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    )}
                  />
                </div>

                <div>
                  <label
                    className={tw(
                      "block text-sm font-medium text-gray-700 mb-2"
                    )}
                  >
                    Difficulty
                  </label>
                  <select
                    value={editingChore.difficulty}
                    onChange={(e) =>
                      setEditingChore({
                        ...editingChore,
                        difficulty: e.target.value,
                      })
                    }
                    className={tw(
                      "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    )}
                  >
                    <option value="Easy">⭐ Easy</option>
                    <option value="Medium">⭐⭐ Medium</option>
                    <option value="Hard">⭐⭐⭐ Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={tw("p-6 border-t border-gray-100 flex gap-3")}>
              <button
                onClick={() => setShowEditModal(false)}
                className={tw(
                  "flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className={tw(
                  "flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                )}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddRecommendationModal && choreToAdd && (
        <div
          className={tw(
            "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          )}
        >
          <div
            className={tw(
              "bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            )}
          >
            <div className={tw("p-6 border-b border-gray-100")}>
              <div className={tw("flex items-center justify-between")}>
                <h3 className={tw("text-xl font-bold text-gray-900")}>
                  ➕ Add Recommended Chore to Child
                </h3>
                <button
                  onClick={() => setShowAddRecommendationModal(false)}
                  className={tw(
                    "p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  )}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={tw("p-6 space-y-4")}>
              <div>
                <label
                  className={tw("block text-sm font-medium text-gray-700 mb-2")}
                >
                  Title *
                </label>
                <input
                  type="text"
                  value={choreToAdd.title}
                  onChange={(e) =>
                    setChoreToAdd({ ...choreToAdd, title: e.target.value })
                  }
                  placeholder="e.g., Clean your room"
                  className={tw(
                    "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  )}
                />
              </div>

              <div>
                <label
                  className={tw("block text-sm font-medium text-gray-700 mb-2")}
                >
                  Description *
                </label>
                <textarea
                  value={choreToAdd.description}
                  onChange={(e) =>
                    setChoreToAdd({
                      ...choreToAdd,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what needs to be done..."
                  rows="3"
                  className={tw(
                    "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  )}
                />
              </div>

              <div className={tw("grid grid-cols-2 gap-4")}>
                <div>
                  <label
                    className={tw(
                      "block text-sm font-medium text-gray-700 mb-2"
                    )}
                  >
                    Category
                  </label>
                  <select
                    value={choreToAdd.category}
                    onChange={(e) =>
                      setChoreToAdd({ ...choreToAdd, category: e.target.value })
                    }
                    className={tw(
                      "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    )}
                  >
                    <option value="Cleaning">🧹 Cleaning</option>
                    <option value="Kitchen">🍳 Kitchen</option>
                    <option value="Outdoor">🌳 Outdoor</option>
                    <option value="Organization">📦 Organization</option>
                    <option value="Pet Care">🐕 Pet Care</option>
                    <option value="Other">📝 Other</option>
                  </select>
                </div>

                <div>
                  <label
                    className={tw(
                      "block text-sm font-medium text-gray-700 mb-2"
                    )}
                  >
                    Difficulty
                  </label>
                  <select
                    value={choreToAdd.difficulty}
                    onChange={(e) =>
                      setChoreToAdd({
                        ...choreToAdd,
                        difficulty: e.target.value,
                      })
                    }
                    className={tw(
                      "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    )}
                  >
                    <option value="Easy">⭐ Easy</option>
                    <option value="Medium">⭐⭐ Medium</option>
                    <option value="Hard">⭐⭐⭐ Hard</option>
                  </select>
                </div>
              </div>

              <div className={tw("grid grid-cols-2 gap-4")}>
                <div>
                  <label
                    className={tw(
                      "block text-sm font-medium text-gray-700 mb-2"
                    )}
                  >
                    Reward ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={choreToAdd.reward}
                    onChange={(e) =>
                      setChoreToAdd({
                        ...choreToAdd,
                        reward: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={tw(
                      "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    )}
                  />
                </div>

                <div>
                  <label
                    className={tw(
                      "block text-sm font-medium text-gray-700 mb-2"
                    )}
                  >
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={choreToAdd.dueDate}
                    onChange={(e) =>
                      setChoreToAdd({ ...choreToAdd, dueDate: e.target.value })
                    }
                    className={tw(
                      "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    )}
                  />
                </div>
              </div>

              <div>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  Assign to Child
                </label>
                <div className={tw('space-y-2')}>
                  {children.map((child) => (
                    <label 
                      key={child.username}
                      className={tw(`flex items-center gap-3 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer ${
                        choreToAdd.assignedTo === child.username ? 'border-2 border-blue-500 bg-blue-50' : ''
                      }`)}
                    >
                      <input
                        type="radio"
                        name="assignedChild"
                        value={child.username}
                        checked={choreToAdd.assignedTo === child.username}
                        onChange={() => setChoreToAdd({...choreToAdd, assignedTo: child.username})}
                        className={tw('form-radio h-5 w-5 text-blue-600')}
                      />
                      <div className={tw('flex items-center gap-2')}>
                        <div className={tw('w-8 h-8 rounded-full overflow-hidden')}>
                          <img
                            src={getValidChildAvatar(child.avatar)}
                            alt={`${child.nickName || child.firstName} avatar`}
                            className="w-8 h-8 object-cover rounded-full"
                          />
                        </div>
                        <span className={tw('font-medium')}>{child.nickName || child.firstName}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className={tw("p-6 border-t border-gray-100 flex gap-3")}>
              <button
                onClick={() => setShowAddRecommendationModal(false)}
                className={tw(
                  "flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecommendedChore}
                disabled={!choreToAdd.title || !choreToAdd.description}
                className={tw(
                  `flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg ${
                    !choreToAdd.title || !choreToAdd.description
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`
                )}
              >
                Add Chore to Child
              </button>
            </div>
          </div>
        </div>
      )}
      {showCreateChoreModal && (
        <div
          className={tw(
            "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          )}
        >
          <div
            className={tw(
              "bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            )}
          >
            <div className={tw("p-6 border-b border-gray-100")}>
              <div className={tw("flex items-center justify-between")}>
                <h3 className={tw("text-xl font-bold text-gray-900")}>
                  ✨ Create Custom Chore
                </h3>
                <button
                  onClick={() => setShowCreateChoreModal(false)}
                  className={tw(
                    "p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  )}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={tw("p-6 space-y-4")}>
              <div>
                <label
                  className={tw("block text-sm font-medium text-gray-700 mb-2")}
                >
                  Title *
                </label>
                <input
                  type="text"
                  value={newChore.title}
                  onChange={(e) =>
                    setNewChore({ ...newChore, title: e.target.value })
                  }
                  placeholder="e.g., Clean your room"
                  className={tw(
                    "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  )}
                />
              </div>

              <div>
                <label
                  className={tw("block text-sm font-medium text-gray-700 mb-2")}
                >
                  Description *
                </label>
                <textarea
                  value={newChore.description}
                  onChange={(e) =>
                    setNewChore({ ...newChore, description: e.target.value })
                  }
                  placeholder="Describe what needs to be done..."
                  rows="3"
                  className={tw(
                    "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  )}
                />
              </div>

              <div className={tw("grid grid-cols-2 gap-4")}>
                <div>
                  <label
                    className={tw(
                      "block text-sm font-medium text-gray-700 mb-2"
                    )}
                  >
                    Category
                  </label>
                  <select
                    value={newChore.category}
                    onChange={(e) =>
                      setNewChore({ ...newChore, category: e.target.value })
                    }
                    className={tw(
                      "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    )}
                  >
                    <option value="Cleaning">🧹 Cleaning</option>
                    <option value="Kitchen">🍳 Kitchen</option>
                    <option value="Outdoor">🌳 Outdoor</option>
                    <option value="Organization">📦 Organization</option>
                    <option value="Pet Care">🐕 Pet Care</option>
                    <option value="Other">📝 Other</option>
                  </select>
                </div>

                <div>
                  <label
                    className={tw(
                      "block text-sm font-medium text-gray-700 mb-2"
                    )}
                  >
                    Difficulty
                  </label>
                  <select
                    value={newChore.difficulty}
                    onChange={(e) =>
                      setNewChore({ ...newChore, difficulty: e.target.value })
                    }
                    className={tw(
                      "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    )}
                  >
                    <option value="Easy">⭐ Easy</option>
                    <option value="Medium">⭐⭐ Medium</option>
                    <option value="Hard">⭐⭐⭐ Hard</option>
                  </select>
                </div>
              </div>

              <div className={tw("grid grid-cols-2 gap-4")}>
                <div>
                  <label
                    className={tw(
                      "block text-sm font-medium text-gray-700 mb-2"
                    )}
                  >
                    Reward ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newChore.reward}
                    onChange={(e) =>
                      setNewChore({
                        ...newChore,
                        reward: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={tw(
                      "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    )}
                  />
                </div>

                <div>
                  <label
                    className={tw(
                      "block text-sm font-medium text-gray-700 mb-2"
                    )}
                  >
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newChore.dueDate}
                    onChange={(e) =>
                      setNewChore({ ...newChore, dueDate: e.target.value })
                    }
                    className={tw(
                      "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    )}
                  />
                </div>
              </div>

              <div>
                <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
                  Assign to Child
                </label>
                <div className={tw('space-y-2')}>
                  {children.map((child) => (
                    <label 
                      key={child.username}
                      className={tw(`flex items-center gap-3 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer ${
                        newChore.assignedTo === child.username ? 'border-2 border-blue-500 bg-blue-50' : ''
                      }`)}
                    >
                      <input
                        type="radio"
                        name="assignedChild"
                        value={child.username}
                        checked={newChore.assignedTo === child.username}
                        onChange={() => setNewChore({...newChore, assignedTo: child.username})}
                        className={tw('form-radio h-5 w-5 text-blue-600')}
                      />
                      <div className={tw('flex items-center gap-2')}>
                        <div className={tw('w-8 h-8 rounded-full overflow-hidden')}>
                          <img
                            src={getValidChildAvatar(child.avatar)}
                            alt={`${child.nickName || child.firstName} avatar`}
                            className="w-8 h-8 object-cover rounded-full"
                          />
                        </div>
                        <span className={tw('font-medium')}>{child.nickName || child.firstName}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className={tw("p-6 border-t border-gray-100 flex gap-3")}>
              <button
                onClick={() => setShowCreateChoreModal(false)}
                className={tw(
                  "flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewChore}
                disabled={!newChore.title || !newChore.description}
                className={tw(
                  `flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg ${
                    !newChore.title || !newChore.description
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`
                )}
              >
                Create Chore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ParentDashboard;
