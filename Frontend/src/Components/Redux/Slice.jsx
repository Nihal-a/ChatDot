import { createSlice } from "@reduxjs/toolkit";

const INITIAL_STATE = {
  user: {
    isLoggedIn: false,
    id: null,
    username: null,
    name: null,
    email: null,
    profile: null,
    about: null,
    notfication_count: null,
  },
  AccessToken: null,
};

const Slicer = createSlice({
  name: "ChatDot",
  initialState: INITIAL_STATE,
  reducers: {
    Logout: (state) => {
      // Properly reset the state to initial values
      return INITIAL_STATE;
    },
    login: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };
    },
  },
});

export const { login, Logout } = Slicer.actions;

export default Slicer.reducer;
