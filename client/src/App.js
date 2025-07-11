import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import OTPVerification from './components/OTPVerification';
import ForgotPassword from './components/ForgotPassword';
import ProfilePage from './components/ProfilePage';
import ParentSetupPage from './components/ParentSetupPage';
import KidSelectionPage from './components/KidSelectionPage';
import KidAssessmentPage from './components/KidAssessmentPage';
import AssessmentQuiz from './components/AssessmentQuiz';
import ParentDashboard from './components/ParentDashboard';
import KidDashboard from './components/KidDashboard';
import ChoreQuest from './components/ChoreQuest';
import ChatPage from './components/ChatPage';
import WeeklyProgress from "./components/WeeklyProgress";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/otp-verification" element={<OTPVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/parent-setup" element={<ParentSetupPage />} />
            <Route path="/kid-selection" element={<KidSelectionPage />} />
            <Route path="/kid-assessment" element={<KidAssessmentPage />} />
            <Route path="/assessment-quiz" element={<AssessmentQuiz />} />
            <Route path="/parent-dashboard" element={<ParentDashboard />} />
            <Route path="/kid-dashboard" element={<KidDashboard />} />
            <Route path="/chore-quest" element={<ChoreQuest />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/weekly-progress" element={<WeeklyProgress />} />
            <Route path="/features" element={<div>Features Page</div>} />
            <Route path="/about" element={<div>About Us Page</div>} />
            <Route path="/contact" element={<div>Contact Us Page</div>} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
