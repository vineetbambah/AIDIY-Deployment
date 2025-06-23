// src/store/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false, // true once a user logs in successfully
  user: null,             // user object returned by the backend
  token: null,            // JWT or appToken string
  loading: false,         // toggles spinner / disables buttons
  error: null,            // human-readable error message (string | null)
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ----- LOGIN -----
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading        = false;
      state.isAuthenticated = true;
      state.user           = action.payload.user;   // {email, name, …}
      state.token          = action.payload.token;  // appToken / JWT
      state.error          = null;
    },
    loginFailure: (state, action) => {
      state.loading        = false;
      state.isAuthenticated = false;
      state.user           = null;
      state.token          = null;
      state.error          = action.payload;        // e.g. "Invalid credentials"
    },

    // ----- LOGOUT -----
    logout: (state) => {
      state.isAuthenticated = false;
      state.user           = null;
      state.token          = null;
      state.loading        = false;
      state.error          = null;
    },

    // ----- MISC -----
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      // merge new profile fields into the stored user object
      state.user = { ...state.user, ...action.payload };
    },
  },
});

// Action creators
export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  updateUser,
} = authSlice.actions;

// Reducer
export default authSlice.reducer;

// -------------------- Selectors --------------------
export const selectAuth            = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser            = (state) => state.auth.user;
export const selectAuthLoading     = (state) => state.auth.loading;
export const selectAuthError       = (state) => state.auth.error;
