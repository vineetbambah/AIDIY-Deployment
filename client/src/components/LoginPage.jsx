// src/pages/LoginPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import aidiyLogo from "../images/aidiy_logo.png";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  clearError,
} from "../store/authSlice";
import { tw } from "@twind/core";


import { API_BASE_URL } from '../api';

const GOOGLE_CLIENT_ID =
 "670147633419-rebvnb3b4h848pipit4hv2q1s3u09ln2.apps.googleusercontent.com";



const LoginPage = () => {
  /* ───────────────────────────── local state ───────────────────────────── */
  const [activeTab, setActiveTab] = useState("parent");

  // parent
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // kid
  const [kidUsername, setKidUsername] = useState("");
  const [kidCode, setKidCode] = useState(["", "", "", ""]);

  // misc
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [showCode, setShowCode] = useState(false);

  /* ─────────────────────────── redux / nav helpers ─────────────────────── */
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);

  const resetErrors = useCallback(() => {
    setErrorMsg("");
    dispatch(clearError());
  }, [dispatch]);

  /* ────────────────────── Google One-Tap callback ──────────────────────── */
  const handleCredentialResponse = useCallback(
    async (response) => {
      const idToken = response.credential;
      sessionStorage.setItem("google_id_token", idToken);

      try {
        dispatch(loginStart());
        resetErrors();

        const res = await fetch(`${API_BASE_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: idToken }),
        });
        const data = await res.json();

        if (data.success) {
          sessionStorage.setItem("app_token", data.appToken);
          dispatch(loginSuccess({ user: data.user, token: data.appToken }));

          // 检查用户资料是否完整
          if (data.user.isProfileComplete === false) {
            navigate("/parent-setup");
          } else {
            navigate("/profile");
          }
        } else {
          dispatch(loginFailure(data.error || "Google login failed"));
          setErrorMsg(data.error || "Google login failed");
        }
      } catch (err) {
        console.error(err);
        dispatch(loginFailure("Network error"));
        setErrorMsg("Network error – please try again");
      }
    },
    [dispatch, navigate, resetErrors]
  );

  /* ─────────────────────── init Google script ──────────────────────────── */
  useEffect(() => {
    const initGoogle = () => {
      if (window.google?.accounts && activeTab === "parent") {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
          });
          const div = document.getElementById("google-signin");
          if (div) {
            div.innerHTML = "";
            window.google.accounts.id.renderButton(div, {
              theme: "outline",
              size: "large",
              width: "100%",
            });
          }
        } catch (e) {
          console.error("Google init error:", e);
        }
      } else {
        setTimeout(initGoogle, 800);
      }
    };
    const t = setTimeout(initGoogle, 400);
    return () => clearTimeout(t);
  }, [activeTab, handleCredentialResponse]);

  /* ─────────────────────────── handlers ────────────────────────────────── */
  // parent login
  // const handleParentLogin = async (e) => {
  //   e.preventDefault();
  //   try {
  //     dispatch(loginStart());
  //     resetErrors();

  //     const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email, password }),
  //     });
  //     const data = await res.json();

  //     if (data.success) {
  //       sessionStorage.setItem("app_token", data.appToken);
  //       dispatch(loginSuccess({ user: data.user, token: data.appToken }));

  //       // 检查用户资料是否完整
  //       if (data.user.isProfileComplete === false) {
  //         navigate("/parent-setup");
  //       } else {
  //         navigate("/profile");
  //       }
  //     } else {
  //       dispatch(loginFailure(data.error || "Invalid email or password"));
  //       setErrorMsg(data.error || "Invalid email or password");
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     dispatch(loginFailure("Network error"));
  //     setErrorMsg("Network error – please try again");
  //   }
  // };


   const handleParentLogin = async (e) => {
    e.preventDefault();
    try {
      dispatch(loginStart());
      resetErrors();

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("app_token", data.appToken);
        dispatch(loginSuccess({ user: data.user, token: data.appToken }));

        // 检查用户资料是否完整
        if (data.user.isProfileComplete === false) {
          navigate("/parent-setup");
        } else {
          navigate("/profile");
        }
      } else {
        dispatch(loginFailure(data.error || "Invalid email or password"));
        setErrorMsg(data.error || "Invalid email or password");
      }
    } catch (err) {
      console.error(err);
      dispatch(loginFailure("Network error"));
      setErrorMsg("Network error – please try again");
    }
  };


  // kid login
  const handleKidLogin = async (e) => {
    e.preventDefault();
    const code = kidCode.join("");

    try {
      dispatch(loginStart());
      resetErrors();

      const res = await fetch(`${API_BASE_URL}/api/auth/kid-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: kidUsername.trim(), code }),
        username: kidUsername.trim(),
        code: kidCode.join(""),
      });
      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("app_token", data.appToken);
        sessionStorage.setItem("kid_nickname", data.user.nickName);
        sessionStorage.setItem("kid_avatar", data.user.avatar);
        dispatch(loginSuccess({ user: data.user, token: data.appToken }));
        navigate("/kid-dashboard");
      } else {
        dispatch(loginFailure(data.error || "Invalid kid credentials"));
        setErrorMsg(data.error || "Invalid kid credentials");
      }
    } catch (err) {
      console.error(err);
      dispatch(loginFailure("Network error"));
      setErrorMsg("Network error – please try again");
    }
  };

  // 4-digit focus-jump
  const handleKidCodeChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return; // Allow only single digits
    const next = [...kidCode];
    next[idx] = val;
    setKidCode(next);

    // Jump to next box when a digit is typed
    if (val && idx < 3) document.getElementById(`code-${idx + 1}`).focus();
  };

  const handleKidCodeKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !kidCode[idx] && idx > 0) {
      // Go backwards if box is empty
      document.getElementById(`code-${idx - 1}`).focus();
    }
    if (e.key === "ArrowLeft" && idx > 0)
      document.getElementById(`code-${idx - 1}`).focus();
    if (e.key === "ArrowRight" && idx < 3)
      document.getElementById(`code-${idx + 1}`).focus();
  };

  /* ─────────────────────────────── UI ─────────────────────────────────── */
  return (
    <div
      className={tw("min-h-screen")}
      style={{
        background:
          "linear-gradient(to bottom right, rgba(183, 115, 190, 0.9), rgba(30, 234, 234, 0.9))",
      }}
    >
      {/* ───── Header ───── */}
      <header className={tw("bg-white shadow-sm")}>
        <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>
          <div className={tw("flex items-center justify-between h-20")}>
            <Link to="/" className={tw("flex items-center space-x-2")}>
              <Link to="/" className={tw("flex items-center space-x-2")}>
                <img src={aidiyLogo} alt="AiDIY" className="h-20 w-auto" />
              </Link>
            </Link>
          </div>
        </div>
      </header>

      {/* ───── Body ───── */}
      <div
        className={tw(
          "flex items-center justify-center min-h-[calc(100vh-5rem)] py-12 px-4 sm:px-6 lg:px-8"
        )}
      >
        <div className={tw("max-w-5xl w-full")}>
          <div
            className={tw("grid grid-cols-1 lg:grid-cols-2 gap-8 items-center")}
          >
            {/* ───── Card ───── */}
            <div
              className={tw("bg-white rounded-2xl shadow-xl overflow-hidden")}
            >
              {/* tabs */}
              <div className={tw("flex border-b border-gray-200")}>
                {["parent", "kid"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={tw(
                      `flex-1 py-4 px-6 text-center font-semibold transition-all duration-300 rounded-lg border ${
                        activeTab === tab
                          ? "text-black  shadow-md"
                          : "text-[#0a2150] hover:bg-gray-50"
                      }`
                    )}
                    style={
                      activeTab === tab
                        ? {
                            background:
                              "linear-gradient(to right, #2dd4bf, #a855f7)",
                            // borderRadius: "10px",
                            // border: "1px solid black",
                          }
                        : undefined
                    }
                  >
                    {tab === "parent" ? "Parent Login" : "Kid Login"}
                  </button>
                ))}
              </div>

              {/* ───── Parent form ───── */}
              {activeTab === "parent" && (
                <div className={tw("p-8")}>
                  <h2 className={tw("text-2xl font-bold text-gray-800 mb-2")}>
                    Parent Login
                  </h2>
                  <p className={tw("text-gray-500 mb-6")}>
                    Login or access your AI DIY account.
                  </p>

                  {/* Google / FB */}
                  <div className={tw("space-y-3 mb-6")}>
                    <div id="google-signin" className={tw("w-full")} />
                    {/* <button
                      className={tw(
                        "w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-blue-600 rounded-lg font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                      )}
                    >
                      <span
                        className={tw(
                          "w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold"
                        )}
                      >
                        f
                      </span>
                      Facebook
                    </button> */}
                  </div>

                  {/* divider */}
                  <div className={tw("relative mb-6")}>
                    <div className={tw("absolute inset-0 flex items-center")}>
                      <div className={tw("w-full border-t border-gray-300")} />
                    </div>
                    <div className={tw("relative flex justify-center text-sm")}>
                      <span className={tw("px-2 bg-white text-gray-500")}>
                        Or login with email
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleParentLogin}>
                    <div className={tw("space-y-4")}>
                      {/* email */}
                      <div>
                        <label
                          className={tw(
                            "block text-sm font-medium text-gray-700 mb-1"
                          )}
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          className={tw(
                            "w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors"
                          )}
                          placeholder="Enter your email id"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      {/* password */}
                      <div>
                        <label
                          className={tw(
                            "block text-sm font-medium text-gray-700 mb-1"
                          )}
                        >
                          Password
                        </label>
                        <input
                          type="password"
                          className={tw(
                            "w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors"
                          )}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>

                      {/* remember / forgot */}
                      <div className={tw("flex items-center justify-between")}>
                        <label classNafor me={tw("flex items-center")}>
                          <input
                            type="checkbox"
                            className={tw("mr-2")}
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <span className={tw("text-sm text-gray-600")}>
                            I agree to the terms
                          </span>
                        </label>
                        <Link
                          to="/forgot-password"
                          className={tw(
                            "text-sm text-primary-turquoise hover:underline"
                          )}
                        >
                          Forgot Password?
                        </Link>
                      </div>

                      {/* error msg */}
                      {errorMsg && (
                        <p
                          className={tw(
                            "text-sm text-red-600 text-center mt-2"
                          )}
                        >
                          {errorMsg}
                        </p>
                      )}

                      {/* submit */}
                      <button
                        type="submit"
                        className={tw(
                          "w-full py-3 px-4 font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                        )}
                        style={{
                          background:
                            "linear-gradient(to right, #2dd4bf, #a855f7)",
                          borderRadius: "10px",
                          border: "1px solid black",
                          color: "black",
                        }}
                        disabled={loading}
                      >
                        {loading ? "Logging in…" : "Log in as parent"}
                      </button>
                    </div>
                  </form>

                  <p className={tw("text-center text-gray-600 mt-6")}>
                    First time here?{" "}
                    <Link
                      to="/signup"
                      className={tw("text-primary-turquoise hover:underline")}
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              )}

              {/* ───── Kid form ───── */}
              {activeTab === "kid" && (
                <div className={tw("p-8")}>
                  <h2 className={tw("text-2xl font-bold text-gray-800 mb-2")}>
                    Kid Login
                  </h2>
                  <p className={tw("text-gray-500 mb-2")}>
                    Login to access your AI DIY account.
                  </p>
                  <p className={tw("text-gray-500 mb-2")}>
                    Ask your parent for your username and code.
                  </p>

                  <form onSubmit={handleKidLogin}>
                    {/* username */}
                    <div className={tw("mb-6")}>
                      <label
                        className={tw(
                          "block text-sm font-medium text-gray-700 mb-1"
                        )}
                      >
                        User name
                      </label>
                      <input
                        type="text"
                        placeholder="Your user name"
                        value={kidUsername}
                        onChange={(e) => setKidUsername(e.target.value)}
                        className={tw(
                          "w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors"
                        )}
                        required
                      />
                    </div>

                    {/* 4-digit code */}
                    <div className={tw("flex flex-col items-center mb-6")}>
                      <div className={tw("flex justify-center gap-4 mb-2")}>
                        {kidCode.map((d, idx) => (
                          <input
                            key={idx}
                            id={`code-${idx}`}
                            type={showCode ? "text" : "password"}
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            onChange={(e) =>
                              handleKidCodeChange(idx, e.target.value)
                            }
                            onKeyDown={(e) => handleKidCodeKeyDown(idx, e)}
                            className={tw(
                              "w-12 h-12 text-center text-xl font-bold " +
                                "border-2 border-gray-200 rounded-lg " +
                                "focus:outline-none focus:border-primary-turquoise transition-colors"
                            )}
                          />
                        ))}
                      </div>

                      {/* Text toggle */}
                      <button
                        type="button"
                        onClick={() => setShowCode(!showCode)}
                        className={tw(
                          "text-sm text-primary-turquoise hover:underline"
                        )}
                      >
                        {showCode ? "Hide Code" : "Show Code"}
                      </button>
                      {errorMsg && (
                        <p
                          className={tw(
                            "text-sm text-red-600 text-center mt-2"
                          )}
                        >
                          {errorMsg}
                        </p>
                      )}
                    </div>

                    <label
                      className={tw("flex items-center justify-center mb-6")}
                    >
                      <input type="checkbox" className={tw("mr-2")} />
                      <span className={tw("text-gray-600")}>Remember Me</span>
                    </label>

                    <button
                      type="submit"
                      className={tw(
                        "w-full py-3 px-4 font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                      )}
                      style={{
                        background:
                          "linear-gradient(to right, #2dd4bf, #a855f7)",
                        borderRadius: "10px",
                        border: "1px solid black",
                        color: "black",
                      }}
                      disabled={loading}
                    >
                      {loading ? "Logging in…" : "Log in as kid"}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* ───── Illustration ───── */}
            <div
              className={tw("hidden lg:flex items-center justify-center p-8")}
            >
              <div
                className={tw(
                  "relative w-64 h-96 bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-5 shadow-2xl"
                )}
              >
                <div
                  className={tw(
                    "w-full h-full bg-white rounded-2xl flex items-center justify-center"
                  )}
                >
                  <div className={tw("text-center")}>
                    <div
                      className={tw(
                        "w-20 h-20 mx-auto mb-6 bg-green-400 rounded-full flex items-center justify-center text-white text-3xl animate-pulse"
                      )}
                    >
                      ✓
                    </div>
                    <div className={tw("text-5xl mb-4 opacity-30")}>🔒</div>
                    <div className={tw("flex justify-center gap-2")}>
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          style={{ animationDelay: `${i * 0.2}s` }}
                          className={tw(
                            "w-3 h-3 bg-primary-turquoise rounded-full animate-dot-blink"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* ──── END grid ──── */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
