import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null,
  children: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    setChildren: (state, action) => {
      state.children = action.payload;
    },
    addChild: (state, action) => {
      state.children.push(action.payload);
    },
    updateChild: (state, action) => {
      const { id, data } = action.payload;
      const childIndex = state.children.findIndex(child => child.id === id);
      if (childIndex !== -1) {
        state.children[childIndex] = { ...state.children[childIndex], ...data };
      }
    },
    removeChild: (state, action) => {
      state.children = state.children.filter(child => child.id !== action.payload);
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setProfile,
  updateProfile,
  setChildren,
  addChild,
  updateChild,
  removeChild,
} = userSlice.actions;

export default userSlice.reducer;

// Selectors
export const selectUser = (state) => state.user;
export const selectProfile = (state) => state.user.profile;
export const selectChildren = (state) => state.user.children;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error; 