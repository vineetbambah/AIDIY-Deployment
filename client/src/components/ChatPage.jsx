import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { tw } from "@twind/core";
import AIAvatar from "./AIAvatar";
import { API_BASE_URL } from '../api';

const ChatPage = () => {
  /* ─────────────── state ─────────────── */
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isNewSession, setIsNewSession] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);

  /* ─────────────── refs ─────────────── */
  const fileInputRef = useRef(null);
  const mediaRecRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  /* ─────────────── helpers ─────────────── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* ─────────────── initial load ─────────────── */
  useEffect(() => {
    fetchChatSessions();
    // Add initial greeting if no messages
    if (messages.length === 0 && isNewSession) {
      setMessages([{
        role: "assistant",
        content: "Hello! How can I help you with money management, saving, financial literacy, or chores today?",
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  /* scroll when msgs change */
  useEffect(scrollToBottom, [messages, scrollToBottom]);

  /* load a session into the UI whenever activeSession changes */
  useEffect(() => {
    if (activeSession) loadChatSession(activeSession);
    else if (chatSessions.length && !isNewSession) setActiveSession(chatSessions[0]._id);
  }, [activeSession, chatSessions, isNewSession]);

  /* ─────────────── Recording Timer ─────────────── */
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  /* ─────────────── API wrappers ─────────────── */
  const fetchChatSessions = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("app_token");
      const res = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setChatSessions(data.sessions);
      }
    } catch (err) {
      console.error("fetchChatSessions failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChatSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("app_token");
      const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "New Chat" }),
      });
      const data = await response.json();
      if (data.success) {
        setActiveSession(data.session_id);
        // Add initial greeting message
        setMessages([{
          role: "assistant",
          content: "Hello! How can I help you with money management, saving, financial literacy, or chores today?",
          timestamp: new Date().toISOString()
        }]);
        setIsNewSession(true);
        fetchChatSessions();
      }
    } catch (error) {
      console.error("Failed to create new session:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadChatSession = async (sessionId) => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("app_token");
      const res = await fetch(
        `${API_BASE_URL}/api/chat/sessions/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        const sessionMessages = data.session.messages || [];
        // If session has no messages, add greeting
        if (sessionMessages.length === 0) {
          setMessages([{
            role: "assistant",
            content: "Hello! How can I help you with money management, saving, financial literacy, or chores today?",
            timestamp: new Date().toISOString()
          }]);
        } else {
          setMessages(sessionMessages);
        }
        setIsNewSession(false);
      }
    } catch (err) {
      console.error("loadChatSession failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionTitle = async (sessionId, newTitle) => {
    try {
      const token = sessionStorage.getItem("app_token");
      await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      });
      fetchChatSessions();
    } catch (err) {
      console.error("updateSessionTitle failed:", err);
    }
  };

  const deleteChatSession = async (sessionId) => {
    try {
      const token = sessionStorage.getItem("app_token");
      await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Create new session if deleting current session
      if (activeSession === sessionId) {
        createNewChatSession();
      } else {
        fetchChatSessions();
      }
    } catch (err) {
      console.error("deleteChatSession failed:", err);
    }
  };

  /* ─────────────── chat logic ─────────────── */
  const startNewChat = () => {
    createNewChatSession();
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    /* optimistic user bubble */
    const userMsg = {
      role: "user",
      content: input,
      image: selectedImage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem("app_token");
      let sessionId = activeSession;

      /* ── create session only if absent ── */
      if (!sessionId) {
        const createRes = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: "New Chat" }), // placeholder
        });
        const createData = await createRes.json();
        if (!createData.success) throw new Error("Failed to create session");
        sessionId = createData.session_id;
        setActiveSession(sessionId);
      }

      /* ── call AI ── */
      const body = { 
        message: userMsg.content, 
        session_id: sessionId,
        is_first_message: messages.length <= 1 // Only greeting message exists
      };
      if (userMsg.image) body.image = userMsg.image.split(",")[1]; // base64 only

      const aiRes = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const aiData = await aiRes.json();

      const replyMsg = {
        role: "assistant",
        content: aiData.success
          ? aiData.response
          : `Error: ${aiData.error || "Unknown error"}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, replyMsg]);

      /* session now real & non-empty */
      setIsNewSession(false);
      fetchChatSessions();
    } catch (err) {
      console.error("sendMessage failed:", err);
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: `Error: ${err.message}`, 
          timestamp: new Date().toISOString() 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ─────────────── media helpers ─────────────── */
  const handleImageUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert("Image must be ≤ 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result);
    reader.readAsDataURL(f);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/wav";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      mediaRecRef.current = rec;
      audioChunksRef.current = [];

      rec.ondataavailable = (ev) => ev.data.size && audioChunksRef.current.push(ev.data);
      rec.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mime });
        sendAudioToServer(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      setIsRecording(true);
    } catch (err) {
      alert("Recording failed: " + err.message);
    }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    setIsRecording(false);
  };

  const sendAudioToServer = async (audioBlob) => {
    const token = sessionStorage.getItem("app_token");
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/speech-to-text`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setInput(data.text);
      } else {
        alert("Speech recognition failed: " + data.error);
      }
    } catch (error) {
      alert("Failed to send audio: " + error.message);
    }
  };

  /* ─────────────── UI ─────────────── */
  return (
    <div className={tw`min-h-screen flex`} style={{ backgroundColor: "#EBF1FF" }}>
      {/* ────────── Sidebar ────────── */}
      {sidebarOpen && (
        <div className={tw`w-64 flex flex-col shadow-lg`} style={{ backgroundColor: "#CDC8E3" }}>
          <header className={tw`p-4 border-b border-gray-300 flex justify-between items-center`}>
            <h2 className={tw`font-semibold text-[#0a2150] text-lg`}>Chat History</h2>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className={tw`text-gray-600 hover:text-gray-800`}
            >
              ✕
            </button>
          </header>

          <button
            onClick={startNewChat}
            className={tw`w-full text-left py-3 px-4 hover:bg-purple-200 text-[#0a2150] font-medium flex items-center`}
          >
            ➕ New Chat
          </button>

          <div className={tw`flex-1 overflow-y-auto`}>
            {chatSessions.length === 0 && !isLoading && (
              <p className={tw`p-4 text-center italic text-[#0a2150]`}>No saved chats yet</p>
            )}
            {chatSessions.map((s) => (
              <div
                key={s._id}
                onClick={() => setActiveSession(s._id)}
                className={tw`
                  p-3 border-b border-gray-200 cursor-pointer hover:bg-purple-200
                  ${activeSession === s._id ? "bg-purple-300" : ""}
                `}
              >
                <div className={tw`flex justify-between items-start`}>
                  <div className={tw`flex-1 min-w-0`}>
                    <p className={tw`font-medium text-[#0a2150] truncate`}>{s.title}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Delete this chat?")) deleteChatSession(s._id);
                    }}
                    className={tw`ml-2 text-red-500 hover:text-red-700 p-1`}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

          <footer className={tw`p-3 border-t border-gray-300 text-xs text-gray-500`}>
            AI Financial Coach v1.0
          </footer>
        </div>
      )}

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={tw`fixed top-0 left-0 h-full w-8 bg-purple-300 text-gray-700 shadow-md flex items-top justify-top text-lg p-1`}
          style={{ zIndex: 50 }}
          title="Show Menu"
        >
          ☰
        </button>
      )}

      {/* ────────── Chat pane ────────── */}
      <main className={tw`flex-1 flex flex-col px-4 py-6`}>
        {/* Header */}
        <div className={tw`flex justify-between items-center mb-4 max-w-4xl mx-auto w-full`}>
          <h1 className={tw`text-2xl font-bold text-[#0a2150]`}>Ai DIY</h1>
          {activeSession && (
            <input
              value={chatSessions.find((s) => s._id === activeSession)?.title || ""}
              onChange={(e) => updateSessionTitle(activeSession, e.target.value)}
              placeholder="Chat title"
              className={tw`bg-transparent border-b border-gray-400 px-2 py-1 max-w-xs focus:outline-none focus:border-blue-500 text-gray-700`}
            />
          )}
        </div>

        {/* Messages */}
        <section
          className={tw`flex flex-col flex-grow max-w-4xl mx-auto rounded-xl shadow-md p-6 sm:p-8 w-full`}
          style={{ backgroundColor: "#E3DCEE" }}
        >
          
          <div className={tw`flex-grow overflow-y-auto mb-4 max-h-[70vh]`}>
            {messages.map((m, i) => {
              if (m.role === "user") {
                return (
                  <div key={i} className={tw`flex justify-end mb-4`}>
                    <div className={tw`relative max-w-[85%]`}>
                      <div
                        className={tw`
                          p-4 rounded-tl-[20px] rounded-tr-[20px] rounded-bl-[20px] rounded-br-[4px]
                          bg-gradient-to-r from-[#40e0d0] to-[#a855f7] text-white
                          shadow-lg
                        `}
                      >
                        {m.image && <img src={m.image} alt="upload" className={tw`mb-2 rounded-lg max-h-40`} />}
                        <p className={tw`whitespace-pre-wrap`}>{m.content}</p>
                      </div>
                      {/* Cloud tail for user */}
                      <div 
                        className={tw`absolute bottom-0 -right-2 w-4 h-4`}
                        style={{ 
                          clipPath: "polygon(0 0, 100% 0, 100% 100%)",
                          backgroundColor: "#a855f7"
                        }}
                      />
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={i} className={tw`flex justify-start mb-4`}>
                    <div className={tw`relative max-w-[85%]`}>
                      <div
                        className={tw`
                          p-4 rounded-tl-[20px] rounded-tr-[20px] rounded-br-[20px] rounded-bl-[4px]
                          bg-white text-gray-800 shadow-lg
                        `}
                      >
                        <p className={tw`whitespace-pre-wrap`}>{m.content}</p>
                      </div>
                      {/* Cloud tail for AI */}
                      <div 
                        className={tw`absolute bottom-0 -left-2 w-4 h-4`}
                        style={{ 
                          clipPath: "polygon(0 0, 0% 100%, 100% 0%)",
                          backgroundColor: "#ffffff"
                        }}
                      />
                    </div>
                  </div>
                );
              }
            })}

            {isLoading && (
              <div className={tw`flex justify-start mb-4`}>
                <div className={tw`bg-white p-4 rounded-2xl rounded-bl-[4px] shadow-lg`}>
                  <div className={tw`flex space-x-2`}>
                    <div className={tw`w-2 h-2 bg-gray-400 rounded-full animate-bounce`} />
                    <div className={tw`w-2 h-2 bg-gray-400 rounded-full animate-bounce`} style={{ animationDelay: "0.1s" }} />
                    <div className={tw`w-2 h-2 bg-gray-400 rounded-full animate-bounce`} style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={tw`relative bg-gray-50 rounded-2xl p-4 border-2 border-gray-200`}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about money management, savings, or financial goals..."
              rows={2}
              disabled={isLoading}
              className={tw`w-full bg-transparent resize-none outline-none placeholder-gray-400 min-h-[60px] text-gray-700`}
            />

            {selectedImage && (
              <div className={tw`inline-block mt-2 relative`}>
                <img src={selectedImage} alt="preview" className={tw`h-20 rounded-lg`} />
                <button
                  onClick={() => setSelectedImage(null)}
                  className={tw`absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs`}
                >
                  ✕
                </button>
              </div>
            )}

            <div className={tw`flex justify-between items-center mt-3`}>
              <div className={tw`flex items-center gap-3`}>
                {/* Image Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={tw`p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors`}
                  disabled={isLoading || isRecording}
                  title="Upload Image"
                >
                  📷
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={tw`hidden`}
                />
                
                {/* Voice Recording Button/Controls */}
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className={tw`flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors`}
                    disabled={isLoading}
                    title="Start Recording"
                  >
                    <span className={tw`text-lg`}>🎤</span>
                    <span className={tw`text-sm font-medium`}>Record</span>
                  </button>
                ) : (
                  <div className={tw`flex items-center gap-3`}>
                    <div className={tw`flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-full`}>
                      <span className={tw`w-3 h-3 bg-red-500 rounded-full animate-pulse`}></span>
                      <span className={tw`text-sm font-medium`}>Recording {formatTime(recordingTime)}</span>
                    </div>
                    <button
                      onClick={stopRecording}
                      className={tw`flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-colors`}
                      title="Stop Recording"
                    >
                      <span className={tw`text-sm`}>⏹</span>
                      <span className={tw`text-sm font-medium`}>Stop</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={sendMessage}
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className={tw`
                  px-6 py-2 bg-gradient-to-r from-[#40e0d0] to-[#a855f7]
                  text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 
                  transition-all disabled:opacity-50
                `}
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ChatPage;